"use client";

import { type SearchParams } from "@/lib/buildSearchParams";
import {
  type ColumnDef,
  type SortingState,
  type Updater,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useQueryState } from "nuqs";
import { useEffect, useMemo, useState } from "react";

interface UseTableOptions<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  baseQueryKey?: unknown[];
  extraFilters?: Record<string, string>;
}

const DEFAULT_PAGE_SIZE = 10;

export function useTable<TData, TValue>({
  columns,
  baseQueryKey = ["table"],
  extraFilters,
}: UseTableOptions<TData, TValue>) {
  const keyPrefix = baseQueryKey[0] as string;

  const [pageIndex, setPageIndex] = useQueryState("page", {
    defaultValue: 1,
    parse: Number,
    serialize: String,
  });

  const [localPageSize, setLocalPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [pageSize, setPageSize] = useQueryState("limit", {
    defaultValue: localPageSize,
    parse: Number,
    serialize: String,
  });

  const [sortBy, setSortBy] = useQueryState("sort[by]", {
    defaultValue: null,
    parse: String,
    serialize: String,
  });

  const [sortOrder, setSortOrder] = useQueryState("sort[order]", {
    defaultValue: null,
    parse: String,
    serialize: String,
  });
  const [globalFilter, setGlobalFilter] = useQueryState("search", {
    defaultValue: "",
    parse: String,
    serialize: String,
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedPageSize = localStorage.getItem(`tablePageSize[${keyPrefix}]`);
      const savedSortBy = localStorage.getItem(`tableSortBy[${keyPrefix}]`);
      const savedSortOrder = localStorage.getItem(
        `tableSortOrder[${keyPrefix}]`
      );

      if (savedPageSize) {
        const parsed = parseInt(savedPageSize);
        if (!isNaN(parsed)) {
          setLocalPageSize(parsed);
          setPageSize(parsed);
        }
      }

      if (savedSortBy && savedSortOrder) {
        setSortBy(savedSortBy);
        setSortOrder(savedSortOrder);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sorting: SortingState = useMemo(() => {
    if (!sortBy) return [];
    return [{ id: sortBy, desc: sortOrder === "desc" }];
  }, [sortBy, sortOrder]);

  const onSortingChange = (updater: Updater<SortingState>) => {
    const newSorting =
      typeof updater === "function" ? updater(sorting) : updater;

    if (newSorting.length > 0) {
      const newSortBy = String(newSorting[0].id);
      const newSortOrder = newSorting[0].desc ? "desc" : "asc";

      setSortBy(newSortBy);
      setSortOrder(newSortOrder);

      if (typeof window !== "undefined") {
        localStorage.setItem(`tableSortBy[${keyPrefix}]`, newSortBy);
        localStorage.setItem(`tableSortOrder[${keyPrefix}]`, newSortOrder);
      }
    } else {
      setSortBy(null);
      setSortOrder(null);

      if (typeof window !== "undefined") {
        localStorage.removeItem(`tableSortBy[${keyPrefix}]`);
        localStorage.removeItem(`tableSortOrder[${keyPrefix}]`);
      }
    }
  };

  const table = useReactTable({
    data: [],
    columns,
    pageCount: -1,
    state: {
      pagination: { pageIndex, pageSize },
      sorting,
      globalFilter,
    },
    manualPagination: true,
    manualSorting: true,
    getCoreRowModel: getCoreRowModel(),
    onPaginationChange: (updater) => {
      const newPagination =
        typeof updater === "function"
          ? updater({ pageIndex: pageIndex - 1, pageSize })
          : updater;

      const newPageSize = newPagination.pageSize;
      const newPageIndex = newPagination.pageIndex + 1;

      if (typeof window !== "undefined") {
        localStorage.setItem(
          `tablePageSize[${keyPrefix}]`,
          String(newPageSize)
        );
      }

      setLocalPageSize(newPageSize);
      setPageSize(newPageSize);
      setPageIndex(newPageIndex);
    },
    onSortingChange,
    onGlobalFilterChange: setGlobalFilter,
  });

  const searchParams: SearchParams = useMemo(() => {
    const baseFilters = table.getState().columnFilters.reduce(
      (acc, filter) => {
        acc[`filter[${filter.id}]`] = (filter.value as any)?.join(
          ","
        ) as string;
        return acc;
      },
      {} as Record<string, string>
    );

    const combinedFilters = {
      ...baseFilters,
      ...(extraFilters ?? {}),
    };

    return {
      page: pageIndex - 1,
      limit: pageSize,
      sort: sortBy
        ? { by: String(sortBy), order: sortOrder === "desc" ? "desc" : "asc" }
        : undefined,
      search: globalFilter || undefined,
      filter: combinedFilters,
    };
  }, [
    pageIndex,
    pageSize,
    sortBy,
    sortOrder,
    globalFilter,
    table.getState().columnFilters,
    extraFilters,
  ]);

  useEffect(() => {
    console.log(searchParams);
  }, [searchParams]);

  const queryKey = useMemo(
    () => [...baseQueryKey, searchParams] as string[],
    [baseQueryKey, searchParams]
  );

  return {
    table,
    searchParams,
    queryKey,
  };
}
