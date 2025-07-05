"use client";

import { CampaignStatsCards } from "@/components/card/campaign-stats-cards";
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
  ExternalLink,
  Eye,
  Hash,
  Mail,
  MessageSquare,
  Plus,
  Send,
  Target,
  Users,
} from "lucide-react";
import { useLayoutEffect, useMemo } from "react";

export const Route = createFileRoute("/dashboard/campaign/")({
  component: RouteComponent,
});

type CampaignRow = Database["public"]["Tables"]["campaign"]["Row"];

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
        id: "campaign",
        label: "Campaigns",
        href: "/dashboard/campaign",
        isActive: true,
      },
    ]);
  }, []);

  const { table, searchParams, queryKey } = useTable({
    columns: [
      {
        accessorKey: "campaign_id",
        header: ({ column }) => (
          <DataTableColumnHeader
            icon={Hash}
            column={column}
            title="Campaign ID"
          />
        ),
        cell: ({ row }) => {
          const id = row.getValue("campaign_id") as string;
          return (
            <Badge
              variant="secondary"
              className="font-medium text-sm font-mono"
            >
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
            icon={Target}
            column={column}
            title="Campaign"
          />
        ),
        cell: ({ row }) => {
          const name = row.getValue("name") as string;
          const description = (row.original as CampaignRow)?.description;

          return (
            <div className="flex flex-col gap-1 min-w-[200px]">
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
          );
        },
      },
      {
        accessorKey: "status",
        header: ({ column }) => (
          <DataTableColumnHeader
            icon={Activity}
            column={column}
            title="Status"
          />
        ),
        cell: ({ row }) => {
          const status = row.getValue("status") as string;
          return (
            <Badge
              variant={
                status === "Active"
                  ? "default"
                  : status === "Completed"
                    ? "secondary"
                    : status === "Cancelled"
                      ? "destructive"
                      : "outline"
              }
              className="text-xs font-medium"
            >
              {status?.toUpperCase() || "DRAFT"}
            </Badge>
          );
        },
      },
      {
        accessorKey: "catalog_id",
        header: ({ column }) => (
          <DataTableColumnHeader
            icon={BookOpen}
            column={column}
            title="Catalog"
          />
        ),
        cell: ({ row }) => {
          const catalog = (row.original as any)?.catalog;
          return (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="font-medium text-sm cursor-pointer select-none max-w-[160px] truncate bg-transparent"
                title="Open Catalog"
                onClick={() => {
                  openSheet("catalog:view", { id: catalog?.catalog_id });
                }}
              >
                <span className="truncate max-w-[130px]">{catalog?.name}</span>
                <ExternalLink className="h-3 w-3 ml-1" />
              </Button>
            </div>
          );
        },
      },
      {
        accessorKey: "delivery_method",
        header: ({ column }) => (
          <DataTableColumnHeader
            icon={Send}
            column={column}
            title="Delivery Methods"
          />
        ),
        cell: ({ row }) => {
          const methods = row.getValue(
            "delivery_method"
          ) as Database["public"]["Enums"]["campaign_method"][];

          if (!methods || methods.length === 0) {
            return <span className="text-muted-foreground text-xs">None</span>;
          }

          return (
            <div className="flex items-center gap-1 flex-wrap">
              {methods.includes("email") && (
                <Badge variant="outline" className="text-xs">
                  <Mail className="h-3 w-3 mr-1" />
                  Email
                </Badge>
              )}
              {methods.includes("sms") && (
                <Badge variant="outline" className="text-xs">
                  <MessageSquare className="h-3 w-3 mr-1" />
                  SMS
                </Badge>
              )}
              {methods.includes("whatsapp") && (
                <Badge variant="outline" className="text-xs">
                  <Send className="h-3 w-3 mr-1" />
                  WhatsApp
                </Badge>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "total_recipients",
        header: ({ column }) => (
          <DataTableColumnHeader
            icon={Users}
            column={column}
            title="Recipients"
          />
        ),
        cell: ({ row }) => {
          const count = row.getValue("total_recipients") as number;
          return (
            <Badge variant="secondary" className="font-medium text-sm">
              <Users className="h-3 w-3 mr-1" />
              {count || "All"}
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
              label: "View Campaign",
              action: (row) => {
                return openSheet("campaign:view", {
                  id: row.getValue("campaign_id") as string,
                });
              },
            },
            {
              icon: Edit,
              label: "Edit Campaign",
              action: (row) => {
                return openSheet("campaign:update", {
                  id: row.getValue("campaign_id") as string,
                });
              },
            },

            {
              isSeparator: true,
            },
            {
              icon: Delete,
              label: "Delete Campaign",
              action: (row) => {
                console.log("Delete campaign:", row);
                // Add delete confirmation logic here
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
          if (!ts) return <span className="text-muted-foreground">-</span>;

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
          if (!ts) return <span className="text-muted-foreground">-</span>;

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
    baseQueryKey: ["campaign"],
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
    IPaginationResponse<CampaignRow>
  >({
    queryKey,
    queryFn: async () => {
      const QueryBuilder = supabase
        .from("campaign")
        .select(
          `
          *,
          catalog:catalog_id!inner(
            catalog_id,
            name
          )
        `,
          { count: "exact" }
        )
        .range(from, to);

      // Search functionality
      if (searchParams.search) {
        // Search by campaign ID or name
        QueryBuilder.or(
          `campaign_id.ilike.%${searchParams.search}%,name.ilike.%${searchParams.search}%`
        );
      }

      // Status filter
      if (searchParams.filter?.["filter[status]"]) {
        const statuses = searchParams.filter["filter[status]"]?.split(",");
        QueryBuilder.in("status", statuses as any);
      }

      // Delivery method filter - updated to handle array
      if (searchParams.filter?.["filter[delivery_method]"]) {
        const methods =
          searchParams.filter["filter[delivery_method]"]?.split(",");
        // Use overlaps operator for array filtering
        QueryBuilder.overlaps("delivery_method", methods);
      }

      // Sorting
      if (searchParams.sort) {
        QueryBuilder.order(searchParams.sort.by as any, {
          ascending: searchParams.sort.order === "asc",
        });
      } else {
        // Default sort by created_at desc
        QueryBuilder.order("created_at", { ascending: false });
      }

      const { data, count, error } = await QueryBuilder;

      if (error) throw error;

      return buildPaginationResponse(data, searchParams, count);
    },
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between py-3 bg-background/20 backdrop-blur-xl md:px-8 px-4 min-h-[64px]">
        <CardTitle>Campaign Management</CardTitle>
        <Button
          variant={"default"}
          className="cursor-pointer"
          onClick={() => openSheet("campaign:create")}
        >
          <Plus />
          Create Campaign
        </Button>
      </div>
      <div className="md:px-8 px-4">
        <CampaignStatsCards />
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
