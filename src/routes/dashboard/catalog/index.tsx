// /dashboard/catalog/ page component with delete functionality

import { ConfirmDialog } from "@/components/app/ConfirmDialog"; // NEW: Import confirmation dialog
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
import {
  useMutation, // NEW: Import mutation hook
  useQuery,
  useQueryClient, // NEW: Import query client
} from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import {
  Activity,
  BookOpen,
  Calendar,
  Delete,
  Edit,
  Eye,
  FileEdit,
  FileText,
  Hash,
  Plus,
} from "lucide-react";
import { useLayoutEffect, useMemo, useState } from "react"; // NEW: Import useState
import { toast } from "sonner"; // NEW: Import toast for notifications

// NEW: Define Catalog type for better type safety
type Catalog = Database["public"]["Tables"]["catalog"]["Row"];

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
  const navigate = useNavigate();
  const queryClient = useQueryClient(); // NEW: Get query client instance
  // NEW: State for delete confirmation dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCatalog, setSelectedCatalog] = useState<Catalog | null>(null);

  useLayoutEffect(() => {
    setBreadcrumbs([
      {
        id: "dashboard",
        label: "Dashboard",
        href: "/dashboard",
      },
      {
        id: "catalog", // Corrected id
        label: "Catalogs",
        href: "/dashboard/catalog",
        isActive: true,
      },
    ]);
  }, []);

  // NEW: Mutation for deleting a catalog
  const { mutate: deleteCatalog, isPending: isDeleting } = useMutation({
    mutationFn: async (catalogId: number) => {
      // Note: Deleting a catalog will also delete its associated items in `catalog_transitions`
      // if ON DELETE CASCADE is set, which is recommended.
      const { error } = await supabase
        .from("catalog")
        .delete()
        .eq("catalog_id", catalogId);

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success(`Catalog "${selectedCatalog?.name}" has been deleted.`);
      queryClient.invalidateQueries({ queryKey }); // Invalidate query to refetch
      setIsDeleteDialogOpen(false);
      setSelectedCatalog(null);
    },
    onError: (error) => {
      toast.error("Failed to delete catalog", {
        description:
          "This can happen if the catalog is being used by an existing order or campaign. Please remove its associations first.",
      });
      console.error("Delete catalog error:", error.message);
      setIsDeleteDialogOpen(false);
      setSelectedCatalog(null);
    },
  });

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
          const status = row.getValue("status") as string;
          return (
            <Badge variant={"secondary"} className="flex items-center gap-2">
              {getStatusInfo(status).icon}
              {getStatusInfo(status).label}
            </Badge>
          );
        },
      },
      {
        id: "actions",
        cell: ({ row }) => {
          // NEW: Get the full catalog object for actions
          const catalog = row.original;
          const actions: RowActionItem<any>[] = [
            {
              icon: Eye,
              label: "View Catalog",
              action: () => {
                return openSheet("catalog:view", {
                  id: catalog.catalog_id.toString(),
                });
              },
            },
            {
              icon: Edit,
              label: "Edit Catalog",
              action: () => {
                return openSheet("catalog:update", {
                  id: catalog.catalog_id.toString(),
                });
              },
            },
            {
              icon: FileText,
              label: "Generate Catalog PDF",
              action: () => {
                navigate({
                  to: `/dashboard/catalog/${catalog.catalog_id}`,
                });
              },
            },
            {
              isSeparator: true,
            },
            {
              icon: Delete,
              label: "Delete Catalog",
              action: () => {
                // NEW: Set selected catalog and open dialog
                // @ts-ignore
                setSelectedCatalog(catalog);
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
        if (!isNaN(searchParams.search as any)) {
          QueryBuilder.eq(`catalog_id`, searchParams.search as any);
        } else {
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
          size={"lg"}
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
      {/* NEW: Render the confirmation dialog when a catalog is selected for deletion */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={() => deleteCatalog(selectedCatalog?.catalog_id as number)}
        loading={isDeleting}
        title={`Delete Catalog: ${selectedCatalog?.name as string}`}
        description="Are you sure you want to delete this catalog? All associated data (like the catalog transactions , order transactions linked to it) will also be removed. This action cannot be undone."
        confirmText="Delete"
      />
    </div>
  );
}
