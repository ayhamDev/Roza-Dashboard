// /dashboard/product/ page component with delete functionality

import { ConfirmDialog } from "@/components/app/ConfirmDialog";
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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { useLayoutEffect, useMemo, useState } from "react";
import { toast } from "sonner";

// Define Product type for better type safety
type Product = Database["public"]["Tables"]["item"]["Row"];

export const Route = createFileRoute("/dashboard/product/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { setBreadcrumbs } = useBreadcrumbs();
  const { openSheet } = useSheet();
  const queryClient = useQueryClient();

  // State for delete confirmation dialog
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
        id: "product",
        label: "Products",
        href: "/dashboard/product",
        isActive: true,
      },
    ]);
  }, []);

  // Mutation for deleting a product (item) and its associated image
  const { mutate: deleteProduct, isPending: isDeleting } = useMutation({
    mutationFn: async (product: Product) => {
      // --- KEY LOGIC ---
      // 1. First, check if an image_url exists for the product.
      // This handles the case where a product might not have an image.
      if (product.image_url) {
        // If an image exists, attempt to remove it from Supabase Storage.
        // Replace 'images' with your actual storage bucket name if it's different.
        const { error: storageError } = await supabase.storage
          .from("images")
          .remove([product.image_url]);

        // If image deletion fails, throw an error to prevent deleting the database record.
        if (storageError) {
          throw new Error(
            `Failed to delete product image: ${storageError.message}`
          );
        }
      }

      // 2. After successfully handling the image, delete the product from the database.
      const { error: dbError } = await supabase
        .from("item")
        .delete()
        .eq("item_id", product.item_id);

      // If the database deletion fails (e.g., due to a foreign key constraint),
      // this error will be caught by the onError handler.
      if (dbError) {
        throw new Error(dbError.message);
      }
    },
    onSuccess: () => {
      toast.success(`Product "${selectedProduct?.name}" has been deleted.`);
      queryClient.invalidateQueries({ queryKey }); // Refetch the product list
      setIsDeleteDialogOpen(false);
      setSelectedProduct(null);
    },
    onError: (error) => {
      // Display a more specific error message from the thrown exception.
      toast.error("Failed to delete product", {
        description:
          error.message ||
          "This can happen if it is part of an existing order.",
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
                  width={75}
                  height={75}
                  className="rounded-md object-contain border h-[75px] w-[75px]"
                />
              ) : (
                <div className="w-[75px] h-[75px] bg-muted rounded-md flex items-center justify-center">
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
      {/* Render the confirmation dialog for deletion */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={() => {
          // Add a null check for robustness before calling the mutation
          if (selectedProduct) {
            deleteProduct(selectedProduct);
          }
        }}
        loading={isDeleting}
        title={`Delete Product: ${selectedProduct?.name || ""}`}
        description="Are you sure you want to delete this product? If it has an image, the image will also be permanently deleted. This action cannot be undone."
        confirmText="Delete"
      />
    </div>
  );
}
