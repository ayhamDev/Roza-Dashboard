"use client";

import { flexRender, type Table as TableType } from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { type IPaginationResponse } from "@/interface/PaginationProps.interface";
import { type JSX, useMemo } from "react";
import DataTableFilters from "./data-table-filters";
import DataTableGlobalActions from "./data-table-global-actions";
import { DataTablePagination } from "./data-table-pagination";
import { DataTableViewOptions } from "./data-table-view-options";

export interface IfacetedFilters {
  column: string;
  title: string;
  options: {
    label: string;
    value: string;
    icon?: React.ComponentType<{ className?: string }>;
  }[];
}
export interface IDataTableAction {
  label: string;
  icon: JSX.Element;
  onClick: () => void;
}
interface DataTableProps<TData> {
  table: TableType<TData>;
  data: IPaginationResponse<TData> | undefined;
  globalActions?: IDataTableAction[];
  facetedFilters?: IfacetedFilters[];
  isLoading: boolean;
  isError: boolean;
}

export function DataTable<TData>({
  table,
  data,
  facetedFilters,
  globalActions,
  isLoading,
  isError,
}: DataTableProps<TData>) {
  const docs = useMemo(() => data?.docs || [], [data?.docs]);
  const pageCount = useMemo(() => data?.totalPages, [data?.totalPages]);

  table.setOptions((prev) => ({
    ...prev,
    data: docs,
    pageCount: pageCount,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <DataTableFilters table={table} facetedFilters={facetedFilters || []} />
        <div className="flex items-center justify-center gap-2">
          {globalActions && globalActions.length > 0 && (
            <DataTableGlobalActions table={table} actions={globalActions} />
          )}
          <DataTableViewOptions table={table} />
        </div>
      </div>

      <div className="grid grid-cols-1 overflow-auto  max-h-max w-full custom-scrollbar rounded-md">
        <Table className="w-full">
          <TableHeader className="dark:bg-accent/45 bg-accent/20 backdrop-blur-lg sticky top-[2px] z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header, idx) => (
                  <TableHead
                    key={header.id}
                    className={idx === 0 ? "pl-6" : ""}
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody className="dark:bg-accent/30 bg-accent/10">
            {isLoading ? (
              Array.from({ length: table.getState().pagination.pageSize }).map(
                (_, i) => (
                  <TableRow key={i}>
                    {table.getAllColumns().map((_, ci) => (
                      <TableCell
                        key={ci}
                        className={`py-4 ${ci === 0 ? "pl-6" : ""}`}
                      >
                        <div className="h-5 w-full animate-pulse rounded bg-muted" />
                      </TableCell>
                    ))}
                  </TableRow>
                )
              )
            ) : isError ? (
              <TableRow>
                <TableCell
                  colSpan={table.getAllColumns().length}
                  className="h-24 text-center"
                >
                  Error loading data.
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell, idx) => (
                    <TableCell
                      key={cell.id}
                      className={idx === 0 ? "pl-6" : ""}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={table.getAllColumns().length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <DataTablePagination table={table} />
    </div>
  );
}
