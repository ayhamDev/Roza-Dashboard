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
  DollarSign,
  Edit,
  Eye,
  Loader2,
  Package,
  Plus,
  Search,
  ShoppingCart,
  X,
} from "lucide-react";
import type React from "react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
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
  category_id?: number;
  created_at: string;
  updated_at?: string;
}

const CreateCategorySheet = (
  props: React.ComponentProps<React.FC<DialogProps>>
) => {
  const IsMobile = useIsMobile();
  const qc = useQueryClient();
  const { openSheet } = useSheet();
  const [searchQuery, setSearchQuery] = useState("");
  const [productSearchQuery, setProductSearchQuery] = useState("");
  const [commandOpen, setCommandOpen] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
    },
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

  const onSubmit = async (data: FormData) => {
    try {
      setIsSaving(true);

      // Create category first
      const { data: categoryData, error: categoryError } = await supabase
        .from("item_category")
        .insert({
          name: data.name,
        })
        .select()
        .single();

      if (categoryError) {
        throw categoryError;
      }

      // If products are selected, assign them to the new category
      if (selectedProducts.length > 0) {
        const productUpdates = selectedProducts.map((product) =>
          supabase
            .from("item")
            .update({
              category_id: categoryData.category_id,
              updated_at: new Date().toISOString(),
            })
            .eq("item_id", product.item_id)
        );

        // Execute all product updates in parallel
        const results = await Promise.allSettled(productUpdates);

        // Check for any failures
        const failures = results.filter(
          (result) => result.status === "rejected"
        );
        if (failures.length > 0) {
          console.error("Some product updates failed:", failures);
          toast.error(
            "Category created but some products couldn't be assigned",
            {
              description:
                "You can assign them later from the category details",
            }
          );
        } else {
          toast.success("Category created successfully!", {
            description: `${selectedProducts.length} products assigned to the new category`,
          });
        }
      } else {
        toast.success("Category created successfully!");
      }

      props?.onOpenChange?.(false);

      // Invalidate queries
      qc.invalidateQueries({
        predicate: (query) =>
          (query.queryKey?.[0] as string)?.startsWith?.("category") ||
          (query.queryKey?.[0] as string)?.startsWith?.("product") ||
          (query.queryKey?.[0] as string)?.startsWith?.("item"),
      });

      // Reset form and selected products
      form.reset();
      setSelectedProducts([]);
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

    return (
      <div className="border border-green-500/50 bg-green-50/50 dark:bg-green-950/20 rounded-lg p-4 hover:bg-green-100/50 dark:hover:bg-green-950/30 transition-colors group">
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
                  <Badge
                    variant="secondary"
                    className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                  >
                    Selected
                  </Badge>
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
                  <span className="font-medium">
                    ${product.wholesale_price}
                  </span>
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
                  title="Remove from selection"
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
    <Sheet {...props}>
      <SheetContent
        className={cn(
          "min-w-[700px] [&>button:first-of-type]:hidden",
          IsMobile && "min-w-auto w-full"
        )}
      >
        <ScrollArea className="max-h-full min-h-full">
          <SheetHeader className="flex flex-row justify-between items-center border-b select-none border-sidebar-border sticky top-0 bg-background/60 backdrop-blur-lg mb-4">
            <SheetTitle className="flex items-center gap-2">
              <span>Create New</span>
              <Badge variant={"secondary"} className="text-lg">
                Category
              </Badge>
            </SheetTitle>
            <SheetClose asChild>
              <Button size={"icon"} variant={"ghost"}>
                <X />
              </Button>
            </SheetClose>
          </SheetHeader>

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
                          Category Name
                        </FormLabel>
                        <div className="space-y-2 col-span-2">
                          <FormControl>
                            <Input
                              placeholder="Enter category name"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                {/* Products Section */}
                <div className="space-y-6 px-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Products to Assign
                      {selectedProducts.length > 0 && (
                        <Badge variant="outline" className="ml-2">
                          {selectedProducts.length}
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
                                      ${product.wholesale_price}
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

                  {selectedProducts.length > 0 && (
                    <>
                      {/* Search Input for selected products */}
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search selected products..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10"
                        />
                      </div>

                      {/* Products List */}
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
                    </>
                  )}

                  {selectedProducts.length === 0 && (
                    <div className="text-center py-8">
                      <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-sm font-medium mb-2">
                        No products selected
                      </h3>
                      <p className="text-xs text-muted-foreground max-w-sm mx-auto mb-4">
                        You can create the category without products and assign
                        them later, or use the "Add Product" button to select
                        products now.
                      </p>
                    </div>
                  )}
                </div>

                <Separator />
              </div>
            </Form>
          </div>

          <div className="flex justify-end gap-3 p-4 border-t absolute bottom-0 right-0 left-0 mt-auto bg-background/60 backdrop-blur-lg">
            <SheetClose asChild>
              <Button type="button" variant="outline" disabled={isSaving}>
                Cancel
              </Button>
            </SheetClose>
            <Button
              type="button"
              disabled={isSaving}
              onClick={() => {
                form.handleSubmit(onSubmit)();
              }}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Creating Category...
                </>
              ) : (
                <>
                  Create Category
                  {selectedProducts.length > 0 && (
                    <Badge
                      variant="secondary"
                      className="ml-2 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                    >
                      +{selectedProducts.length}
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

export default CreateCategorySheet;
