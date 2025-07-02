import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";

import CreateClientSheet from "@/components/sheets/client/Create";
import UpdateClientSheet from "@/components/sheets/client/Update";
import ViewClientSheet from "@/components/sheets/client/View";
import CreateCategorySheet from "@/components/sheets/category/Create";
import UpdateCategorySheet from "@/components/sheets/category/Update";
import ViewCategorySheet from "@/components/sheets/category/View";
import CreateProductSheet from "@/components/sheets/product/Create";
import UpdateProductSheet from "@/components/sheets/product/Update";
import ViewProductSheet from "@/components/sheets/product/View";
import ViewCatalogSheet from "@/components/sheets/catalog/View";
import UpdateCatalogSheet from "@/components/sheets/catalog/Update";
import CreateCatalogSheet from "@/components/sheets/catalog/Create";
import ViewOrderSheet from "@/components/sheets/order/View";
import UpdateOrderSheet from "@/components/sheets/order/Update";
import CreateOrderSheet from "@/components/sheets/order/Create";

export type Sheets =
  | "client:create"
  | "client:update"
  | "client:view"
  | "category:create"
  | "category:update"
  | "category:view"
  | "product:create"
  | "product:update"
  | "product:view"
  | "catalog:create"
  | "catalog:update"
  | "catalog:view"
  | "order:create"
  | "order:update"
  | "order:view";

const sheetComponents: Record<Sheets, React.ComponentType<any>> = {
  // Client
  "client:create": CreateClientSheet,
  "client:update": UpdateClientSheet,
  "client:view": ViewClientSheet,
  // Category
  "category:create": CreateCategorySheet,
  "category:update": UpdateCategorySheet,
  "category:view": ViewCategorySheet,
  // product
  "product:create": CreateProductSheet,
  "product:update": UpdateProductSheet,
  "product:view": ViewProductSheet,

  // catalog
  "catalog:create": CreateCatalogSheet,
  "catalog:update": UpdateCatalogSheet,
  "catalog:view": ViewCatalogSheet,

  // order
  "order:create": CreateOrderSheet,
  "order:update": UpdateOrderSheet,
  "order:view": ViewOrderSheet,
};

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
  maxUrlLength: 3000,
};

const SheetContext = createContext<SheetContextType | undefined>(undefined);

// --- Helper functions (encode, decode, loadFromURL) are unchanged ---
const encodeSheetData = (
  stack: SheetState[],
  config: URLPersistenceConfig
): string => {
  try {
    const dataToStore = stack
      .filter(({ open }) => open)
      .map(({ sheet, props, id }) => ({ s: sheet, p: props, i: id }));
    if (dataToStore.length === 0) return "";
    const jsonString = JSON.stringify(dataToStore);
    return config.compressData
      ? btoa(jsonString)
      : encodeURIComponent(jsonString);
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
    const jsonString = config.compressData
      ? atob(encoded)
      : decodeURIComponent(encoded);
    const data = JSON.parse(jsonString);
    return data.map((item: any) => ({
      sheet: item.s,
      props: item.p || {},
      open: true,
      id: item.i,
    }));
  } catch (error) {
    console.warn("Failed to decode sheet data:", error);
    return [];
  }
};

const updateURL = (
  stack: SheetState[],
  config: URLPersistenceConfig,
  replace: boolean
) => {
  if (!config.enabled || typeof window === "undefined") return;
  try {
    const url = new URL(window.location.href);
    const encoded = encodeSheetData(stack, config);
    if (!encoded) {
      url.searchParams.delete(config.paramName);
    } else {
      const testUrl = new URL(window.location.href);
      testUrl.searchParams.set(config.paramName, encoded);
      if (testUrl.href.length > config.maxUrlLength) {
        console.warn("Sheet data too large for URL, skipping persistence");
        return;
      }
      url.searchParams.set(config.paramName, encoded);
    }
    if (replace) {
      window.history.replaceState({ sheetStack: encoded }, "", url.toString());
    } else {
      window.history.pushState({ sheetStack: encoded }, "", url.toString());
    }
  } catch (error) {
    console.warn("Failed to update URL:", error);
  }
};

const loadFromURL = (config: URLPersistenceConfig): SheetState[] => {
  if (!config.enabled || typeof window === "undefined") return [];
  try {
    const encoded = new URLSearchParams(window.location.search).get(
      config.paramName
    );
    return encoded ? decodeSheetData(encoded, config) : [];
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
  const previousOpenCountRef = useRef(0);

  const removeClosedSheet = useCallback((id: string) => {
    setStack((prev) => prev.filter((s) => s.id !== id));
  }, []);

  useEffect(() => {
    if (config.enabled) {
      const urlSheets = loadFromURL(config);
      if (urlSheets.length > 0) {
        setStack(urlSheets);
        previousOpenCountRef.current = urlSheets.length;
      }
    }
    setInitialized(true);
  }, [config.enabled]);

  // --- CHANGED: This useEffect now pushes state whenever a sheet is added ---
  useEffect(() => {
    if (!initialized) return;

    const openCount = stack.filter((s) => s.open).length;

    // We PUSH a new history state whenever the number of open sheets increases.
    const shouldPushState = openCount > previousOpenCountRef.current;

    // We use replaceState for all other cases (like when a closing animation finishes
    // and the sheet is removed from the stack) to avoid adding junk to the history.
    const shouldReplaceState = !shouldPushState;

    updateURL(stack, config, shouldReplaceState);

    // Update the ref for the next render cycle.
    previousOpenCountRef.current = openCount;
  }, [stack, initialized, config]);

  // The popstate handler is robust and remains unchanged. It correctly handles
  // the state changes when the user navigates with the back/forward buttons.
  useEffect(() => {
    if (!config.enabled) return;
    const handlePopState = () => {
      const urlSheets = loadFromURL(config);
      const urlSheetIds = new Set(urlSheets.map((s) => s.id));
      setStack((currentStack) => {
        const nextStack: SheetState[] = [];
        const currentSheetIds = new Set<string>();
        currentStack.forEach((currentSheet) => {
          currentSheetIds.add(currentSheet.id);
          if (urlSheetIds.has(currentSheet.id)) {
            nextStack.push({ ...currentSheet, open: true });
          } else if (currentSheet.open) {
            nextStack.push({ ...currentSheet, open: false });
            setTimeout(() => removeClosedSheet(currentSheet.id), 500);
          }
        });
        urlSheets.forEach((urlSheet) => {
          if (!currentSheetIds.has(urlSheet.id)) {
            nextStack.push(urlSheet);
          }
        });
        return nextStack;
      });
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [config, removeClosedSheet]);

  const generateId = () => Math.random().toString(36).substring(2, 9);

  const openSheet = useCallback(
    (sheet: Sheets, props: Record<string, unknown> = {}) => {
      const id = generateId();
      setStack((prev) => [...prev, { sheet, props, open: true, id }]);
    },
    []
  );

  // --- MODIFIED: This function now handles the edge case ---
  const closeSheet = useCallback(
    (id: string) => {
      // Only call history.back() if there's a previous entry in the session history.
      if (window.history.length > 2) {
        window.history.back();
      } else {
        // Fallback: Manually trigger the close sequence without using history.
        // 1. Set the sheet's state to `open: false` to trigger exit animations.
        setStack((prev) =>
          prev.map((s) => (s.id === id ? { ...s, open: false } : s))
        );

        // 2. After the animation, call removeClosedSheet to remove the component.
        setTimeout(() => removeClosedSheet(id), 500); // Animation duration
      }
    },
    [removeClosedSheet]
  );

  const closeSpecific = useCallback(
    (sheet: Sheets) => {
      // This is now simple: find an open sheet of the specified type and close it.
      // The `closeSheet` function will handle the history navigation.
      const sheetToClose = stack.find((s) => s.sheet === sheet && s.open);
      if (sheetToClose) {
        closeSheet(sheetToClose.id);
      }
    },
    [stack, closeSheet]
  );

  const clearAllSheets = useCallback(() => {
    // Find the first sheet in the stack and navigate back from it.
    // The popstate handler will see the base URL and close everything.
    if (stack.some((s) => s.open)) {
      window.history.back();
    }
  }, [stack]);

  const restoreSheet = useCallback((id: string) => {
    setStack((prev) =>
      prev.map((s) => (s.id === id ? { ...s, open: true } : s))
    );
  }, []);

  const contextValue: SheetContextType = {
    stack,
    openSheet,
    closeSheet,
    closeSpecific,
    clearAllSheets,
    restoreSheet,
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
            onOpenChange={(isOpen: boolean) => {
              if (!isOpen) {
                // This now correctly calls our new history-aware closeSheet function.
                closeSheet(id);
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
  if (!ctx) throw new Error("useSheet must be used within a SheetProvider");
  return ctx;
}

export function useSheetURL() {
  const ctx = useSheet();
  const getShareableURL = useCallback(() => window.location.href, []);
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
