"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { cn } from "@/lib/utils";
import { supabase } from "@/supabase";
import { zodResolver } from "@hookform/resolvers/zod";
import type { DialogProps } from "@radix-ui/react-dialog";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  DollarSign,
  Edit,
  Eye,
  FileEdit,
  Loader2,
  Package,
  Plus,
  Search,
  ShoppingCart,
  X,
} from "lucide-react";
import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

const formSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(150, "Name must be 150 characters or less"),
  status: z.enum(["enabled", "disabled", "draft"], {
    required_error: "Please select a status",
  }),
});

type FormData = z.infer<typeof formSchema>;

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

interface CatalogTransition {
  catalog_transition_id: number;
  catalog_id: number;
  item_id: number;
  created_at: string;
  updated_at: string;
  item: Product;
}

interface Catalog {
  catalog_id: number;
  name: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface UpdateCatalogSheetProps
  extends React.ComponentProps<React.FC<DialogProps>> {
  id: string;
}

const UpdateCatalogSheet = (props: UpdateCatalogSheetProps) => {
  const { id, ...sheetProps } = props;
  const IsMobile = useIsMobile();
  const qc = useQueryClient();
  const { openSheet } = useSheet();
  const [searchQuery, setSearchQuery] = useState("");
  const [productSearchQuery, setProductSearchQuery] = useState("");
  const [commandOpen, setCommandOpen] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [originalProductIds, setOriginalProductIds] = useState<Set<number>>(
    new Set()
  );
  const [isSaving, setIsSaving] = useState(false);

  // Fetch existing catalog data
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

  // Fetch products connected to this catalog through catalog_transitions
  const { data: catalogTransitions = [], isLoading: transitionsLoading } =
    useQuery({
      queryKey: ["catalog-transitions", id],
      queryFn: async () => {
        const { data, error } = await supabase
          .from("catalog_transitions")
          .select(
            `
          catalog_transition_id,
          catalog_id,
          item_id,
          created_at,
          updated_at,
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

        if (error) throw error;
        return data as CatalogTransition[];
      },
      enabled: !!id,
    });

  // Fetch all products for the command search (excluding already selected ones)
  const { data: availableProducts = [], isLoading: availableProductsLoading } =
    useQuery({
      queryKey: [
        "available-products",
        productSearchQuery,
        selectedProducts.map((p) => p.item_id),
      ],
      queryFn: async () => {
        let query = supabase.from("item").select("*").order("name");

        // Apply server-side search if query exists
        if (productSearchQuery.trim()) {
          query = query.or(
            `name.ilike.%${productSearchQuery}%,description.ilike.%${productSearchQuery}%`
          );
        }

        // Exclude already selected products
        const selectedIds = selectedProducts.map((p) => p.item_id);
        if (selectedIds.length > 0) {
          query = query.not("item_id", "in", `(${selectedIds.join(",")})`);
        }

        const { data, error } = await query.limit(50);
        if (error) throw error;
        return data as Product[];
      },
      enabled: commandOpen,
    });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      status: "enabled",
    },
  });

  // Initialize selected products and original IDs when catalog transitions load
  useEffect(() => {
    if (catalogTransitions.length > 0) {
      const products = catalogTransitions
        .map((transition) => transition.item)
        .filter(Boolean);
      setSelectedProducts(products);
      setOriginalProductIds(new Set(products.map((p) => p.item_id)));
    }
  }, [catalogTransitions]);

  // Populate form when catalog data is loaded
  useEffect(() => {
    if (catalog) {
      form.reset({
        name: catalog.name || "",
        status: catalog.status as any,
      });
    }
  }, [catalog, form]);

  // Calculate changes for optimization
  const productChanges = useMemo(() => {
    const currentProductIds = new Set(selectedProducts.map((p) => p.item_id));
    const added = selectedProducts.filter(
      (p) => !originalProductIds.has(p.item_id)
    );
    const removed = Array.from(originalProductIds).filter(
      (id) => !currentProductIds.has(id)
    );
    const hasChanges = added.length > 0 || removed.length > 0;

    return { added, removed, hasChanges };
  }, [selectedProducts, originalProductIds]);

  const onSubmit = async (data: FormData) => {
    try {
      setIsSaving(true);

      // Update catalog basic information
      const { error: catalogError } = await supabase
        .from("catalog")
        .update({
          name: data.name,
          status: data.status,
          updated_at: new Date().toISOString(),
        })
        .eq("catalog_id", id as any);

      if (catalogError) {
        throw catalogError;
      }

      // Only update product transitions if there are changes
      if (productChanges.hasChanges) {
        const updates = [];
        const errors = [];

        // Add new product transitions
        if (productChanges.added.length > 0) {
          const addTransitions = productChanges.added.map((product) =>
            supabase.from("catalog_transitions").insert({
              catalog_id: Number.parseInt(id),
              item_id: product.item_id,
            })
          );
          updates.push(...addTransitions);
        }

        // Remove product transitions with better error handling
        if (productChanges.removed.length > 0) {
          for (const productId of productChanges.removed) {
            try {
              const { error } = await supabase
                .from("catalog_transitions")
                .delete()
                .eq("catalog_id", Number.parseInt(id))
                .eq("item_id", productId);

              if (error) {
                // Check if it's a foreign key constraint error
                if (error.code === "23503") {
                  errors.push({
                    productId,
                    error:
                      "Cannot remove product - it's referenced in existing orders",
                    type: "constraint",
                  });
                } else {
                  errors.push({
                    productId,
                    error: error.message,
                    type: "other",
                  });
                }
              }
            } catch (err) {
              errors.push({
                productId,
                error: err instanceof Error ? err.message : "Unknown error",
                type: "other",
              });
            }
          }
        }

        // Execute remaining updates (additions) in parallel
        if (updates.length > 0) {
          const results = await Promise.allSettled(updates);
          const addFailures = results.filter(
            (result) => result.status === "rejected"
          );

          if (addFailures.length > 0) {
            console.error("Some product additions failed:", addFailures);
            errors.push(
              // @ts-ignore
              ...addFailures.map((failure, index) => ({
                productId: productChanges.added[index]?.item_id,
                error: "Failed to add product to catalog",
                type: "addition",
              }))
            );
          }
        }

        // Handle results and show appropriate messages
        if (errors.length > 0) {
          const constraintErrors = errors.filter(
            (e) => e.type === "constraint"
          );
          const otherErrors = errors.filter((e) => e.type !== "constraint");

          if (constraintErrors.length > 0) {
            // Reset the products that couldn't be removed back to selected state
            const failedRemovals = constraintErrors.map((e) => e.productId);
            const originalProducts = catalogTransitions
              .filter((t) => failedRemovals.includes(t.item_id))
              .map((t) => t.item)
              .filter(Boolean);

            setSelectedProducts((prev) => {
              const currentIds = new Set(prev.map((p) => p.item_id));
              const toAdd = originalProducts.filter(
                (p) => !currentIds.has(p.item_id)
              );
              return [...prev, ...toAdd];
            });

            toast.error("Some products couldn't be removed", {
              description: `${constraintErrors.length} product(s) are referenced in existing orders and cannot be removed from the catalog.`,
            });
          }

          if (otherErrors.length > 0) {
            toast.error("Some changes failed", {
              description: `${otherErrors.length} product change(s) failed due to other errors.`,
            });
          }

          // If there were successful changes, show partial success
          const successfulAdds =
            productChanges.added.length -
            errors.filter((e) => e.type === "addition").length;
          const successfulRemoves =
            productChanges.removed.length -
            errors.filter((e) => e.type === "constraint" || e.type === "other")
              .length;

          if (successfulAdds > 0 || successfulRemoves > 0) {
            toast.success("Catalog partially updated", {
              description: `${successfulAdds} products added, ${successfulRemoves} products removed successfully.`,
            });
          }
        } else {
          toast.success("Catalog updated successfully!", {
            description: `${productChanges.added.length} products added, ${productChanges.removed.length} products removed from catalog`,
          });
        }
      } else {
        toast.success("Catalog updated successfully!");
      }

      // Update original product IDs to current state (only for successfully processed items)
      setOriginalProductIds(new Set(selectedProducts.map((p) => p.item_id)));

      // Invalidate queries
      qc.invalidateQueries({
        predicate: (query) =>
          (query.queryKey?.[0] as string)?.startsWith?.("catalog") ||
          (query.queryKey?.[0] as string)?.startsWith?.("product") ||
          (query.queryKey?.[0] as string)?.startsWith?.("item"),
      });
    } catch (err) {
      toast.error("Something went wrong", {
        description:
          err instanceof Error ? err.message : "Unknown error occurred",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Add product to selected list
  const addProduct = (product: Product) => {
    setSelectedProducts((prev) => [...prev, product]);
    setCommandOpen(false);
    setProductSearchQuery("");
  };

  // Remove product from selected list
  const removeProduct = (productId: number) => {
    setSelectedProducts((prev) => prev.filter((p) => p.item_id !== productId));
  };

  // Product Card Component
  const ProductCard = ({ product }: { product: Product }) => {
    const imageUrl = product.image_url
      ? supabase.storage.from("images").getPublicUrl(product.image_url).data
          .publicUrl
      : null;

    const isNewlyAdded = !originalProductIds.has(product.item_id);

    return (
      <div
        className={cn(
          "border border-border/50 rounded-lg p-4 bg-muted/20 hover:bg-muted/40 transition-colors group",
          isNewlyAdded &&
            "border-green-500/50 bg-green-50/50 dark:bg-green-950/20"
        )}
      >
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
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-sm truncate">
                    {product.name}
                  </h4>
                  {isNewlyAdded && (
                    <Badge
                      variant="secondary"
                      className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                    >
                      New
                    </Badge>
                  )}
                </div>
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
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                  onClick={() => removeProduct(product.item_id)}
                  title="Remove from catalog (Note: Products in existing orders cannot be removed)"
                >
                  <X className="h-3 w-3" />
                </Button>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0"
                    onClick={() =>
                      openSheet("product:view", { id: product.item_id })
                    }
                    title="View product"
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
                    title="Edit product"
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                </div>
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
          "min-w-[700px] [&>button:first-of-type]:hidden",
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

        <ScrollArea className="max-h-full min-h-full">
          <SheetHeader className="flex flex-row justify-between items-center border-b select-none border-sidebar-border sticky top-0 bg-background/60 backdrop-blur-lg mb-4">
            <SheetTitle className="flex items-center gap-2">
              <span>Update</span>
              <Badge variant={"secondary"} className="text-lg">
                Catalog
              </Badge>
            </SheetTitle>
            <SheetClose asChild>
              <Button size={"icon"} variant={"ghost"}>
                <X />
              </Button>
            </SheetClose>
          </SheetHeader>

          {catalog ? (
            <div className="pb-20">
              <Form {...form}>
                <div className="space-y-6">
                  {/* Basic Information Section */}
                  <div className="space-y-10 px-6">
                    <h3 className="text-lg font-semibold">Basic Information</h3>

                    {/* Name */}
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem className="grid grid-cols-3 gap-4 items-start space-y-0">
                          <FormLabel className="text-right col-span-1 font-medium text-muted-foreground">
                            Catalog Name
                          </FormLabel>
                          <div className="space-y-2 col-span-2">
                            <FormControl>
                              <Input
                                placeholder="Enter catalog name"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />

                    {/* Status */}
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem className="grid grid-cols-3 gap-4 items-start space-y-0">
                          <FormLabel className="text-right col-span-1 font-medium text-muted-foreground">
                            Status
                          </FormLabel>
                          <div className="space-y-2 col-span-2">
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select catalog status" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="enabled">
                                  <div className="flex items-center gap-2">
                                    <Activity className="h-4 w-4 text-green-500" />
                                    <span>Enabled</span>
                                  </div>
                                </SelectItem>
                                <SelectItem value="disabled">
                                  <div className="flex items-center gap-2">
                                    <Activity className="h-4 w-4 text-red-500" />
                                    <span>Disabled</span>
                                  </div>
                                </SelectItem>
                                <SelectItem value="draft">
                                  <div className="flex items-center gap-2">
                                    <FileEdit className="h-4 w-4 text-yellow-500" />
                                    <span>Draft</span>
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>

                  <Separator />

                  {/* Catalog Products Section */}
                  <div className="space-y-6 px-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        Catalog Products
                        <Badge variant="outline" className="ml-2">
                          {selectedProducts.length}
                        </Badge>
                        {productChanges.hasChanges && (
                          <Badge
                            variant="secondary"
                            className="ml-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                          >
                            {productChanges.added.length +
                              productChanges.removed.length}{" "}
                            changes
                          </Badge>
                        )}
                      </h3>

                      {/* Add Product Command */}
                      <Popover open={commandOpen} onOpenChange={setCommandOpen}>
                        <PopoverTrigger asChild>
                          <Button type="button" size="sm">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Product
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-0" align="end">
                          <Command>
                            <CommandInput
                              placeholder="Search products..."
                              value={productSearchQuery}
                              onValueChange={setProductSearchQuery}
                            />
                            <CommandList>
                              <CommandEmpty>
                                {availableProductsLoading ? (
                                  <div className="flex items-center justify-center py-4">
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    <span>Loading products...</span>
                                  </div>
                                ) : (
                                  "No products found."
                                )}
                              </CommandEmpty>
                              <CommandGroup>
                                {availableProducts.map((product) => (
                                  <CommandItem
                                    key={product.item_id}
                                    value={product.name}
                                    onSelect={() => addProduct(product)}
                                    className="flex items-center gap-3 p-3"
                                  >
                                    <div className="flex-shrink-0">
                                      {product.image_url ? (
                                        <img
                                          src={
                                            supabase.storage
                                              .from("images")
                                              .getPublicUrl(product.image_url)
                                              .data.publicUrl ||
                                            "/placeholder.svg"
                                          }
                                          alt={product.name}
                                          className="w-8 h-8 object-cover rounded border"
                                        />
                                      ) : (
                                        <div className="w-8 h-8 bg-muted rounded border flex items-center justify-center">
                                          <Package className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium text-sm truncate">
                                        {product.name}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        ${product.retail_price}
                                      </p>
                                    </div>
                                    <Plus className="h-4 w-4 text-muted-foreground" />
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>

                    {/* Search Input for current products */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search catalog products..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>

                    {/* Products List */}
                    {transitionsLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm text-muted-foreground">
                            Loading products...
                          </span>
                        </div>
                      </div>
                    ) : selectedProducts.length > 0 ? (
                      <div className="space-y-3 max-h-80 overflow-y-auto">
                        {selectedProducts
                          .filter(
                            (product) =>
                              !searchQuery ||
                              product.name
                                .toLowerCase()
                                .includes(searchQuery.toLowerCase()) ||
                              product.description
                                ?.toLowerCase()
                                .includes(searchQuery.toLowerCase())
                          )
                          .map((product) => (
                            <ProductCard
                              key={product.item_id}
                              product={product}
                            />
                          ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-sm font-medium mb-2">
                          No products in catalog
                        </h3>
                        <p className="text-xs text-muted-foreground max-w-sm mx-auto mb-4">
                          This catalog doesn't have any products added to it
                          yet. Use the "Add Product" button to add products to
                          this catalog.
                        </p>
                      </div>
                    )}
                  </div>

                  <Separator />
                </div>
              </Form>
            </div>
          ) : (
            // Error State / Not Found
            <div className="flex flex-col items-center justify-center h-96 text-center px-4">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <X className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Catalog not found</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                The catalog you're trying to update doesn't exist or may have
                been deleted. Please check the catalog ID and try again.
              </p>
              <Button variant="outline" className="mt-4 bg-transparent" asChild>
                <SheetClose>Go back</SheetClose>
              </Button>
            </div>
          )}

          <div className="flex justify-end gap-3 p-4 border-t absolute bottom-0 right-0 left-0 mt-auto bg-background/60 backdrop-blur-lg">
            <SheetClose asChild>
              <Button type="button" variant="outline" disabled={isSaving}>
                Cancel
              </Button>
            </SheetClose>
            <Button
              type="button"
              disabled={isLoading || !catalog || isSaving}
              onClick={() => {
                form.handleSubmit(onSubmit)();
              }}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving Changes...
                </>
              ) : (
                <>
                  Update Catalog
                  {productChanges.hasChanges && (
                    <Badge
                      variant="secondary"
                      className="ml-2 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                    >
                      {productChanges.added.length +
                        productChanges.removed.length}
                    </Badge>
                  )}
                </>
              )}
            </Button>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export default UpdateCatalogSheet;
