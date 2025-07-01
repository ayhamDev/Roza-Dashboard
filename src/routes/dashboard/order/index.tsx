import { AppStatusBadge, statusConfig } from "@/components/app/AppStatusBadge";
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
import {
  Calendar,
  DollarSign,
  ExternalLink,
  Hash,
  ShoppingCart,
  Tag,
  User,
} from "lucide-react";
import { useLayoutEffect, useMemo } from "react";

export const Route = createFileRoute("/dashboard/order/")({
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
        label: "Orders",
        href: "/dashboard/order",
        isActive: true,
      },
    ]);
  }, []);

  const { table, searchParams, queryKey } = useTable({
    columns: [
      {
        accessorKey: "order_id",
        header: ({ column }) => (
          <DataTableColumnHeader icon={Hash} column={column} title="ID" />
        ),
        cell: ({ row }) => {
          const id = row.getValue("order_id") as number;
          return (
            <Badge variant="secondary" className="font-medium text-sm">
              <Hash className="h-3 w-3" />
              <span className="select-all">{id}</span>
            </Badge>
          );
        },
      },
      {
        accessorKey: "client_id",
        header: ({ column }) => (
          <DataTableColumnHeader icon={User} column={column} title="Client" />
        ),
        cell: ({ row }) => {
          const client = (row.original as any)
            ?.client as Database["public"]["Tables"]["client"]["Row"];
          return (
            <div className="flex items-center">
              <div className="flex flex-col gap-1">
                <span className="font-medium text-sm flex items-center">
                  <span className="truncate max-w-[150px]">{client?.name}</span>
                  <Button
                    size={"icon"}
                    className={"h-[28px] w-[28px] ml-auto cursor-pointer"}
                    variant={"outline"}
                    title="Open"
                  >
                    <ExternalLink />
                  </Button>
                </span>
                <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                  {client?.email}
                </span>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "catalog_id",
        header: ({ column }) => (
          <DataTableColumnHeader
            icon={ShoppingCart}
            column={column}
            title="Catalog"
          />
        ),
        cell: ({ row }) => {
          const catalog = (row.original as any)
            ?.catalog as Database["public"]["Tables"]["catalog"]["Row"];

          return (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="font-medium text-sm cursor-pointer select-none max-w-[150px] truncate"
                title="Open"
              >
                {catalog?.name}
                <ExternalLink />
              </Button>
            </div>
          );
        },
      },
      {
        accessorKey: "status",
        header: ({ column }) => (
          <DataTableColumnHeader icon={Tag} column={column} title="Status" />
        ),
        cell: ({ row }) => {
          const status = row.getValue("status") as string;
          return <AppStatusBadge status={status as any} />;
        },
      },
      {
        accessorKey: "total_amount",
        header: ({ column }) => (
          <DataTableColumnHeader
            icon={DollarSign}
            column={column}
            title="Total Amount"
          />
        ),
        cell: ({ row }) => {
          const amt = row.getValue("total_amount") as number;
          const formatted = amt?.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          });
          return (
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">${formatted}</span>
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
            title="Ordered At"
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
    baseQueryKey: ["order"],
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
    IPaginationResponse<Database["public"]["Tables"]["order"]["Row"]>
  >({
    queryKey,
    queryFn: async () => {
      const QueryBuilder = supabase
        .from("order")
        .select(
          `
          *,
          client!inner(name,email),
          catalog!inner(name)`,
          { count: "exact" }
        )
        .range(from, to);
      if (searchParams.search) {
        // this ORs order_id = X
        if (!isNaN(searchParams.search as any)) {
          QueryBuilder.eq(`order_id`, searchParams.search as any);
        }
        if (searchParams.search.startsWith("client.name=")) {
          QueryBuilder.ilike(
            `client.name`,
            `%${searchParams.search.split("client.name=")[1]}%`
          );
        }
        if (searchParams.search.startsWith("client.email=")) {
          QueryBuilder.ilike(
            `client.email`,
            `%${searchParams.search.split("client.email=")[1]}%`
          );
        }
        if (searchParams.search.startsWith("catalog.name=")) {
          QueryBuilder.ilike(
            `catalog.name`,
            `%${searchParams.search.split("catalog.name=")[1]}%`
          );
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
      <div className="flex items-center justify-between sticky top-[52px] py-3 bg-background/20 backdrop-blur-xl z-[100] md:px-8 px-4">
        <CardTitle>Orders Management</CardTitle>
        {/* <Button variant={"outline"}>Create Client</Button> */}
      </div>
      <div className="md:px-8 px-4">
        <Card>
          <CardContent>
            <DataTable
              facetedFilters={[
                {
                  column: "status",
                  title: "Order Status",
                  options: [
                    ...Object.keys(statusConfig).map((key) => {
                      return {
                        value: key as keyof typeof statusConfig,
                        label:
                          statusConfig[key as keyof typeof statusConfig].label,
                        icon: statusConfig[key as keyof typeof statusConfig]
                          .icon,
                      };
                    }), //statusConfig
                  ],
                },
              ]}
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
