"use client";

import AppCopyButton from "@/components/app/AppCopyButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useSheet } from "@/context/sheets";
import { useIsMobile } from "@/hooks/use-mobile";
import { getFormattedDateMeta } from "@/lib/getFormattedDateMeta";
import { getImageUrl } from "@/lib/GetImageUrl";
import { cn } from "@/lib/utils";
import { supabase } from "@/supabase";
import type { DialogProps } from "@radix-ui/react-dialog";
import { useQuery } from "@tanstack/react-query";
import {
  Calendar,
  Clock,
  DollarSign,
  Edit,
  ExternalLink,
  Eye,
  EyeOff,
  Hash,
  Link,
  Loader2,
  Package,
  ShoppingCart,
  Tag,
  Trash,
  Warehouse,
  X,
} from "lucide-react";
import type React from "react";

interface ViewProductSheetProps
  extends React.ComponentProps<React.FC<DialogProps>> {
  id: string;
}

const ViewProductSheet = (props: ViewProductSheetProps) => {
  const { id, ...sheetProps } = props;
  const IsMobile = useIsMobile();
  const { openSheet } = useSheet();

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("item")
        .select(
          `
          *,
          item_category (
            category_id,
            name
          )
        `
        )
        .eq("item_id", id as any)
        .single();

      if (error) throw error;
      return data;
    },
  });

  // Get image URL from Supabase storage

  // Enhanced DisplayField component with icons and better styling
  const DisplayField = ({
    label,
    value,
    icon: Icon,
    className = "",
    prefix = "",
    suffix = "",
  }: {
    label: string;
    value: string | number | undefined | null;
    icon?: React.ElementType;
    className?: string;
    prefix?: string;
    suffix?: string;
  }) => (
    <div className={cn("group", className)}>
      <div className="flex items-center gap-2 mb-2">
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
        <label className="text-sm font-medium text-muted-foreground">
          {label}
        </label>
      </div>
      <div className="flex bg-muted/30 rounded-lg p-3 border border-border/50 transition-colors group-hover:bg-muted/50">
        <p className="text-sm font-medium">
          {value !== null && value !== undefined ? (
            `${prefix}${value}${suffix}`
          ) : (
            <span className="text-muted-foreground italic">Not provided</span>
          )}
        </p>
        {value && (
          <div className="opacity-0 group-hover:opacity-100 transition-opacity ml-auto">
            <AppCopyButton text={`${prefix}${value}${suffix}`} />
          </div>
        )}
      </div>
    </div>
  );

  // Product info component for better visual representation
  const ProductInfo = ({
    icon: Icon,
    label,
    value,
    prefix = "",
    suffix = "",
  }: {
    icon: React.ElementType;
    label: string;
    value: string | number | null | undefined;
    prefix?: string;
    suffix?: string;
  }) => {
    if (value === null || value === undefined) return null;

    return (
      <div className="flex items-center gap-4 border-border/50 bg-muted/30 rounded-lg p-4 border group">
        <div className="flex-shrink-0">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0 flex flex-col gap-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {label}
          </p>
          <p className="text-sm font-medium truncate">{`${prefix}${value}${suffix}`}</p>
        </div>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <AppCopyButton text={`${prefix}${value}${suffix}`} />
        </div>
      </div>
    );
  };

  return (
    <Sheet {...sheetProps}>
      <SheetContent
        className={cn(
          "w-[600px] min-w-[600px] max-w-[600px] [&>button:first-of-type]:hidden",
          IsMobile && "min-w-auto w-full"
        )}
      >
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="h-12 w-12 rounded-full border-4 border-primary/20"></div>
                <Loader2 className="h-12 w-12 animate-spin text-primary absolute inset-0" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">Loading product details</p>
                <p className="text-xs text-muted-foreground">Please wait...</p>
              </div>
            </div>
          </div>
        )}

        <ScrollArea className="max-h-full min-h-full">
          <div className="space-y-6 pb-6 mb-20">
            <SheetHeader className="flex flex-row justify-between items-center border-b select-none border-sidebar-border sticky top-0 bg-background/60 backdrop-blur-lg mb-4">
              <SheetTitle className="flex items-center gap-2">
                <span>View</span>
                <Badge variant={"secondary"} className="text-lg">
                  Product Details
                </Badge>
              </SheetTitle>
              <SheetClose asChild>
                <Button size={"icon"} variant={"ghost"}>
                  <X />
                </Button>
              </SheetClose>
            </SheetHeader>

            {product ? (
              <div className="space-y-6">
                {/* Product Image */}
                {product.image_url && (
                  <div className="px-6">
                    <div className="aspect-square w-full max-w-md mx-auto rounded-lg overflow-hidden border border-border/50">
                      <img
                        src={
                          getImageUrl(product.image_url) ||
                          "/placeholder.svg?height=400&width=400"
                        }
                        alt={product.name || "Product image"}
                        className="object-cover object-center w-full h-full"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "/placeholder.svg?height=400&width=400";
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Basic Information Card */}
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Package className="h-5 w-5 text-primary" />
                    Basic Information
                  </CardTitle>
                </CardHeader>
                <div className="px-6">
                  <div className="grid gap-4">
                    <ProductInfo
                      icon={Hash}
                      label="Product ID"
                      value={product?.item_id}
                    />
                    <ProductInfo
                      icon={Package}
                      label="Product Name"
                      value={product.name}
                    />
                    {/* <ProductInfo
                      icon={Tag}
                      label="Category"
                      value={product.item_category?.name}
                    /> */}

                    {product.description && (
                      <div className="bg-muted/30 rounded-lg p-4 border border-border/50">
                        <div className="flex items-center gap-2 mb-2">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Description
                          </label>
                        </div>
                        <p className="text-sm leading-relaxed">
                          {product.description}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                <Separator />
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Link className="h-5 w-5 text-primary" />
                    Relationships
                  </CardTitle>
                </CardHeader>
                <div className="px-6">
                  <div className="flex items-center gap-4 border-border/50 bg-muted/30 rounded-lg p-4 border group">
                    <div className="flex-shrink-0">
                      <Tag className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col gap-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Category
                      </p>
                      <Button
                        variant="outline"
                        className="font-medium text-sm cursor-pointer select-none max-w-[220px] w-fit truncate bg-transparent"
                        title="Open Category"
                        onClick={() => {
                          openSheet("category:view", {
                            id: product.item_category?.category_id as any,
                          });
                        }}
                      >
                        <span className="truncate max-w-[200px]">
                          {product?.item_category?.name}
                        </span>
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                  </div>

                  {/* <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <AppCopyButton text`} />
                      </div> */}
                </div>

                <Separator />

                {/* Pricing Information Card */}
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <DollarSign className="h-5 w-5 text-primary" />
                    Pricing Information
                  </CardTitle>
                </CardHeader>
                <div className="space-y-4 px-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <DisplayField
                      label="Cost Price"
                      value={product.cost_price}
                      icon={DollarSign}
                      prefix="$"
                    />
                    <DisplayField
                      label="Retail Price"
                      value={product.retail_price}
                      icon={DollarSign}
                      prefix="$"
                    />
                    <DisplayField
                      label="Wholesale Price"
                      value={product.wholesale_price}
                      icon={DollarSign}
                      prefix="$"
                    />
                  </div>

                  {/* Profit Margins */}
                  {product.cost_price && product.retail_price && (
                    <div className="bg-muted/30 rounded-lg p-4 border border-border/50">
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Profit Margins
                        </label>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Retail Margin</p>
                          <p className="font-medium">
                            <span className="text-muted-foreground">
                              $
                              {(
                                product.retail_price - product.cost_price
                              ).toFixed(2)}
                            </span>{" "}
                            (
                            {(
                              ((product.retail_price - product.cost_price) /
                                product.cost_price) *
                              100
                            ).toFixed(1)}
                            %)
                          </p>
                        </div>
                        {product.wholesale_price && (
                          <div>
                            <p className="text-muted-foreground">
                              Wholesale Margin
                            </p>
                            <p className="font-medium">
                              <span className="text-muted-foreground">
                                $
                                {(
                                  product.wholesale_price - product.cost_price
                                ).toFixed(2)}
                              </span>{" "}
                              (
                              {(
                                ((product.wholesale_price -
                                  product.cost_price) /
                                  product.cost_price) *
                                100
                              ).toFixed(1)}
                              %)
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Inventory & Visibility */}
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Warehouse className="h-5 w-5 text-primary" />
                    Inventory & Visibility
                  </CardTitle>
                </CardHeader>
                <div className="px-6">
                  <div className="grid gap-4">
                    <ProductInfo
                      icon={ShoppingCart}
                      label="Stock Quantity"
                      value={product.stock_quantity}
                      suffix=" units"
                    />
                    <div className="flex items-center gap-4 border-border/50 bg-muted/30 rounded-lg p-4 border">
                      <div className="flex-shrink-0">
                        {product.is_catalog_visible ? (
                          <Eye className="h-5 w-5 text-green-600" />
                        ) : (
                          <EyeOff className="h-5 w-5 text-red-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col gap-2">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Catalog Visibility
                        </p>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              product.is_catalog_visible
                                ? "default"
                                : "secondary"
                            }
                            className={
                              product.is_catalog_visible
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }
                          >
                            {product.is_catalog_visible ? "Visible" : "Hidden"}
                          </Badge>
                          <p className="text-sm text-muted-foreground">
                            {product.is_catalog_visible
                              ? "This product is visible in the catalog"
                              : "This product is hidden from the catalog"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Metadata Card */}
                {(product.created_at || product.updated_at) && (
                  <>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Clock className="h-5 w-5 text-primary" />
                        Timeline
                      </CardTitle>
                    </CardHeader>
                    <div className="space-y-4 px-6">
                      {product.created_at && (
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                              Created
                            </p>
                            <p className="text-sm font-medium flex gap-2">
                              {getFormattedDateMeta(product.created_at).full}
                              <span className="text-muted-foreground text-sm">
                                (
                                {
                                  getFormattedDateMeta(product.created_at)
                                    .relative
                                }
                                )
                              </span>
                            </p>
                          </div>
                        </div>
                      )}
                      {product.updated_at && (
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                              Last Updated
                            </p>
                            <p className="text-sm font-medium flex gap-2">
                              {getFormattedDateMeta(product.updated_at).full}
                              <span className="text-muted-foreground text-sm">
                                (
                                {
                                  getFormattedDateMeta(product.updated_at)
                                    .relative
                                }
                                )
                              </span>
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            ) : (
              // Error State / Not Found
              <div className="flex flex-col items-center justify-center h-96 text-center px-4">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Package className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  Product not found
                </h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  The product you're looking for doesn't exist or may have been
                  deleted. Please check the product ID and try again.
                </p>
                <Button
                  variant="outline"
                  className="mt-4 bg-transparent"
                  asChild
                >
                  <SheetClose>Go back</SheetClose>
                </Button>
              </div>
            )}
          </div>

          {product && (
            <div className="flex justify-end gap-4 p-4 border-t absolute bottom-0 right-0 left-0 mt-auto bg-background/60 backdrop-blur-lg">
              <Button
                type="button"
                className="cursor-pointer"
                size={"lg"}
                variant="destructive"
              >
                <Trash /> Delete
              </Button>
              <Button
                type="button"
                className="cursor-pointer"
                size={"lg"}
                onClick={() => {
                  if (!product) return null;
                  openSheet("product:update", { id: product?.item_id });
                }}
              >
                <Edit />
                Edit
              </Button>
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export default ViewProductSheet;
