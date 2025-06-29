"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";

// Types for breadcrumb items
export interface BreadcrumbItem {
  id: string;
  label: string;
  href?: string;
  isActive?: boolean;
}

// Context value interface
interface BreadcrumbsContextValue {
  breadcrumbs: BreadcrumbItem[];
  setBreadcrumbs: (breadcrumbs: BreadcrumbItem[]) => void;
  addBreadcrumb: (breadcrumb: BreadcrumbItem) => void;
  removeBreadcrumb: (id: string) => void;
  updateBreadcrumb: (id: string, updates: Partial<BreadcrumbItem>) => void;
  clearBreadcrumbs: () => void;
  setActiveBreadcrumb: (id: string) => void;
}

// Create the context
const BreadcrumbsContext = createContext<BreadcrumbsContextValue | undefined>(
  undefined
);

// Provider component
interface BreadcrumbsProviderProps {
  children: ReactNode;
  initialBreadcrumbs?: BreadcrumbItem[];
}

export function BreadcrumbsProvider({
  children,
  initialBreadcrumbs = [],
}: BreadcrumbsProviderProps) {
  const [breadcrumbs, setBreadcrumbsState] =
    useState<BreadcrumbItem[]>(initialBreadcrumbs);

  // Set breadcrumbs completely
  const setBreadcrumbs = useCallback((newBreadcrumbs: BreadcrumbItem[]) => {
    setBreadcrumbsState(newBreadcrumbs);
  }, []);

  // Add a single breadcrumb
  const addBreadcrumb = useCallback((breadcrumb: BreadcrumbItem) => {
    setBreadcrumbsState((prev) => {
      // Check if breadcrumb with same id already exists
      const existingIndex = prev.findIndex((item) => item.id === breadcrumb.id);
      if (existingIndex !== -1) {
        // Update existing breadcrumb
        const updated = [...prev];
        updated[existingIndex] = breadcrumb;
        return updated;
      }
      // Add new breadcrumb
      return [...prev, breadcrumb];
    });
  }, []);

  // Remove a breadcrumb by id
  const removeBreadcrumb = useCallback((id: string) => {
    setBreadcrumbsState((prev) => prev.filter((item) => item.id !== id));
  }, []);

  // Update a specific breadcrumb
  const updateBreadcrumb = useCallback(
    (id: string, updates: Partial<BreadcrumbItem>) => {
      setBreadcrumbsState((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
      );
    },
    []
  );

  // Clear all breadcrumbs
  const clearBreadcrumbs = useCallback(() => {
    setBreadcrumbsState([]);
  }, []);

  // Set active breadcrumb (mark one as active, others as inactive)
  const setActiveBreadcrumb = useCallback((id: string) => {
    setBreadcrumbsState((prev) =>
      prev.map((item) => ({
        ...item,
        isActive: item.id === id,
      }))
    );
  }, []);

  const value: BreadcrumbsContextValue = {
    breadcrumbs,
    setBreadcrumbs,
    addBreadcrumb,
    removeBreadcrumb,
    updateBreadcrumb,
    clearBreadcrumbs,
    setActiveBreadcrumb,
  };

  return (
    <BreadcrumbsContext.Provider value={value}>
      {children}
    </BreadcrumbsContext.Provider>
  );
}

// Custom hook to use the breadcrumbs context
export function useBreadcrumbs() {
  const context = useContext(BreadcrumbsContext);

  if (context === undefined) {
    throw new Error("useBreadcrumbs must be used within a BreadcrumbsProvider");
  }

  return context;
}
