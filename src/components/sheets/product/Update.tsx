"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
  FormDescription,
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
import { Textarea } from "@/components/ui/textarea";
import { useSheet } from "@/context/sheets";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { supabase } from "@/supabase";
import { zodResolver } from "@hookform/resolvers/zod";
import type { DialogProps } from "@radix-ui/react-dialog";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  ChevronDown,
  DollarSign,
  Hash,
  ImageIcon,
  Link,
  Loader2,
  Package,
  Plus,
  Tag,
  Upload,
  Warehouse,
  X,
} from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

const formSchema = z.object({
  name: z
    .string()
    .min(1, "Product name is required")
    .max(150, "Name must be 150 characters or less"),
  description: z.string().optional(),
  category_id: z.number().min(1, "Please select a category"),
  cost_price: z
    .string()
    .min(1, "Cost price is required")
    .refine((val) => {
      const num = Number.parseFloat(val);
      return !isNaN(num) && num >= 0;
    }, "Cost price must be a valid positive number"),
  retail_price: z
    .string()
    .min(1, "Retail price is required")
    .refine((val) => {
      const num = Number.parseFloat(val);
      return !isNaN(num) && num >= 0;
    }, "Retail price must be a valid positive number"),
  wholesale_price: z
    .string()
    .min(1, "Wholesale price is required")
    .refine((val) => {
      const num = Number.parseFloat(val);
      return !isNaN(num) && num >= 0;
    }, "Wholesale price must be a valid positive number"),
  stock_quantity: z.string().refine((val) => {
    const num = Number.parseInt(val);
    return !isNaN(num) && num >= 0;
  }, "Stock quantity must be a valid non-negative number"),
  is_catalog_visible: z.boolean(),
});

type FormData = z.infer<typeof formSchema>;

interface Category {
  category_id: number;
  name: string;
  icon?: string;
}

interface UpdateProductSheetProps
  extends React.ComponentProps<React.FC<DialogProps>> {
  id: string;
}

const UpdateProductSheet = (props: UpdateProductSheetProps) => {
  const { id, ...sheetProps } = props;
  const { openSheet } = useSheet();
  const IsMobile = useIsMobile();
  const qc = useQueryClient();
  const [categorySearch, setCategorySearch] = useState("");
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  // NEW: State to track if the user explicitly removes the image
  const [imageWasRemoved, setImageWasRemoved] = useState(false);

  // Fetch existing product data
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
            name,
            icon
          )
        `
        )
        .eq("item_id", id as any)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      category_id: 0,
      cost_price: "",
      retail_price: "",
      wholesale_price: "",
      stock_quantity: "0",
      is_catalog_visible: true,
    },
  });

  // Populate form when product data is loaded
  useEffect(() => {
    if (product) {
      form.reset({
        name: product.name || "",
        description: product.description || "",
        category_id: product.category_id || 0,
        cost_price: product.cost_price?.toString() || "",
        retail_price: product.retail_price?.toString() || "",
        wholesale_price: product.wholesale_price?.toString() || "",
        stock_quantity: product.stock_quantity?.toString() || "0",
        is_catalog_visible: product.is_catalog_visible ?? true,
      });

      // Set existing image preview if available
      if (product.image_url) {
        const { data } = supabase.storage
          .from("images")
          .getPublicUrl(product.image_url);
        setImagePreview(data.publicUrl);
      }
    }
  }, [product, form]);

  // Fetch categories with search
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ["category", categorySearch],
    queryFn: async () => {
      let query = supabase
        .from("item_category")
        .select("category_id, name, icon")
        .order("name");

      if (categorySearch.trim()) {
        query = query.ilike("name", `%${categorySearch}%`);
      }

      const { data, error } = await query.limit(50);
      if (error) throw error;
      return data as Category[];
    },
  });

  // Handle image selection
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    setSelectedImage(file);
    // NEW: Ensure the removal flag is reset if a new image is chosen
    setImageWasRemoved(false);

    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Upload image to Supabase storage
  const uploadImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from("images")
      .upload(fileName, file);

    if (error) throw error;
    return data.path;
  };

  const onSubmit = async (data: FormData) => {
    try {
      setIsUploading(true);

      let imagePath: string | null = product?.image_url || null;

      // --- KEY LOGIC FOR IMAGE HANDLING ---

      // SCENARIO 1: A new image has been selected to replace the old one (or add a new one).
      if (selectedImage) {
        // If an old image exists, delete it from storage first.
        if (product?.image_url) {
          await supabase.storage.from("images").remove([product.image_url]);
        }
        // Upload the new image and get its path.
        imagePath = await uploadImage(selectedImage);
      }
      // SCENARIO 2: The user explicitly removed the existing image without selecting a new one.
      else if (imageWasRemoved && product?.image_url) {
        // Delete the old image from storage.
        await supabase.storage.from("images").remove([product.image_url]);
        // Set the database path to null.
        imagePath = null;
      }
      // SCENARIO 3: The image was not changed. `imagePath` remains the original `product.image_url`.

      // Update product in the database
      const { error } = await supabase
        .from("item")
        .update({
          name: data.name,
          description: data.description || null,
          category_id: data.category_id,
          cost_price: Number.parseFloat(data.cost_price),
          retail_price: Number.parseFloat(data.retail_price),
          wholesale_price: Number.parseFloat(data.wholesale_price),
          stock_quantity: Number.parseInt(data.stock_quantity),
          is_catalog_visible: data.is_catalog_visible,
          image_url: imagePath, // Use the determined image path
          updated_at: new Date().toISOString(),
        })
        .eq("item_id", id as any);

      if (error) {
        toast.error("Failed to update product", {
          description: error.message,
        });
      } else {
        props?.onOpenChange?.(false);
        toast.success("Product updated successfully!");
        qc.invalidateQueries({
          predicate: (query) =>
            (query.queryKey?.[0] as string)?.startsWith?.("product") ||
            (query.queryKey?.[0] as string)?.startsWith?.("item"),
        });
      }
    } catch (err) {
      toast.error("Something went wrong", {
        description:
          err instanceof Error ? err.message : "Unknown error occurred",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const selectedCategory = categories.find(
    (cat) => cat.category_id === form.watch("category_id")
  );

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
                <p className="text-sm font-medium">Loading product details</p>
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
                Product
              </Badge>
            </SheetTitle>
            <SheetClose asChild>
              <Button size={"icon"} variant={"ghost"}>
                <X />
              </Button>
            </SheetClose>
          </SheetHeader>

          {product ? (
            <div className="pb-20">
              <Form {...form}>
                <div className="space-y-6">
                  {/* Product Image Section */}
                  <div className="space-y-6 px-6">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <ImageIcon className="h-5 w-5" />
                      Product Image
                    </h3>

                    <div className="grid grid-cols-3 gap-4 items-start space-y-0">
                      <div className="text-left col-span-1 font-medium text-muted-foreground">
                        The Product Image
                      </div>
                      <div className="space-y-4 col-span-2">
                        {imagePreview ? (
                          <div className="flex gap-4">
                            <img
                              src={imagePreview || "/placeholder.svg"}
                              alt="Product preview"
                              className="w-full max-w-xs aspect-square object-contain rounded-lg border border-border"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                setSelectedImage(null);
                                setImagePreview(null);
                                // NEW: Set flag to true on removal
                                setImageWasRemoved(true);
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                            <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <p className="text-sm text-muted-foreground mb-4">
                              Upload a product image
                            </p>
                            <Button type="button" variant="outline" asChild>
                              <label className="cursor-pointer">
                                <Upload className="h-4 w-4 mr-2" />
                                Choose Image
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={handleImageSelect}
                                />
                              </label>
                            </Button>
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Supported formats: JPG, PNG, GIF. Max size: 5MB
                        </p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Other form sections remain unchanged... */}
                  <div className="space-y-6 px-6">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Basic Information
                    </h3>
                    <FormItem className="grid grid-cols-3 gap-4 items-start space-y-0">
                      <FormLabel className="text-right col-span-1 font-medium text-muted-foreground">
                        Product ID
                      </FormLabel>
                      <div className="space-y-2 col-span-2">
                        <Badge variant={"secondary"} className="text-md">
                          <Hash />
                          {product.item_id}
                        </Badge>
                      </div>
                    </FormItem>
                    {/* Product Name */}
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem className="grid grid-cols-3 gap-4 items-start space-y-0">
                          <FormLabel className="text-right col-span-1 font-medium text-muted-foreground">
                            Product Name *
                          </FormLabel>
                          <div className="space-y-2 col-span-2">
                            <FormControl>
                              <Input
                                placeholder="Enter product name"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />

                    {/* Description */}
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem className="grid grid-cols-3 gap-4 items-start space-y-0">
                          <FormLabel className="text-right col-span-1 font-medium text-muted-foreground">
                            Description
                          </FormLabel>
                          <div className="space-y-2 col-span-2">
                            <FormControl>
                              <Textarea
                                placeholder="Enter product description"
                                rows={3}
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

                  <div className="space-y-6 px-6">
                    {/* Category Selection */}
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Link className="h-5 w-5 text-primary" />
                      Relationships
                    </h3>
                    <FormField
                      control={form.control}
                      name="category_id"
                      render={({ field }) => (
                        <FormItem className="grid grid-cols-3 gap-4 items-start space-y-0">
                          <FormLabel className="text-right col-span-1 font-medium text-muted-foreground">
                            Category *
                          </FormLabel>
                          <div className="space-y-2 col-span-2">
                            <Popover
                              open={categoryOpen}
                              onOpenChange={setCategoryOpen}
                            >
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    role="combobox"
                                    className={cn(
                                      "w-full justify-between",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {selectedCategory ? (
                                      <div className="flex items-center gap-2">
                                        <Tag className="h-4 w-4" />
                                        {selectedCategory.name}
                                      </div>
                                    ) : (
                                      "Select category"
                                    )}
                                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent
                                className="w-full p-0"
                                align="start"
                              >
                                <Command>
                                  <CommandInput
                                    placeholder="Search categories..."
                                    value={categorySearch}
                                    onValueChange={setCategorySearch}
                                  />
                                  <CommandList>
                                    <CommandEmpty>
                                      {categoriesLoading ? (
                                        <div className="flex items-center justify-center py-4">
                                          <Loader2 className="h-4 w-4 animate-spin" />
                                          <span className="ml-2">
                                            Loading...
                                          </span>
                                        </div>
                                      ) : (
                                        <Button
                                          size={"sm"}
                                          className="w-full pointer-fine"
                                          variant={"secondary"}
                                          onClick={() => {
                                            openSheet("category:create");
                                          }}
                                        >
                                          <Plus />
                                          Create New{" "}
                                        </Button>
                                      )}
                                    </CommandEmpty>
                                    <CommandGroup>
                                      {categories.map((category) => (
                                        <CommandItem
                                          key={category.category_id}
                                          value={category.name}
                                          onSelect={() => {
                                            field.onChange(
                                              category.category_id
                                            );
                                            setCategoryOpen(false);
                                          }}
                                        >
                                          <Check
                                            className={cn(
                                              "mr-2 h-4 w-4",
                                              field.value ===
                                                category.category_id
                                                ? "opacity-100"
                                                : "opacity-0"
                                            )}
                                          />
                                          <div className="flex items-center gap-2">
                                            <Tag className="h-4 w-4" />
                                            <span className="truncate max-w-[200px]">
                                              {category.name}
                                            </span>
                                          </div>
                                        </CommandItem>
                                      ))}
                                      <CommandItem className="pointer-none">
                                        <Button
                                          size={"sm"}
                                          className="w-full pointer-fine"
                                          variant={"secondary"}
                                          onClick={() => {
                                            openSheet("category:create");
                                          }}
                                        >
                                          <Plus />
                                          Create New{" "}
                                        </Button>
                                      </CommandItem>
                                    </CommandGroup>
                                  </CommandList>
                                </Command>
                              </PopoverContent>
                            </Popover>
                            <FormDescription>
                              Connect Your Product to its associated category
                            </FormDescription>
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>

                  <Separator />

                  {/* Pricing Information Section */}
                  <div className="space-y-6 px-6">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      Pricing Information
                    </h3>

                    {/* Cost Price */}
                    <FormField
                      control={form.control}
                      name="cost_price"
                      render={({ field }) => (
                        <FormItem className="grid grid-cols-3 gap-4 items-start space-y-0">
                          <FormLabel className="text-right col-span-1 font-medium text-muted-foreground">
                            Cost Price *
                          </FormLabel>
                          <div className="space-y-2 col-span-2">
                            <FormControl>
                              <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  placeholder="0.00"
                                  className="pl-10"
                                  {...field}
                                />
                              </div>
                            </FormControl>
                            <FormDescription>
                              The cost you pay for this product
                            </FormDescription>
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />

                    {/* Retail Price */}
                    <FormField
                      control={form.control}
                      name="retail_price"
                      render={({ field }) => (
                        <FormItem className="grid grid-cols-3 gap-4 items-start space-y-0">
                          <FormLabel className="text-right col-span-1 font-medium text-muted-foreground">
                            Retail Price *
                          </FormLabel>
                          <div className="space-y-2 col-span-2">
                            <FormControl>
                              <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  placeholder="0.00"
                                  className="pl-10"
                                  {...field}
                                />
                              </div>
                            </FormControl>
                            <FormDescription>
                              Price for individual customers
                            </FormDescription>
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />

                    {/* Wholesale Price */}
                    <FormField
                      control={form.control}
                      name="wholesale_price"
                      render={({ field }) => (
                        <FormItem className="grid grid-cols-3 gap-4 items-start space-y-0">
                          <FormLabel className="text-right col-span-1 font-medium text-muted-foreground">
                            Wholesale Price *
                          </FormLabel>
                          <div className="space-y-2 col-span-2">
                            <FormControl>
                              <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  placeholder="0.00"
                                  className="pl-10"
                                  {...field}
                                />
                              </div>
                            </FormControl>
                            <FormDescription>
                              Price for bulk/wholesale customers
                            </FormDescription>
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />

                    {/* Profit Margin Preview */}
                    {form.watch("cost_price") && form.watch("retail_price") && (
                      <div className="grid grid-cols-3 gap-4 items-start space-y-0">
                        <div className="text-left col-span-1 font-medium text-muted-foreground">
                          Profit Margins
                        </div>
                        <div className="col-span-2 bg-muted/30 rounded-lg p-3 border border-border/50">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">
                                Retail Margin
                              </p>
                              <p className="font-medium">
                                $
                                {(
                                  Number.parseFloat(
                                    form.watch("retail_price") || "0"
                                  ) -
                                  Number.parseFloat(
                                    form.watch("cost_price") || "0"
                                  )
                                ).toFixed(2)}
                                {form.watch("cost_price") &&
                                  Number.parseFloat(form.watch("cost_price")) >
                                    0 && (
                                    <span className="text-muted-foreground ml-1">
                                      (
                                      {(
                                        ((Number.parseFloat(
                                          form.watch("retail_price") || "0"
                                        ) -
                                          Number.parseFloat(
                                            form.watch("cost_price") || "0"
                                          )) /
                                          Number.parseFloat(
                                            form.watch("cost_price")
                                          )) *
                                        100
                                      ).toFixed(1)}
                                      %)
                                    </span>
                                  )}
                              </p>
                            </div>
                            {form.watch("wholesale_price") && (
                              <div>
                                <p className="text-muted-foreground">
                                  Wholesale Margin
                                </p>
                                <p className="font-medium">
                                  $
                                  {(
                                    Number.parseFloat(
                                      form.watch("wholesale_price") || "0"
                                    ) -
                                    Number.parseFloat(
                                      form.watch("cost_price") || "0"
                                    )
                                  ).toFixed(2)}
                                  {form.watch("cost_price") &&
                                    Number.parseFloat(
                                      form.watch("cost_price")
                                    ) > 0 && (
                                      <span className="text-muted-foreground ml-1">
                                        (
                                        {(
                                          ((Number.parseFloat(
                                            form.watch("wholesale_price") || "0"
                                          ) -
                                            Number.parseFloat(
                                              form.watch("cost_price") || "0"
                                            )) /
                                            Number.parseFloat(
                                              form.watch("cost_price")
                                            )) *
                                          100
                                        ).toFixed(1)}
                                        %)
                                      </span>
                                    )}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Inventory & Settings Section */}
                  <div className="space-y-6 px-6">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Warehouse className="h-5 w-5" />
                      Inventory & Settings
                    </h3>

                    {/* Stock Quantity */}
                    <FormField
                      control={form.control}
                      name="stock_quantity"
                      render={({ field }) => (
                        <FormItem className="grid grid-cols-3 gap-4 items-start space-y-0">
                          <FormLabel className="text-right col-span-1 font-medium text-muted-foreground">
                            Stock Quantity
                          </FormLabel>
                          <div className="space-y-2 col-span-2">
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                placeholder="0"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Number of units available in stock
                            </FormDescription>
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />

                    {/* Catalog Visibility */}
                    <FormField
                      control={form.control}
                      name="is_catalog_visible"
                      render={({ field }) => (
                        <FormItem className="grid grid-cols-3 gap-4 items-start space-y-0">
                          <FormLabel className="text-right col-span-1 font-medium text-muted-foreground">
                            Catalog Visibility
                          </FormLabel>
                          <div className="space-y-2 col-span-2">
                            <div className="flex items-center space-x-2">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <FormLabel className="text-sm font-normal">
                                Make this product visible in the catalog
                              </FormLabel>
                            </div>
                            <FormDescription>
                              When enabled, customers can see this product in
                              your catalog
                            </FormDescription>
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </Form>
            </div>
          ) : (
            // Error State / Not Found
            !isLoading && (
              <div className="flex flex-col items-center justify-center h-96 text-center px-4">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <X className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  Product not found
                </h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  The product you're trying to update doesn't exist or may have
                  been deleted. Please check the product ID and try again.
                </p>
                <Button
                  variant="outline"
                  className="mt-4 bg-transparent"
                  asChild
                >
                  <SheetClose>Go back</SheetClose>
                </Button>
              </div>
            )
          )}

          <div className="flex justify-end gap-3 p-4 border-t absolute bottom-0 right-0 left-0 mt-auto bg-background/60 backdrop-blur-lg">
            <SheetClose asChild>
              <Button type="button" variant="outline" disabled={isUploading}>
                Cancel
              </Button>
            </SheetClose>
            <Button
              type="button"
              disabled={isUploading || isLoading || !product}
              onClick={() => {
                form.handleSubmit(onSubmit)();
              }}
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating Product...
                </>
              ) : (
                "Update Product"
              )}
            </Button>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export default UpdateProductSheet;
