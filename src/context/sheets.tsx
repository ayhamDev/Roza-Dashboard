import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";

import CreateClientSheet from "@/components/sheets/client/Create";
import UpdateClientSheet from "@/components/sheets/client/Update";
import ViewClientSheet from "@/components/sheets/client/View";

export type Sheets = "client:create" | "client:update" | "client:view";

interface SheetState {
  sheet: Sheets;
  props: Record<string, unknown>;
  open: boolean;
  id: string;
}

export interface SheetContextType {
  stack: SheetState[];
  openSheet: (sheet: Sheets, props?: Record<string, unknown>) => void;
  closeSheet: (id: string) => void;
  closeSpecific: (sheet: Sheets) => void;
  clearAllSheets: () => void;
  restoreSheet: (id: string) => void;
}

interface URLPersistenceConfig {
  enabled: boolean;
  paramName: string;
  compressData: boolean;
  maxUrlLength: number;
}

const defaultURLConfig: URLPersistenceConfig = {
  enabled: true,
  paramName: "sheets",
  compressData: true,
  maxUrlLength: 2000, // Stay under most URL length limits
};

const SheetContext = createContext<SheetContextType | undefined>(undefined);

// URL persistence utilities
const encodeSheetData = (
  stack: SheetState[],
  config: URLPersistenceConfig
): string => {
  try {
    const data = stack.map(({ sheet, props, open, id }) => ({
      s: sheet, // shortened keys to reduce URL length
      p: props,
      o: open,
      i: id,
    }));

    const jsonString = JSON.stringify(data);

    if (config.compressData) {
      // Simple compression: encode to base64
      return btoa(jsonString);
    }

    return encodeURIComponent(jsonString);
  } catch (error) {
    console.warn("Failed to encode sheet data:", error);
    return "";
  }
};

const decodeSheetData = (
  encoded: string,
  config: URLPersistenceConfig
): SheetState[] => {
  try {
    if (!encoded) return [];

    let jsonString: string;

    if (config.compressData) {
      jsonString = atob(encoded);
    } else {
      jsonString = decodeURIComponent(encoded);
    }

    const data = JSON.parse(jsonString);

    return data.map((item: any) => ({
      sheet: item.s,
      props: item.p || {},
      open: item.o,
      id: item.i,
    }));
  } catch (error) {
    console.warn("Failed to decode sheet data:", error);
    return [];
  }
};

const updateURL = (stack: SheetState[], config: URLPersistenceConfig) => {
  if (!config.enabled || typeof window === "undefined") return;

  try {
    const url = new URL(window.location.href);

    if (stack.length === 0) {
      url.searchParams.delete(config.paramName);
    } else {
      const encoded = encodeSheetData(stack, config);

      // Check URL length limit
      const testUrl = new URL(window.location.href);
      testUrl.searchParams.set(config.paramName, encoded);

      if (testUrl.href.length > config.maxUrlLength) {
        console.warn("Sheet data too large for URL, skipping persistence");
        return;
      }

      url.searchParams.set(config.paramName, encoded);
    }

    // Update URL without triggering navigation
    window.history.pushState({}, "", url.toString());
  } catch (error) {
    console.warn("Failed to update URL:", error);
  }
};

const loadFromURL = (config: URLPersistenceConfig): SheetState[] => {
  if (!config.enabled || typeof window === "undefined") return [];

  try {
    const params = new URLSearchParams(window.location.search);
    const encoded = params.get(config.paramName);

    if (!encoded) return [];

    return decodeSheetData(encoded, config);
  } catch (error) {
    console.warn("Failed to load from URL:", error);
    return [];
  }
};

export function SheetProvider({
  children,
  urlConfig = defaultURLConfig,
}: {
  children: ReactNode;
  urlConfig?: Partial<URLPersistenceConfig>;
}) {
  const config = { ...defaultURLConfig, ...urlConfig };
  const [stack, setStack] = useState<SheetState[]>([]);
  const [initialized, setInitialized] = useState(false);

  // Load sheets from URL on mount
  useEffect(() => {
    if (config.enabled) {
      const urlSheets = loadFromURL(config);
      if (urlSheets.length > 0) {
        setStack(urlSheets);
      }
    }
    setInitialized(true);
  }, []);

  // Update URL whenever stack changes (debounced)
  useEffect(() => {
    if (!initialized) return;

    const timeoutId = setTimeout(() => {
      updateURL(stack, config);
    }, 100); // Debounce to avoid excessive URL updates

    return () => clearTimeout(timeoutId);
  }, [stack, initialized]);

  // Listen for browser back/forward navigation
  useEffect(() => {
    if (!config.enabled) return;

    const handlePopState = () => {
      const urlSheets = loadFromURL(config);
      setStack(urlSheets);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [config.enabled]);

  const generateId = () => Math.random().toString(36).substring(2, 9);

  const openSheet = useCallback(
    (sheet: Sheets, props: Record<string, unknown> = {}) => {
      const id = generateId();
      const newSheet: SheetState = {
        sheet,
        props,
        open: true,
        id,
      };

      setStack((prev) => [...prev, newSheet]);
    },
    []
  );

  const closeSheet = useCallback((id: string) => {
    setStack((prev) =>
      prev.map((sheet) => (sheet.id === id ? { ...sheet, open: false } : sheet))
    );
  }, []);

  const closeSpecific = useCallback((sheet: Sheets) => {
    setStack((prev) =>
      prev.map((s) => (s.sheet === sheet ? { ...s, open: false } : s))
    );
  }, []);

  const clearAllSheets = useCallback(() => {
    setStack([]);
  }, []);

  const restoreSheet = useCallback((id: string) => {
    setStack((prev) =>
      prev.map((sheet) => (sheet.id === id ? { ...sheet, open: true } : sheet))
    );
  }, []);

  const removeClosedSheet = useCallback((id: string) => {
    setStack((prev) => prev.filter((sheet) => sheet.id !== id));
  }, []);

  const contextValue: SheetContextType = {
    stack,
    openSheet,
    closeSheet,
    closeSpecific,
    clearAllSheets,
    restoreSheet,
  };

  const sheetComponents: Record<Sheets, React.ComponentType<any>> = {
    "client:create": CreateClientSheet,
    "client:update": UpdateClientSheet,
    "client:view": ViewClientSheet,
  };

  return (
    <SheetContext.Provider value={contextValue}>
      {children}

      {stack.map(({ sheet, props, open, id }) => {
        const SheetComp = sheetComponents[sheet];
        return (
          <SheetComp
            key={id}
            {...props}
            open={open}
            onOpenChange={(isOpen: any) => {
              if (!isOpen) {
                closeSheet(id);
                setTimeout(() => removeClosedSheet(id), 300);
              }
            }}
          />
        );
      })}
    </SheetContext.Provider>
  );
}

export function useSheet() {
  const ctx = useContext(SheetContext);
  if (!ctx) {
    throw new Error("useSheet must be used within a SheetProvider");
  }
  return ctx;
}

// Hook for URL-specific utilities
export function useSheetURL() {
  const ctx = useSheet();

  const getShareableURL = useCallback(() => {
    return window.location.href;
  }, []);

  const clearURL = useCallback(() => {
    const url = new URL(window.location.href);
    url.searchParams.delete("sheets");
    window.history.replaceState({}, "", url.toString());
  }, []);

  return {
    ...ctx,
    getShareableURL,
    clearURL,
    hasURLData: () => new URLSearchParams(window.location.search).has("sheets"),
  };
}
