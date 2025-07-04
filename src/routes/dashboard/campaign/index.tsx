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
  BookOpen,
  BarChart3,
  Activity,
} from "lucide-react";
import { useLayoutEffect, useMemo } from "react";

export const Route = createFileRoute("/dashboard/campaign/")({
  component: RouteComponent,
});

interface CampaignRow {
  id: number;
  campaign_id: string;
  name: string;
  description: string | null;
  catalog_id: number;
  delivery_method: "email" | "whatsapp" | "both";
  subject: string;
  message: string;
  status: "draft" | "active" | "completed" | "cancelled";
  total_recipients: number;
  created_at: string;
  updated_at: string;
  catalog: {
    catalog_id: number;
    name: string;
  };
}

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
              <span className="select-all">{id.slice(-8)}</span>
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
                status === "active"
                  ? "default"
                  : status === "completed"
                    ? "secondary"
                    : status === "cancelled"
                      ? "destructive"
                      : "outline"
              }
              className="text-xs font-medium"
            >
              {status.toUpperCase()}
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
          const catalog = (row.original as CampaignRow)?.catalog;
          return (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="font-medium text-sm cursor-pointer select-none max-w-[150px] truncate bg-transparent"
                title="Open Catalog"
                onClick={() => {
                  openSheet("catalog:view", { id: catalog.catalog_id });
                }}
              >
                <span className="truncate max-w-[120px]">{catalog?.name}</span>
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
            title="Delivery Method"
          />
        ),
        cell: ({ row }) => {
          const method = row.getValue("delivery_method") as
            | "email"
            | "whatsapp"
            | "both";
          return (
            <div className="flex items-center gap-1">
              {method === "email" && (
                <Badge variant="outline" className="text-xs">
                  <Mail className="h-3 w-3 mr-1" />
                  Email
                </Badge>
              )}
              {method === "whatsapp" && (
                <Badge variant="outline" className="text-xs">
                  <MessageSquare className="h-3 w-3 mr-1" />
                  WhatsApp
                </Badge>
              )}
              {method === "both" && (
                <>
                  <Badge variant="outline" className="text-xs">
                    <Mail className="h-3 w-3 mr-1" />
                    Email
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    <MessageSquare className="h-3 w-3 mr-1" />
                    WhatsApp
                  </Badge>
                </>
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
              {count}
            </Badge>
          );
        },
      },
      {
        id: "actions",
        cell: ({ row }) => {
          const actions: RowActionItem<CampaignRow>[] = [
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
              icon: BarChart3,
              label: "View Dashboard",
              action: (row) => {
                return openSheet("campaign:dashboard", {
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
        if (searchParams.search.startsWith("camp_")) {
          QueryBuilder.ilike("campaign_id", `%${searchParams.search}%`);
        } else {
          QueryBuilder.ilike("name", `%${searchParams.search}%`);
        }
      }

      // Status filter
      if (searchParams.filter?.["filter[status]"]) {
        const statuses = searchParams.filter["filter[status]"]?.split(",");
        QueryBuilder.in("status", statuses);
      }

      // Delivery method filter
      if (searchParams.filter?.["filter[delivery_method]"]) {
        const methods =
          searchParams.filter["filter[delivery_method]"]?.split(",");
        QueryBuilder.in("delivery_method", methods);
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

      return buildPaginationResponse(
        data as CampaignRow[],
        searchParams,
        count
      );
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
