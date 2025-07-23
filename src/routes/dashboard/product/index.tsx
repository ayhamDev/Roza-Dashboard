// /dashboard/product/ page component with delete functionality

import { ConfirmDialog } from "@/components/app/ConfirmDialog"; // NEW: Import confirmation dialog
import { ProductStatsCards } from "@/components/card/product-stats-cards";
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
import {
  useMutation, // NEW: Import mutation hook
  useQuery,
  useQueryClient, // NEW: Import query client
} from "@tanstack/react-query";
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
import { useLayoutEffect, useMemo, useState } from "react"; // NEW: Import useState
import { toast } from "sonner"; // NEW: Import toast for notifications

// NEW: Define Product type for better type safety
type Product = Database["public"]["Tables"]["item"]["Row"];

export const Route = createFileRoute("/dashboard/product/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { setBreadcrumbs } = useBreadcrumbs();
  const { openSheet } = useSheet();
  const queryClient = useQueryClient(); // NEW: Get query client instance

  // NEW: State for delete confirmation dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useLayoutEffect(() => {
    setBreadcrumbs([
      {
        id: "dashboard",
        label: "Dashboard",
        href: "/dashboard",
      },
      {
        id: "product", // Corrected ID
        label: "Products",
        href: "/dashboard/product", // Corrected href
        isActive: true,
      },
    ]);
  }, []);

  // NEW: Mutation for deleting a product (item)
  const { mutate: deleteProduct, isPending: isDeleting } = useMutation({
    mutationFn: async (productId: number) => {
      // Note: Deleting an item might fail if it's referenced in `order_transactions`
      // and ON DELETE is not set to CASCADE. This error is handled below.
      const { error } = await supabase
        .from("item")
        .delete()
        .eq("item_id", productId);

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success(`Product "${selectedProduct?.name}" has been deleted.`);
      queryClient.invalidateQueries({ queryKey }); // Invalidate query to refetch
      setIsDeleteDialogOpen(false);
      setSelectedProduct(null);
    },
    onError: (error) => {
      toast.error("Failed to delete product", {
        description:
          "This can happen if the product is part of an existing order or catalog. Please remove its associations first.",
      });
      console.error("Delete product error:", error.message);
      setIsDeleteDialogOpen(false);
      setSelectedProduct(null);
    },
  });

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
            <div className="flex flex-row items-center gap-4 min-w-max">
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
                  className="font-medium text-sm truncate max-w-[250px]"
                  title={name}
                >
                  {name}
                </span>
                {description && (
                  <span
                    className="text-xs text-muted-foreground truncate max-w-[200px]"
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
              <DollarSign className="h-3 w-3 mr-1" />
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
          return (
            <Badge variant={quantity > 0 ? "default" : "destructive"}>
              {quantity}
            </Badge>
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
          // NEW: Get the full product object for actions
          const product = row.original as Product;
          const actions: RowActionItem<any>[] = [
            {
              icon: Eye,
              label: "View Product",
              action: () => {
                return openSheet("product:view", {
                  id: product.item_id.toString(),
                });
              },
            },
            {
              icon: Edit,
              label: "Edit Product",
              action: () => {
                return openSheet("product:update", {
                  id: product.item_id.toString(),
                });
              },
            },
            {
              isSeparator: true,
            },
            {
              icon: Delete,
              label: "Delete Product",
              action: () => {
                // NEW: Set selected product and open dialog
                setSelectedProduct(product);
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
        QueryBuilder.or(
          `name.ilike.%${searchParams.search}%,description.ilike.%${searchParams.search}%`
        );
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
          size={"lg"}
          className="cursor-pointer"
          onClick={() => openSheet("product:create")}
        >
          <Plus />
          Create Product
        </Button>
      </div>
      <div className="md:px-8 px-4">
        <ProductStatsCards />
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
      {/* NEW: Render the confirmation dialog when a product is selected for deletion */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={() => deleteProduct(selectedProduct?.item_id as number)}
        loading={isDeleting}
        title={`Delete Product: ${selectedProduct?.name as string}`}
        description="Are you sure you want to delete this product? This action cannot be undone. All associated data (like catalog and order associations) will also be deleted."
        confirmText="Delete"
      />
    </div>
  );
}
