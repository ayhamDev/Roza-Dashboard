import { CatalogStatsCards } from "@/components/card/catalog-stats-cards";
import { DataTable } from "@/components/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { DataTableRowActions } from "@/components/data-table/data-table-row-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { useBreadcrumbs } from "@/context/breadcrumpst";
import { useSheet } from "@/context/sheets";
import { useTable } from "@/hooks/use-table";
import type { Database } from "@/interface/database.types";
import type { IPaginationResponse } from "@/interface/PaginationProps.interface";
import type { RowActionItem } from "@/interface/RowAction.interface";
import {
  buildPaginationResponse,
  parsePageParam,
  toRange,
} from "@/lib/pagination";
import { supabase } from "@/supabase";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import {
  Activity,
  BookOpen,
  Calendar,
  Delete,
  Edit,
  Eye,
  FileEdit,
  Hash,
  Plus,
} from "lucide-react";
import { useLayoutEffect, useMemo } from "react";

export const Route = createFileRoute("/dashboard/catalog/")({
  component: RouteComponent,
});
const getStatusInfo = (status: string) => {
  switch (status) {
    case "enabled":
      return {
        icon: <Activity className="h-4 w-4 text-green-500" />,
        label: "Enabled",
      };
    case "disabled":
      return {
        icon: <Activity className="h-4 w-4 text-red-500" />,
        label: "Disabled",
      };
    default:
      return {
        icon: <FileEdit className="h-4 w-4 text-yellow-500" />,
        label: "Draft",
      };
  }
};

function RouteComponent() {
  const { setBreadcrumbs } = useBreadcrumbs();
  const { openSheet } = useSheet();
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
          return (
            <Badge variant={"secondary"} className="flex items-center gap-2">
              {getStatusInfo(row.getValue("status") as string).icon}
              {getStatusInfo(row.getValue("status") as string).label}
            </Badge>
          );
        },
      },
      {
        id: "actions",
        cell: ({ row }) => {
          const actions: RowActionItem<any>[] = [
            {
              icon: Eye,
              label: "View ",
              action: (row) => {
                return openSheet("catalog:view", {
                  id: row.getValue("catalog_id") as string,
                });
              },
            },
            {
              icon: Edit,
              label: "Edit",
              action: (row) => {
                return openSheet("catalog:update", {
                  id: row.getValue("catalog_id") as string,
                });
              },
            },
            {
              isSeparator: true,
            },
            {
              icon: Delete,
              label: "Delete ",
              action: (row) => {
                console.log(row);
              },
            },
          ];
          return <DataTableRowActions row={row} actions={actions} />;
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
      <div className="flex items-center justify-between py-3 bg-background/20 backdrop-blur-xl  md:px-8 px-4 min-h-[64px]">
        <CardTitle>Catalogs Management</CardTitle>
        <Button
          variant={"default"}
          className="cursor-pointer"
          onClick={() => {
            openSheet("catalog:create");
          }}
        >
          <Plus />
          Create Catalog
        </Button>
      </div>
      <div className="md:px-8 px-4">
        <CatalogStatsCards />
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
