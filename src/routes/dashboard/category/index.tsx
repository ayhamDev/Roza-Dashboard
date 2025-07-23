// /dashboard/category/ page component with delete functionality

import { ConfirmDialog } from "@/components/app/ConfirmDialog"; // NEW: Import confirmation dialog
import { CategoryStatsCards } from "@/components/card/category-stats-cards";
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
import { Calendar, Delete, Edit, Eye, Hash, Plus, Tag } from "lucide-react";
import { useLayoutEffect, useMemo, useState } from "react"; // NEW: Import useState
import { toast } from "sonner"; // NEW: Import toast for notifications

// NEW: Define Category type for better type safety
type Category = Database["public"]["Tables"]["item_category"]["Row"];

export const Route = createFileRoute("/dashboard/category/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { setBreadcrumbs } = useBreadcrumbs();
  const { openSheet } = useSheet();
  const queryClient = useQueryClient(); // NEW: Get query client instance

  // NEW: State for delete confirmation dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
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
        id: "category", // Corrected ID
        label: "Categories",
        href: "/dashboard/category",
        isActive: true,
      },
    ]);
  }, []);

  // NEW: Mutation for deleting a category
  const { mutate: deleteCategory, isPending: isDeleting } = useMutation({
    mutationFn: async (categoryId: number) => {
      // Deleting a category will fail if `item.category_id` references it,
      // and the foreign key constraint is set to RESTRICT or NO ACTION.
      const { error } = await supabase
        .from("item_category")
        .delete()
        .eq("category_id", categoryId);

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success(`Category "${selectedCategory?.name}" has been deleted.`);
      queryClient.invalidateQueries({ queryKey }); // Invalidate query to refetch
      setIsDeleteDialogOpen(false);
      setSelectedCategory(null);
    },
    onError: (error) => {
      toast.error("Failed to delete category", {
        description:
          "This usually means there are still products assigned to this category. Please reassign them before deleting.",
      });
      console.error("Delete category error:", error.message);
      setIsDeleteDialogOpen(false);
      setSelectedCategory(null);
    },
  });

  const { table, searchParams, queryKey } = useTable({
    columns: [
      {
        accessorKey: "category_id",
        header: ({ column }) => (
          <DataTableColumnHeader icon={Hash} column={column} title="ID" />
        ),
        cell: ({ row }) => {
          const id = row.getValue("category_id") as number;
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
            icon={Tag}
            column={column}
            title="Category Name"
          />
        ),
        cell: ({ row }) => {
          const name = row.getValue("name") as string;

          return (
            <div className="flex items-center gap-2">
              <span className="truncate max-w-[200px]" title={name}>
                {name}
              </span>
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
            ((row.original as any)?.items?.[0].count as number) || 0;

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
        id: "actions",
        cell: ({ row }) => {
          // NEW: Get the full category object for actions
          const category = row.original as Partial<Category>;
          const actions: RowActionItem<any>[] = [
            {
              icon: Eye,
              label: "View Category",
              action: () => {
                if (!category?.category_id) return null;
                return openSheet("category:view", {
                  id: category?.category_id.toString(),
                });
              },
            },
            {
              icon: Edit,
              label: "Edit Category",
              action: () => {
                if (!category?.category_id) return null;
                return openSheet("category:update", {
                  id: category.category_id.toString(),
                });
              },
            },
            {
              isSeparator: true,
            },
            {
              icon: Delete,
              label: "Delete Category",
              action: () => {
                // NEW: Set selected category and open dialog
                // @ts-ignore
                setSelectedCategory(category);
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
    baseQueryKey: ["category"],
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
    IPaginationResponse<Database["public"]["Tables"]["item_category"]["Row"]>
  >({
    queryKey,
    queryFn: async () => {
      const QueryBuilder = supabase
        .from("item_category")
        .select(
          `
          *,
          items:item(count)
        `,
          { count: "exact" }
        )
        .range(from, to);

      if (searchParams.search) {
        if (!isNaN(searchParams.search as any)) {
          QueryBuilder.eq(`category_id`, searchParams.search as any);
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
        <CardTitle>Categories Management</CardTitle>
        <Button
          variant={"default"}
          size={"lg"}
          className="cursor-pointer"
          onClick={() => {
            openSheet("category:create");
          }}
        >
          <Plus />
          Create Category
        </Button>
      </div>
      <div className="md:px-8 px-4">
        <CategoryStatsCards />
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

      {/* NEW: Render the confirmation dialog when a category is selected for deletion */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={() =>
          deleteCategory(selectedCategory?.category_id as number)
        }
        loading={isDeleting}
        title={`Delete Category: ${selectedCategory?.name as string}`}
        description="Are you sure you want to delete this category? This action cannot be undone. Make sure no products are using this category before proceeding."
        confirmText="Delete"
      />
    </div>
  );
}
