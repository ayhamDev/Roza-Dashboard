"use client";

import AppCopyButton from "@/components/app/AppCopyButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { cn } from "@/lib/utils";
import { supabase } from "@/supabase";
import type { DialogProps } from "@radix-ui/react-dialog";
import { useQuery } from "@tanstack/react-query";
import {
  Calendar,
  Clock,
  DollarSign,
  Edit,
  Eye,
  Hash,
  Info,
  Loader2,
  Package,
  Search,
  ShoppingCart,
  Trash,
  X,
  BookOpen,
  Activity,
} from "lucide-react";
import type React from "react";
import { useState } from "react";

interface ViewCatalogSheetProps
  extends React.ComponentProps<React.FC<DialogProps>> {
  id: string;
}

interface Product {
  item_id: number;
  name: string;
  description?: string;
  cost_price: number;
  retail_price: number;
  wholesale_price: number;
  stock_quantity: number;
  is_catalog_visible: boolean;
  image_url?: string;
  created_at: string;
  updated_at?: string;
}

interface Catalog {
  catalog_id: number;
  name: string;
  status: string;
  created_at: string;
  updated_at: string;
}

const ViewCatalogSheet = (props: ViewCatalogSheetProps) => {
  const { id, ...sheetProps } = props;
  const IsMobile = useIsMobile();
  const { openSheet } = useSheet();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: catalog, isLoading } = useQuery({
    queryKey: ["catalog", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("catalog")
        .select("*")
        .eq("catalog_id", id as any)
        .single();

      if (error) throw error;
      return data as Catalog;
    },
  });

  // Fetch products connected to this catalog through catalog_transitions with server-side search
  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ["catalog-products", id, searchQuery],
    queryFn: async () => {
      const query = supabase
        .from("catalog_transitions")
        .select(
          `
          item:item_id (
            item_id,
            name,
            description,
            cost_price,
            retail_price,
            wholesale_price,
            stock_quantity,
            is_catalog_visible,
            image_url,
            created_at,
            updated_at
          )
        `
        )
        .eq("catalog_id", id as any);

      const { data, error } = await query;
      if (error) throw error;

      // Extract items from the nested structure and filter by search query
      let items = data
        .map((transition: any) => transition.item)
        .filter(Boolean) as Product[];

      // Apply client-side search if query exists (since we can't do server-side search on joined data easily)
      if (searchQuery.trim()) {
        const searchLower = searchQuery.toLowerCase();
        items = items.filter(
          (item) =>
            item.name.toLowerCase().includes(searchLower) ||
            item.description?.toLowerCase().includes(searchLower)
        );
      }

      // Sort by created_at descending
      items.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      return items;
    },
    enabled: !!id,
  });

  // Contact method component for better visual representation (non-clickable)
  const ContactMethod = ({
    icon: Icon,
    label,
    value,
  }: {
    icon: React.ElementType;
    label: string;
    value: string | null | undefined;
  }) => {
    if (!value) return null;

    return (
      <div className="flex items-center gap-4 border-border/50 bg-muted/30 rounded-lg p-4 border group">
        <div className="flex-shrink-0">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0 flex flex-col gap-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {label}
          </p>
          <p className="text-sm font-medium truncate">{value}</p>
        </div>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <AppCopyButton text={value} />
        </div>
      </div>
    );
  };

  // Status Badge Component
  const StatusBadge = ({ status }: { status: string }) => {
    const getStatusColor = (status: string) => {
      switch (status.toLowerCase()) {
        case "enabled":
          return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
        case "disabled":
          return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
        case "draft":
          return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
        default:
          return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
      }
    };

    return (
      <div className="flex items-center gap-4 border-border/50 bg-muted/30 rounded-lg p-4 border group">
        <div className="flex-shrink-0">
          <Activity className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0 flex flex-col gap-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Status
          </p>
          <Badge className={cn("w-fit text-xs", getStatusColor(status))}>
            {status.toUpperCase()}
          </Badge>
        </div>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <AppCopyButton text={status} />
        </div>
      </div>
    );
  };

  // Product Card Component
  const ProductCard = ({ product }: { product: Product }) => {
    const imageUrl = product.image_url
      ? supabase.storage.from("images").getPublicUrl(product.image_url).data
          .publicUrl
      : null;

    return (
      <div className="border border-border/50 rounded-lg p-4 bg-muted/20 hover:bg-muted/40 transition-colors group">
        <div className="flex gap-4">
          {/* Product Image */}
          <div className="flex-shrink-0">
            {imageUrl ? (
              <img
                src={imageUrl || "/placeholder.svg"}
                alt={product.name}
                className="w-16 h-16 object-cover rounded-lg border border-border/50"
              />
            ) : (
              <div className="w-16 h-16 bg-muted rounded-lg border border-border/50 flex items-center justify-center">
                <Package className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm truncate">{product.name}</h4>
                {product.description && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {product.description}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1">
                {product.is_catalog_visible ? (
                  <Badge variant="secondary" className="text-xs">
                    <Eye className="h-3 w-3 mr-1" />
                    Visible
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs">
                    Hidden
                  </Badge>
                )}
              </div>
            </div>

            {/* Pricing and Stock */}
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3 text-muted-foreground" />
                  <span className="font-medium">${product.retail_price}</span>
                </div>
                <div className="flex items-center gap-1">
                  <ShoppingCart className="h-3 w-3 text-muted-foreground" />
                  <span>{product.stock_quantity} in stock</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0"
                  onClick={() =>
                    openSheet("product:view", { id: product.item_id })
                  }
                >
                  <Eye className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0"
                  onClick={() =>
                    openSheet("product:update", { id: product.item_id })
                  }
                >
                  <Edit className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Sheet {...sheetProps}>
      <SheetContent
        className={cn(
          "w-[700px] min-w-[700px] max-w-[700px] [&>button:first-of-type]:hidden",
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
                <p className="text-sm font-medium">Loading catalog details</p>
                <p className="text-xs text-muted-foreground">Please wait...</p>
              </div>
            </div>
          </div>
        )}

        <ScrollArea className="h-full">
          <div className="space-y-6 pb-6 mb-20">
            <SheetHeader className="flex flex-row justify-between items-center border-b select-none border-sidebar-border sticky top-0 bg-background/60 backdrop-blur-lg mb-4">
              <SheetTitle className="flex items-center gap-2">
                <Badge variant={"secondary"} className="text-lg">
                  Catalog
                </Badge>
                <span>Details</span>
              </SheetTitle>
              <SheetClose asChild>
                <Button size={"icon"} variant={"ghost"}>
                  <X />
                </Button>
              </SheetClose>
            </SheetHeader>

            {catalog ? (
              <div className="space-y-6">
                {/* Basic Information Card */}
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Info className="h-5 w-5 text-primary" />
                    Basic Information
                  </CardTitle>
                </CardHeader>

                <div className="px-6">
                  <div className="grid gap-4">
                    <ContactMethod
                      icon={Hash}
                      label="Catalog ID"
                      value={catalog?.catalog_id as any}
                    />
                    <ContactMethod
                      icon={BookOpen}
                      label="Catalog Name"
                      value={catalog.name}
                    />
                    <StatusBadge status={catalog.status} />
                  </div>
                </div>

                <Separator />

                {/* Connected Products Section */}
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-lg">
                      <Package className="h-5 w-5 text-primary" />
                      Catalog Items
                      <Badge variant="outline" className="ml-2">
                        {products.length}
                      </Badge>
                    </div>
                  </CardTitle>
                </CardHeader>

                <div className="px-6 space-y-4">
                  {/* Search Input */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search products by name or description..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  {/* Products List */}
                  {productsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm text-muted-foreground">
                          Loading products...
                        </span>
                      </div>
                    </div>
                  ) : products.length > 0 ? (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {products.map((product) => (
                        <ProductCard key={product.item_id} product={product} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-sm font-medium mb-2">
                        {searchQuery
                          ? "No products found"
                          : "No products in catalog"}
                      </h3>
                      <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                        {searchQuery
                          ? `No products match "${searchQuery}". Try adjusting your search terms.`
                          : "This catalog doesn't have any products added to it yet."}
                      </p>
                      {!searchQuery && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-4 bg-transparent"
                          onClick={() =>
                            openSheet("catalog:update", {
                              id: catalog.catalog_id,
                            })
                          }
                        >
                          <Package className="h-4 w-4 mr-2" />
                          Add Products
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                <Separator />

                {/* Timeline Section */}
                {(catalog.created_at || catalog.updated_at) && (
                  <>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Clock className="h-5 w-5 text-primary" />
                        Timeline
                      </CardTitle>
                    </CardHeader>

                    <div className="space-y-4 px-6">
                      {catalog.created_at && (
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                              Created
                            </p>
                            <p className="text-sm font-medium flex gap-2">
                              {getFormattedDateMeta(catalog.created_at).full}
                              <span className="text-muted-foreground text-sm">
                                (
                                {
                                  getFormattedDateMeta(catalog.created_at)
                                    .relative
                                }
                                )
                              </span>
                            </p>
                          </div>
                        </div>
                      )}
                      {catalog.updated_at && (
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                              Last Updated
                            </p>
                            <p className="text-sm font-medium flex gap-2">
                              {getFormattedDateMeta(catalog.updated_at).full}
                              <span className="text-muted-foreground text-sm">
                                (
                                {
                                  getFormattedDateMeta(catalog.updated_at)
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
                  <BookOpen className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  Catalog not found
                </h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  The catalog you're looking for doesn't exist or may have been
                  deleted. Please check the catalog ID and try again.
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

          {catalog && (
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
                  if (!catalog) return null;
                  openSheet("catalog:update", { id: catalog?.catalog_id });
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

export default ViewCatalogSheet;
