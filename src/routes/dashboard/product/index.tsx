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
import { getImageUrl } from "@/lib/GetImageUrl";
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
  Calendar,
  Delete,
  DollarSign,
  Edit,
  ExternalLink,
  Eye,
  EyeOff,
  Hash,
  ImageIcon,
  Package,
  Plus,
  Tag,
} from "lucide-react";
import { useLayoutEffect, useMemo } from "react";

export const Route = createFileRoute("/dashboard/product/")({
  component: RouteComponent,
});

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
        label: "Products",
        href: "/dashboard/products",
        isActive: true,
      },
    ]);
  }, []);

  const { table, searchParams, queryKey } = useTable({
    columns: [
      {
        accessorKey: "item_id",
        header: ({ column }) => (
          <DataTableColumnHeader icon={Hash} column={column} title="ID" />
        ),
        cell: ({ row }) => {
          const id = row.getValue("item_id") as number;
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
            icon={Package}
            column={column}
            title="Product"
          />
        ),
        cell: ({ row }) => {
          const name = row.getValue("name") as string;
          const description = (row.original as any)?.description as
            | string
            | null;
          const imageUrl = (row.original as any).image_url as string | null;

          return (
            <div className="flex flex-row items-center gap-4 min-w-[200px]">
              {imageUrl ? (
                <img
                  src={getImageUrl(imageUrl) || "/placeholder.svg"}
                  alt={name}
                  width={64}
                  height={64}
                  className="rounded-md object-cover border"
                />
              ) : (
                <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center">
                  <ImageIcon className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
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
        accessorKey: "category_id",
        header: ({ column }) => (
          <DataTableColumnHeader icon={Tag} column={column} title="Category" />
        ),
        cell: ({ row }) => {
          const category = (row.original as any)
            ?.item_category as Database["public"]["Tables"]["item_category"]["Row"];
          return (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="font-medium text-sm cursor-pointer select-none max-w-[150px] truncate bg-transparent"
                title="Open Category"
                onClick={() => {
                  openSheet("category:view", { id: row.original.category_id });
                }}
              >
                <span className="truncate max-w-[120px]">{category?.name}</span>
                <ExternalLink className="h-3 w-3 ml-1" />
              </Button>
            </div>
          );
        },
      },
      {
        accessorKey: "cost_price",
        header: ({ column }) => (
          <DataTableColumnHeader
            icon={DollarSign}
            column={column}
            title="Cost Price"
          />
        ),
        cell: ({ row }) => {
          const price = row.getValue("cost_price") as number;
          const formatted = price?.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          });

          return (
            <Badge variant="outline">
              <DollarSign className="h-3 w-3 " />
              {formatted}
            </Badge>
          );
        },
      },
      {
        accessorKey: "retail_price",
        header: ({ column }) => (
          <DataTableColumnHeader
            icon={DollarSign}
            column={column}
            title="Retail Price"
          />
        ),
        cell: ({ row }) => {
          const price = row.getValue("retail_price") as number;
          const formatted = price?.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          });

          return (
            <Badge variant="outline">
              <DollarSign className="h-3 w-3 " />
              {formatted}
            </Badge>
          );
        },
      },
      {
        accessorKey: "wholesale_price",
        header: ({ column }) => (
          <DataTableColumnHeader
            icon={DollarSign}
            column={column}
            title="Wholesale Price"
          />
        ),
        cell: ({ row }) => {
          const price = row.getValue("wholesale_price") as number;
          const formatted = price?.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          });

          return (
            <Badge variant="outline">
              <DollarSign className="h-3 w-3 " />
              {formatted}
            </Badge>
          );
        },
      },
      {
        accessorKey: "stock_quantity",
        header: ({ column }) => (
          <DataTableColumnHeader icon={Hash} column={column} title="Stock" />
        ),
        cell: ({ row }) => {
          const quantity = row.getValue("stock_quantity") as number;
          const isOutOfStock = quantity === 0;

          return (
            <div className="flex items-center gap-2">
              <Badge
                variant={isOutOfStock ? "destructive" : "default"}
                className="font-medium text-sm"
              >
                {isOutOfStock ? "Out of Stock" : "In Stock"}
              </Badge>
            </div>
          );
        },
      },
      {
        accessorKey: "is_catalog_visible",
        header: ({ column }) => (
          <DataTableColumnHeader
            icon={Eye}
            column={column}
            title="Visibility"
          />
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
                    Visible
                  </>
                ) : (
                  <>
                    <EyeOff className="h-3 w-3 mr-1" />
                    Hidden
                  </>
                )}
              </Badge>
            </div>
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
                return openSheet("product:view", {
                  id: row.getValue("item_id") as string,
                });
              },
            },
            {
              icon: Edit,
              label: "Edit",
              action: (row) => {
                return openSheet("product:update", {
                  id: row.getValue("item_id") as string,
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
            <div className="flex items-center gap-2">
              {format(date, "yyyy-MM-dd hh:mm a")?.toLowerCase()}
              <span className="text-muted-foreground">
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
            <div className="flex items-center gap-2">
              {format(date, "yyyy-MM-dd hh:mm a")?.toLowerCase()}
              <span className="text-muted-foreground">
                ({formatDistanceToNow(date)} ago)
              </span>
            </div>
          );
        },
      },
    ],

    baseQueryKey: ["product"],
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
    IPaginationResponse<Database["public"]["Tables"]["item"]["Row"]>
  >({
    queryKey,
    queryFn: async () => {
      const QueryBuilder = supabase
        .from("item")
        .select(
          `
          *,
          item_category!inner(name)`,
          { count: "exact" }
        )
        .range(from, to);
      if (searchParams.search) {
        // this ORs order_id = X
        if (!isNaN(searchParams.search as any)) {
          QueryBuilder.eq(`item_id`, searchParams.search as any);
        }
      }

      if (searchParams.filter?.["filter[status]"]) {
        console.log(searchParams.filter?.["filter[status]"]);

        QueryBuilder.in("status", [
          searchParams.filter?.["filter[status]"].split(",") as any,
        ]);
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
        <CardTitle>Products Management</CardTitle>
        <Button
          variant={"default"}
          className="cursor-pointer"
          onClick={() => openSheet("product:create")}
        >
          <Plus />
          Create Product
        </Button>
      </div>
      <div className="md:px-8 px-4">
        <Card>
          <CardContent>
            <DataTable
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
