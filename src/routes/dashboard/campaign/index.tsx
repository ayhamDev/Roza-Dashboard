"use client";

import { ConfirmDialog } from "@/components/app/ConfirmDialog"; // NEW: Import confirmation dialog
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
import {
  useMutation, // NEW: Import mutation hook
  useQuery,
  useQueryClient, // NEW: Import query client
} from "@tanstack/react-query";
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
import { useLayoutEffect, useMemo, useState } from "react"; // NEW: Import useState
import { toast } from "sonner"; // NEW: Import toast for notifications

export const Route = createFileRoute("/dashboard/campaign/")({
  component: RouteComponent,
});

// NEW: Renamed for consistency
type Campaign = Database["public"]["Tables"]["campaign"]["Row"];

function RouteComponent() {
  const { setBreadcrumbs } = useBreadcrumbs();
  const { openSheet } = useSheet();
  const queryClient = useQueryClient(); // NEW: Get query client instance

  // NEW: State for delete confirmation dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(
    null
  );

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

  // NEW: Mutation for deleting a campaign
  const { mutate: deleteCampaign, isPending: isDeleting } = useMutation({
    mutationFn: async (campaignId: string) => {
      // Deleting a campaign should also delete its recipients if ON DELETE CASCADE is set
      const { error } = await supabase
        .from("campaign")
        .delete()
        .eq("campaign_id", campaignId);

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success(`Campaign "${selectedCampaign?.name}" has been deleted.`);
      queryClient.invalidateQueries({ queryKey }); // Invalidate query to refetch
      setIsDeleteDialogOpen(false);
      setSelectedCampaign(null);
    },
    onError: (error) => {
      toast.error(`Failed to delete campaign: ${error.message}`);
      setIsDeleteDialogOpen(false);
      setSelectedCampaign(null);
    },
  });

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
          const description = (row.original as Campaign)?.description;

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
          // NEW: Get the full campaign object for actions
          const campaign = row.original as Campaign;
          const actions: RowActionItem<any>[] = [
            {
              icon: Eye,
              label: "View Campaign",
              action: () => {
                return openSheet("campaign:view", {
                  id: campaign.campaign_id,
                });
              },
            },
            {
              icon: Edit,
              label: "Edit Campaign",
              action: () => {
                return openSheet("campaign:update", {
                  id: campaign.campaign_id,
                });
              },
            },
            {
              isSeparator: true,
            },
            {
              icon: Delete,
              label: "Delete Campaign",
              action: () => {
                // NEW: Set selected campaign and open dialog
                setSelectedCampaign(campaign);
                setIsDeleteDialogOpen(true);
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

  const { data, isLoading, isError } = useQuery<IPaginationResponse<Campaign>>({
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

      if (searchParams.search) {
        QueryBuilder.or(
          `campaign_id.ilike.%${searchParams.search}%,name.ilike.%${searchParams.search}%`
        );
      }
      if (searchParams.filter?.["filter[status]"]) {
        const statuses = searchParams.filter["filter[status]"]?.split(",");
        QueryBuilder.in("status", statuses as any);
      }
      if (searchParams.filter?.["filter[delivery_method]"]) {
        const methods =
          searchParams.filter["filter[delivery_method]"]?.split(",");
        QueryBuilder.overlaps("delivery_method", methods);
      }
      if (searchParams.sort) {
        QueryBuilder.order(searchParams.sort.by as any, {
          ascending: searchParams.sort.order === "asc",
        });
      } else {
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
          size={"lg"}
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
      {/* NEW: Render the confirmation dialog when a campaign is selected for deletion */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={() =>
          deleteCampaign(selectedCampaign?.campaign_id as string)
        }
        loading={isDeleting}
        title={`Delete Campaign: ${selectedCampaign?.name as string}`}
        description="Are you sure you want to delete this campaign? All associated data (like recipient lists) will also be removed. This action cannot be undone."
        confirmText="Delete"
      />
    </div>
  );
}
