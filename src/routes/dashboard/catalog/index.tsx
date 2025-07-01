import { DataTable } from "@/components/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { useBreadcrumbs } from "@/context/breadcrumpst";
import { useTable } from "@/hooks/use-table";
import type { Database } from "@/interface/database.types";
import type { IPaginationResponse } from "@/interface/PaginationProps.interface";
import {
  buildPaginationResponse,
  parsePageParam,
  toRange,
} from "@/lib/pagination";
import { supabase } from "@/supabase";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import { BookOpen, Calendar, Eye, EyeOff, Hash } from "lucide-react";
import { useLayoutEffect, useMemo } from "react";

export const Route = createFileRoute("/dashboard/catalog/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { setBreadcrumbs } = useBreadcrumbs();

  useLayoutEffect(() => {
    setBreadcrumbs([
      {
        id: "dashboard",
        label: "Dashboard",
        href: "/dashboard",
      },
      {
        id: "client",
        label: "Catalogs",
        href: "/dashboard/catalog",
        isActive: true,
      },
    ]);
  }, []);

  const { table, searchParams, queryKey } = useTable({
    columns: [
      {
        accessorKey: "catalog_id",
        header: ({ column }) => (
          <DataTableColumnHeader icon={Hash} column={column} title="ID" />
        ),
        cell: ({ row }) => {
          const id = row.getValue("catalog_id") as number;
          return (
            <Badge variant="secondary" className="font-medium text-sm">
              <Hash className="h-3 w-3" />
              <span className="select-all">{id}</span>
            </Badge>
          );
        },
      },

      {
        accessorKey: "name",
        header: ({ column }) => (
          <DataTableColumnHeader
            icon={BookOpen}
            column={column}
            title="Catalog Name"
          />
        ),
        cell: ({ row }) => {
          const name = row.getValue("name") as string;
          const description = (row.original as any)?.description as
            | string
            | null;

          return (
            <div className="flex flex-row items-center gap-4 min-w-[200px]">
              <div className="flex flex-col gap-1">
                <span
                  className="font-medium text-sm truncate max-w-[200px]"
                  title={name}
                >
                  {name}
                </span>
                {description && (
                  <span
                    className="text-xs text-muted-foreground truncate max-w-[250px]"
                    title={description}
                  >
                    {description}
                  </span>
                )}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "item_count",
        header: ({ column }) => (
          <DataTableColumnHeader
            icon={Hash}
            column={column}
            title="Items Count"
          />
        ),
        cell: ({ row }) => {
          // This would come from a JOIN or separate query counting items in this category
          const itemCount =
            ((row.original as any)?.items?.[0]?.count as number) || 0;

          return (
            <div className="flex items-center gap-2">
              <Badge
                variant={itemCount > 0 ? "default" : "secondary"}
                className="font-medium text-sm"
              >
                {itemCount} {itemCount === 1 ? "item" : "items"}
              </Badge>
            </div>
          );
        },
      },
      {
        accessorKey: "status",
        header: ({ column }) => (
          <DataTableColumnHeader icon={Eye} column={column} title="Status" />
        ),
        cell: ({ row }) => {
          const isVisible = row.getValue("is_catalog_visible") as boolean;

          return (
            <div className="flex items-center gap-2">
              <Badge
                variant={isVisible ? "default" : "secondary"}
                className="font-medium text-sm"
              >
                {isVisible ? (
                  <>
                    <Eye className="h-3 w-3 mr-1" />
                    Enabled
                  </>
                ) : (
                  <>
                    <EyeOff className="h-3 w-3 mr-1" />
                    Disabled
                  </>
                )}
              </Badge>
            </div>
          );
        },
      },
      {
        accessorKey: "created_at",
        header: ({ column }) => (
          <DataTableColumnHeader
            icon={Calendar}
            column={column}
            title="Created At"
          />
        ),
        cell: ({ row }) => {
          const ts = row.getValue("created_at") as string;
          const date = parseISO(ts);

          return (
            <div className="flex flex-col gap-1">
              <span className="font-medium text-sm">
                {format(date, "yyyy-MM-dd hh:mm a")?.toLowerCase()}
              </span>
              <span className="text-xs text-muted-foreground">
                ({formatDistanceToNow(date)} ago)
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "updated_at",
        header: ({ column }) => (
          <DataTableColumnHeader
            icon={Calendar}
            column={column}
            title="Updated At"
          />
        ),
        cell: ({ row }) => {
          const ts = row.getValue("updated_at") as string;
          const date = parseISO(ts);

          return (
            <div className="flex flex-col gap-1">
              <span className="font-medium text-sm">
                {format(date, "yyyy-MM-dd hh:mm a")?.toLowerCase()}
              </span>
              <span className="text-xs text-muted-foreground">
                ({formatDistanceToNow(date)} ago)
              </span>
            </div>
          );
        },
      },
    ],

    baseQueryKey: ["catalog"],
  });

  // const page = Number(searchParams.page) + 1;
  // const limit = 10;
  // const from = (page - 1) * limit;
  // const to = from + limit - 1;

  const page = useMemo(
    () => parsePageParam(searchParams.page),
    [searchParams.page]
  );
  const { from, to } = useMemo(
    () => toRange(page, searchParams.limit),
    [page, searchParams.limit]
  );

  const { data, isLoading, isError } = useQuery<
    IPaginationResponse<Database["public"]["Tables"]["catalog"]["Row"]>
  >({
    queryKey,
    queryFn: async () => {
      const QueryBuilder = supabase
        .from("catalog")
        .select(
          `
          *,
          items:catalog_transitions(count)
          `,
          { count: "exact" }
        )
        .range(from, to);
      if (searchParams.search) {
        // this ORs order_id = X
        if (!isNaN(searchParams.search as any)) {
          QueryBuilder.eq(`catalog_id`, searchParams.search as any);
        }
        if (searchParams.search) {
          QueryBuilder.ilike(`name`, `%${searchParams.search as any}%`);
        }
      }

      if (searchParams.sort) {
        QueryBuilder.order(searchParams.sort.by as any, {
          ascending: searchParams.sort.order === "asc",
        });
      }
      const { data, count, error } = await QueryBuilder;

      if (error) throw error;

      return buildPaginationResponse(data, searchParams, count);
    },
  });
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between sticky top-[52px] py-3 bg-background/20 backdrop-blur-xl z-[100] md:px-8 px-4">
        <CardTitle>Catalogs Management</CardTitle>
        <Button variant={"outline"}>Create Product</Button>
      </div>
      <div className="md:px-8 px-4">
        <Card>
          <CardContent>
            <DataTable
              // @ts-ignore
              data={data}
              table={table}
              isLoading={isLoading}
              isError={isError}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
