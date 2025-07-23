"use client";

import { statusConfig } from "@/components/app/AppStatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardHeader, CardTitle } from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import { useSheet } from "@/context/sheets";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { supabase } from "@/supabase";
import { zodResolver } from "@hookform/resolvers/zod";
import type { DialogProps } from "@radix-ui/react-dialog";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BookOpen,
  Check,
  ChevronDown,
  DollarSign,
  Edit,
  ExternalLink,
  Eye,
  Hash,
  Info,
  Loader2,
  Minus,
  Package,
  Plus,
  Receipt,
  Search,
  ShoppingCart,
  Trash2,
  Truck,
  User,
  X,
} from "lucide-react";
import type React from "react";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

const formSchema = z.object({
  status: z.enum(
    ["Pending", "Confirmed", "Shipped", "Delivered", "Cancelled"],
    {
      required_error: "Please select a status",
    }
  ),
  shipping_address_line1: z.string().optional(),
  shipping_address_line2: z.string().optional(),
  shipping_city: z.string().optional(),
  shipping_state: z.string().optional(),
  shipping_zip: z.string().optional(),
  shipping_country: z.string().optional(),
  shipping_notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface OrderItem {
  item_id: number;
  quantity: number;
  unit_price: number;
  catalog_transition_id: number;
  catalog_transitions: {
    catalog_transition_id: number;
    item: {
      item_id: number;
      name: string;
      description?: string;
      image_url?: string;
      retail_price: number;
      stock_quantity: number;
      is_catalog_visible: boolean;
    };
  };
}

interface EditableOrderItem extends OrderItem {
  isEdited?: boolean;
  originalQuantity?: number;
  originalUnitPrice?: number;
}

interface Order {
  order_id: number;
  client_id: number;
  catalog_id: number;
  total_amount: number;
  shipping_address_line1?: string;
  shipping_address_line2?: string;
  shipping_city?: string;
  shipping_state?: string;
  shipping_zip?: number;
  shipping_country?: string;
  shipping_notes?: string;
  status: string;
  created_at: string;
  updated_at: string;
  client: {
    client_id: number;
    name: string;
    email: string;
    phone?: string;
    whatsapp_phone?: string;
  };
  catalog: {
    catalog_id: number;
    name: string;
    status: string;
  };
}

interface Client {
  client_id: number;
  name: string;
  email: string;
}

interface Catalog {
  catalog_id: number;
  name: string;
  status: string;
}

interface Product {
  item_id: number;
  name: string;
  description?: string;
  retail_price: number;
  stock_quantity: number;
  is_catalog_visible: boolean;
  image_url?: string;
}

interface UpdateOrderSheetProps
  extends React.ComponentProps<React.FC<DialogProps>> {
  id: string;
}

// Memoized Order Item Card Component
const OrderItemCard = memo(
  ({
    item,
    onQuantityChange,
    onPriceChange,
    onRemove,
  }: {
    item: EditableOrderItem;
    onQuantityChange: (
      e: React.ChangeEvent<HTMLInputElement>,
      itemId: number
    ) => void;
    onPriceChange: (
      e: React.ChangeEvent<HTMLInputElement>,
      itemId: number
    ) => void;
    onRemove: (itemId: number) => void;
  }) => {
    const { openSheet } = useSheet();
    const product = item.catalog_transitions.item;
    const imageUrl = product.image_url
      ? supabase.storage.from("images").getPublicUrl(product.image_url).data
          .publicUrl
      : null;

    const totalPrice = item.quantity * item.unit_price;

    // Stable handlers that don't recreate on every render
    const handleQuantityChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        onQuantityChange(e, item.item_id);
      },
      [onQuantityChange, item.item_id]
    );

    const handlePriceChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        onPriceChange(e, item.item_id);
      },
      [onPriceChange, item.item_id]
    );

    const handleQuantityIncrement = useCallback(() => {
      const fakeEvent = {
        target: { value: (item.quantity + 1).toString() },
      } as React.ChangeEvent<HTMLInputElement>;
      onQuantityChange(fakeEvent, item.item_id);
    }, [onQuantityChange, item.item_id, item.quantity]);

    const handleQuantityDecrement = useCallback(() => {
      if (item.quantity > 1) {
        const fakeEvent = {
          target: {
            value: (item.quantity - 1).toString(),
          },
        } as React.ChangeEvent<HTMLInputElement>;
        onQuantityChange(fakeEvent, item.item_id);
      }
    }, [onQuantityChange, item.item_id, item.quantity]);

    const handleRemove = useCallback(() => {
      onRemove(item.item_id);
    }, [onRemove, item.item_id]);

    return (
      <div
        className={cn(
          "border border-border/50 rounded-lg p-4 bg-muted/20 hover:bg-muted/40 transition-colors group",
          item.isEdited &&
            "border-blue-500/50 bg-blue-50/50 dark:bg-blue-950/20"
        )}
      >
        <div className="flex gap-4">
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

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-sm truncate">
                    {product.name}
                  </h4>
                  {item.isEdited && (
                    <Badge
                      variant="secondary"
                      className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                    >
                      Modified
                    </Badge>
                  )}
                </div>
                {product.description && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {product.description}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">${totalPrice.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">
                  ${item.unit_price.toFixed(2)} each
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 w-7 p-0 bg-transparent"
                    onClick={handleQuantityDecrement}
                    disabled={item.quantity <= 1}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <Input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={handleQuantityChange}
                    className="w-16 h-7 text-center text-xs"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 w-7 p-0 bg-transparent"
                    onClick={handleQuantityIncrement}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <DollarSign className="h-3 w-3 text-muted-foreground" />
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={item.unit_price}
                    onChange={handlePriceChange}
                    className="w-20 h-7 text-xs"
                  />
                </div>
              </div>

              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                  onClick={handleRemove}
                  title="Remove item from order"
                >
                  <Trash2 className="h-3 w-3" />
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
  },
  // Custom comparison to prevent unnecessary re-renders
  (prevProps, nextProps) => {
    return (
      prevProps.item.item_id === nextProps.item.item_id &&
      prevProps.item.quantity === nextProps.item.quantity &&
      prevProps.item.unit_price === nextProps.item.unit_price &&
      prevProps.item.isEdited === nextProps.item.isEdited
    );
  }
);

OrderItemCard.displayName = "OrderItemCard";

const UpdateOrderSheet = (props: UpdateOrderSheetProps) => {
  const { id, ...sheetProps } = props;
  const IsMobile = useIsMobile();
  const { openSheet } = useSheet();
  const qc = useQueryClient();

  // Centralized state management for order items
  const [orderItems, setOrderItems] = useState<EditableOrderItem[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<number>(0);
  const [selectedCatalogId, setSelectedCatalogId] = useState<number>(0);
  const [isSaving, setIsSaving] = useState(false);

  // Search states
  const [clientSearch, setClientSearch] = useState("");
  const [catalogSearch, setCatalogSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [orderItemsSearch, setOrderItemsSearch] = useState("");
  const [clientOpen, setClientOpen] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [productOpen, setProductOpen] = useState(false);

  // Fetch order details with related data
  const { data: order, isLoading: orderLoading } = useQuery({
    queryKey: ["order", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("order")
        .select(
          `
          *,
          client (
            client_id,
            name,
            email,
            phone,
            whatsapp_phone
          ),
          catalog (
            catalog_id,
            name,
            status
          )
        `
        )
        .eq("order_id", id as any)
        .single();

      if (error) throw error;
      return data as Order;
    },
    enabled: !!id,
  });

  // Fetch order items through order_transactions
  const { data: originalOrderItems = [], isLoading: itemsLoading } = useQuery({
    queryKey: ["order-items", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("order_transactions")
        .select(
          `
          item_id,
          quantity,
          unit_price,
          catalog_transitions!order_transactions_item_id_fkey1 (
            catalog_transition_id,
            item:item_id (
              item_id,
              name,
              description,
              image_url,
              retail_price,
              stock_quantity,
              is_catalog_visible
            )
          )
        `
        )
        .eq("order_id", id as any);

      if (error) throw error;
      return data as OrderItem[];
    },
    enabled: !!id,
  });

  // Fetch clients for selection - only when needed
  const { data: clients = [], isLoading: clientsLoading } = useQuery({
    queryKey: ["clients-search", clientSearch],
    queryFn: async () => {
      let query = supabase
        .from("client")
        .select("client_id, name, email")
        .order("name");

      if (clientSearch.trim()) {
        query = query.or(
          `name.ilike.%${clientSearch}%,email.ilike.%${clientSearch}%`
        );
      }

      const { data, error } = await query.limit(50);
      if (error) throw error;
      return data as Client[];
    },
    enabled: clientOpen,
  });

  // Fetch catalogs for selection - only when needed
  const { data: catalogs = [], isLoading: catalogsLoading } = useQuery({
    queryKey: ["catalogs-search", catalogSearch],
    queryFn: async () => {
      let query = supabase
        .from("catalog")
        .select("catalog_id, name, status")
        .order("name");

      if (catalogSearch.trim()) {
        query = query.ilike("name", `%${catalogSearch}%`);
      }

      const { data, error } = await query.limit(50);
      if (error) throw error;
      return data as Catalog[];
    },
    enabled: catalogOpen,
  });

  // Fetch available products from selected catalog
  const { data: availableProducts = [], isLoading: productsLoading } = useQuery(
    {
      queryKey: [
        "catalog-products",
        selectedCatalogId,
        productSearch,
        orderItems.map((item) => item.item_id),
      ],
      queryFn: async () => {
        if (!selectedCatalogId) return [];

        const query = supabase
          .from("catalog_transitions")
          .select(
            `
          item:item_id (
            item_id,
            name,
            description,
            retail_price,
            stock_quantity,
            is_catalog_visible,
            image_url
          )
        `
          )
          .eq("catalog_id", selectedCatalogId);

        const { data, error } = await query;
        if (error) throw error;

        let products = (data || [])
          .map((transition) => transition.item)
          .filter(Boolean) as Product[];

        // Filter out products already in order
        const existingItemIds = new Set(orderItems.map((item) => item.item_id));
        products = products.filter(
          (product) => !existingItemIds.has(product.item_id)
        );

        // Apply search filter
        if (productSearch.trim()) {
          const searchLower = productSearch.toLowerCase();
          products = products.filter(
            (product) =>
              product.name.toLowerCase().includes(searchLower) ||
              product.description?.toLowerCase().includes(searchLower)
          );
        }

        return products;
      },
      enabled: productOpen && !!selectedCatalogId,
    }
  );

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      status: "Pending",
      shipping_address_line1: "",
      shipping_address_line2: "",
      shipping_city: "",
      shipping_state: "",
      shipping_zip: "",
      shipping_country: "",
      shipping_notes: "",
    },
  });

  // Initialize form and order items when data loads
  useEffect(() => {
    if (order) {
      form.reset({
        status: order.status as any,
        shipping_address_line1: order.shipping_address_line1 || "",
        shipping_address_line2: order.shipping_address_line2 || "",
        shipping_city: order.shipping_city || "",
        shipping_state: order.shipping_state || "",
        shipping_zip: order.shipping_zip?.toString() || "",
        shipping_country: order.shipping_country || "",
        shipping_notes: order.shipping_notes || "",
      });
      setSelectedClientId(order.client_id);
      setSelectedCatalogId(order.catalog_id);
    }
  }, [order, form]);

  useEffect(() => {
    if (originalOrderItems.length > 0) {
      const editableItems = originalOrderItems.map((item) => ({
        ...item,
        originalQuantity: item.quantity,
        originalUnitPrice: item.unit_price,
        isEdited: false,
      }));
      setOrderItems(editableItems);
    }
  }, [originalOrderItems]);

  // Calculate order summary - memoized to prevent recalculation
  const orderSummary = useMemo(() => {
    if (!orderItems.length) return null;

    const subtotal = orderItems.reduce(
      (sum, item) => sum + item.quantity * item.unit_price,
      0
    );
    const totalItems = orderItems.reduce((sum, item) => sum + item.quantity, 0);
    const uniqueProducts = orderItems.length;

    return {
      subtotal,
      totalItems,
      uniqueProducts,
      total: subtotal,
    };
  }, [orderItems]);

  // Filter order items based on search
  const filteredOrderItems = useMemo(() => {
    if (!orderItemsSearch.trim()) return orderItems;

    const searchLower = orderItemsSearch.toLowerCase();
    return orderItems.filter((item) => {
      const product = item.catalog_transitions.item;
      return (
        product.name.toLowerCase().includes(searchLower) ||
        product.description?.toLowerCase().includes(searchLower) ||
        product.item_id.toString().includes(searchLower)
      );
    });
  }, [orderItems, orderItemsSearch]);

  // Centralized handlers following the pattern you provided
  const handleQuantityChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>, itemId: number) => {
      const newQuantity = Number.parseInt(e.target.value) || 1;
      if (newQuantity < 1) return;

      setOrderItems((prevItems) =>
        prevItems.map((item) =>
          item.item_id === itemId
            ? {
                ...item,
                quantity: newQuantity,
                isEdited:
                  newQuantity !== item.originalQuantity ||
                  item.unit_price !== item.originalUnitPrice,
              }
            : item
        )
      );
    },
    []
  );

  const handlePriceChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>, itemId: number) => {
      const newPrice = Number.parseFloat(e.target.value) || 0;
      if (newPrice < 0) return;

      setOrderItems((prevItems) =>
        prevItems.map((item) =>
          item.item_id === itemId
            ? {
                ...item,
                unit_price: newPrice,
                isEdited:
                  item.quantity !== item.originalQuantity ||
                  newPrice !== item.originalUnitPrice,
              }
            : item
        )
      );
    },
    []
  );

  const handleRemoveItem = useCallback((itemId: number) => {
    setOrderItems((prevItems) =>
      prevItems.filter((item) => item.item_id !== itemId)
    );
  }, []);

  // Add product to order
  const addProductToOrder = useCallback((product: Product) => {
    const newOrderItem: EditableOrderItem = {
      item_id: product.item_id,
      quantity: 1,
      unit_price: product.retail_price,
      catalog_transition_id: 0,
      catalog_transitions: {
        catalog_transition_id: 0,
        item: product,
      },
      isEdited: true,
      originalQuantity: 0,
      originalUnitPrice: 0,
    };

    setOrderItems((prevItems) => [...prevItems, newOrderItem]);
    setProductOpen(false);
    setProductSearch("");
  }, []);

  const onSubmit = async (data: FormData) => {
    try {
      setIsSaving(true);

      const newTotalAmount = orderSummary?.total || 0;

      // Update order basic information
      const { error: orderError } = await supabase
        .from("order")
        .update({
          client_id: selectedClientId,
          catalog_id: selectedCatalogId,
          status: data.status,
          total_amount: newTotalAmount,
          shipping_address_line1: data.shipping_address_line1 || null,
          shipping_address_line2: data.shipping_address_line2 || null,
          shipping_city: data.shipping_city || null,
          shipping_state: data.shipping_state || null,
          shipping_zip: data.shipping_zip
            ? Number.parseInt(data.shipping_zip)
            : null,
          shipping_country: data.shipping_country || null,
          shipping_notes: data.shipping_notes || null,
          updated_at: new Date().toISOString(),
        })
        .eq("order_id", id as any);

      if (orderError) {
        throw orderError;
      }

      // Update order items
      const { error: deleteError } = await supabase
        .from("order_transactions")
        .delete()
        .eq("order_id", id as any);

      if (deleteError) {
        throw deleteError;
      }

      if (orderItems.length > 0) {
        const orderTransactions = await Promise.all(
          orderItems.map(async (item) => {
            let catalogTransitionId = item.catalog_transition_id;

            if (catalogTransitionId === 0) {
              const { data: transition } = await supabase
                .from("catalog_transitions")
                .select("catalog_transition_id")
                .eq("catalog_id", selectedCatalogId)
                .eq("item_id", item.item_id)
                .single();

              catalogTransitionId = transition?.catalog_transition_id || 0;
            }

            return {
              order_id: Number.parseInt(id),
              item_id: item.item_id,
              quantity: item.quantity,
              unit_price: item.unit_price,
            };
          })
        );

        const { error: insertError } = await supabase
          .from("order_transactions")
          .insert(orderTransactions);

        if (insertError) {
          throw insertError;
        }
      }

      toast.success("Order updated successfully!");
      props?.onOpenChange?.(false);

      qc.invalidateQueries({
        predicate: (query) =>
          (query.queryKey?.[0] as string)?.startsWith?.("order"),
      });
    } catch (err) {
      toast.error("Something went wrong", {
        description:
          // @ts-ignore
          err?.message || "Unknown error occurred",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const selectedClient =
    clients.find((client) => client.client_id === selectedClientId) ||
    order?.client;
  const selectedCatalog =
    catalogs.find((catalog) => catalog.catalog_id === selectedCatalogId) ||
    order?.catalog;
  const isLoading = orderLoading || itemsLoading;

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
                <p className="text-sm font-medium">Loading order details</p>
                <p className="text-xs text-muted-foreground">Please wait...</p>
              </div>
            </div>
          </div>
        )}

        <ScrollArea className="h-full">
          <div className="space-y-6 pb-6 mb-20">
            <SheetHeader className="flex flex-row justify-between items-center border-b select-none border-sidebar-border sticky top-0 bg-background/60 backdrop-blur-lg mb-4">
              <SheetTitle className="flex items-center gap-2">
                <span>Edit</span>
                <Badge variant={"secondary"} className="text-lg">
                  Order
                </Badge>
              </SheetTitle>
              <SheetClose asChild>
                <Button size={"icon"} variant={"ghost"}>
                  <X />
                </Button>
              </SheetClose>
            </SheetHeader>

            {order ? (
              <div className="space-y-6">
                <Form {...form}>
                  {/* Basic Information Card */}
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Info className="h-5 w-5 text-primary" />
                      Order Information
                    </CardTitle>
                  </CardHeader>

                  <div className="px-6 space-y-6">
                    <div className="grid grid-cols-4 gap-4 items-center">
                      <FormLabel className="text-right font-medium text-muted-foreground">
                        Order ID
                      </FormLabel>
                      <div className="col-span-3">
                        <div className="flex items-center gap-4 border-border/50 bg-muted/30 rounded-lg p-4 border">
                          <Hash className="h-5 w-5 text-primary" />
                          <span className="font-medium">{order.order_id}</span>
                        </div>
                      </div>
                    </div>

                    {/* Status */}
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem className="grid grid-cols-4 gap-4 items-center space-y-0">
                          <FormLabel className="text-right font-medium text-muted-foreground">
                            Order Status
                          </FormLabel>
                          <div className="space-y-2 col-span-3">
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select order status" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Pending">
                                  <div className="flex items-center gap-2">
                                    <statusConfig.Pending.icon />
                                    <span>Pending</span>
                                  </div>
                                </SelectItem>
                                <SelectItem value="Confirmed">
                                  <div className="flex items-center gap-2">
                                    <statusConfig.Confirmed.icon />
                                    <span>Confirmed</span>
                                  </div>
                                </SelectItem>
                                <SelectItem value="Shipped">
                                  <div className="flex items-center gap-2">
                                    <statusConfig.Shipped.icon />
                                    <span>Shipped</span>
                                  </div>
                                </SelectItem>
                                <SelectItem value="Delivered">
                                  <div className="flex items-center gap-2">
                                    <statusConfig.Delivered.icon />
                                    <span>Delivered</span>
                                  </div>
                                </SelectItem>
                                <SelectItem value="Cancelled">
                                  <div className="flex items-center gap-2">
                                    <statusConfig.Cancelled.icon />
                                    <span>Cancelled</span>
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

                  {/* Client Selection */}
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <User className="h-5 w-5 text-primary" />
                      Client Information
                    </CardTitle>
                  </CardHeader>

                  <div className="px-6 space-y-6">
                    <div className="grid grid-cols-4 gap-4 items-center">
                      <FormLabel className="text-right font-medium text-muted-foreground">
                        Select Client
                      </FormLabel>
                      <div className="col-span-3">
                        <Popover open={clientOpen} onOpenChange={setClientOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              className={cn(
                                "w-full justify-between",
                                !selectedClientId && "text-muted-foreground"
                              )}
                            >
                              {selectedClient ? (
                                <div className="flex items-center gap-2">
                                  <User className="h-4 w-4" />
                                  {selectedClient.name}
                                </div>
                              ) : (
                                "Select client"
                              )}
                              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-0" align="start">
                            <Command>
                              <CommandInput
                                placeholder="Search clients..."
                                value={clientSearch}
                                onValueChange={setClientSearch}
                              />
                              <CommandList>
                                <CommandEmpty>
                                  {clientsLoading ? (
                                    <div className="flex items-center justify-center py-4">
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                      <span className="ml-2">Loading...</span>
                                    </div>
                                  ) : (
                                    "No clients found."
                                  )}
                                </CommandEmpty>
                                <CommandGroup>
                                  {clients.map((client) => (
                                    <CommandItem
                                      key={client.client_id}
                                      value={client.name}
                                      onSelect={() => {
                                        setSelectedClientId(client.client_id);
                                        setClientOpen(false);
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          selectedClientId === client.client_id
                                            ? "opacity-100"
                                            : "opacity-0"
                                        )}
                                      />
                                      <div className="flex items-center gap-2">
                                        <User className="h-4 w-4" />
                                        <div>
                                          <p className="font-medium">
                                            {client.name}
                                          </p>
                                          <p className="text-xs text-muted-foreground">
                                            {client.email}
                                          </p>
                                        </div>
                                      </div>
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>

                    {selectedClient && (
                      <div className="grid grid-cols-4 gap-4 items-center">
                        <FormLabel className="text-right font-medium text-muted-foreground">
                          Client Details
                        </FormLabel>
                        <div className="col-span-3">
                          <div className="flex items-center justify-between bg-muted/30 rounded-lg p-4 border border-border/50">
                            <div>
                              <p className="font-medium">
                                {selectedClient.name}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {selectedClient.email}
                              </p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                openSheet("client:view", {
                                  id: selectedClient.client_id,
                                })
                              }
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              View
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Catalog Selection */}
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <BookOpen className="h-5 w-5 text-primary" />
                      Catalog Information
                    </CardTitle>
                  </CardHeader>

                  <div className="px-6 space-y-6">
                    <div className="grid grid-cols-4 gap-4 items-center">
                      <FormLabel className="text-right font-medium text-muted-foreground">
                        Select Catalog
                      </FormLabel>
                      <div className="col-span-3">
                        <Popover
                          open={catalogOpen}
                          onOpenChange={setCatalogOpen}
                        >
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              className={cn(
                                "w-full justify-between",
                                !selectedCatalogId && "text-muted-foreground"
                              )}
                            >
                              {selectedCatalog ? (
                                <div className="flex items-center gap-2">
                                  <BookOpen className="h-4 w-4" />
                                  {selectedCatalog.name}
                                </div>
                              ) : (
                                "Select catalog"
                              )}
                              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-0" align="start">
                            <Command>
                              <CommandInput
                                placeholder="Search catalogs..."
                                value={catalogSearch}
                                onValueChange={setCatalogSearch}
                              />
                              <CommandList>
                                <CommandEmpty>
                                  {catalogsLoading ? (
                                    <div className="flex items-center justify-center py-4">
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                      <span className="ml-2">Loading...</span>
                                    </div>
                                  ) : (
                                    "No catalogs found."
                                  )}
                                </CommandEmpty>
                                <CommandGroup>
                                  {catalogs.map((catalog) => (
                                    <CommandItem
                                      key={catalog.catalog_id}
                                      value={catalog.name}
                                      onSelect={() => {
                                        setSelectedCatalogId(
                                          catalog.catalog_id
                                        );
                                        setCatalogOpen(false);
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          selectedCatalogId ===
                                            catalog.catalog_id
                                            ? "opacity-100"
                                            : "opacity-0"
                                        )}
                                      />
                                      <div className="flex items-center gap-2">
                                        <BookOpen className="h-4 w-4" />
                                        <div>
                                          <p className="font-medium">
                                            {catalog.name}
                                          </p>
                                        </div>
                                      </div>
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>

                    {selectedCatalog && (
                      <div className="grid grid-cols-4 gap-4 items-center">
                        <FormLabel className="text-right font-medium text-muted-foreground">
                          Catalog Details
                        </FormLabel>
                        <div className="col-span-3">
                          <div className="flex items-center justify-between bg-muted/30 rounded-lg p-4 border border-border/50">
                            <div className="flex items-center gap-2">
                              <div>
                                <p className="font-medium">
                                  {selectedCatalog.name}
                                </p>
                                <Badge
                                  className={cn(
                                    "text-xs",
                                    selectedCatalog.status === "enabled"
                                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                      : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                  )}
                                >
                                  {selectedCatalog.status.toUpperCase()}
                                </Badge>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                openSheet("catalog:view", {
                                  id: selectedCatalog.catalog_id,
                                })
                              }
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              View
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Order Items */}
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Package className="h-5 w-5 text-primary" />
                      Order Items
                      <Badge variant="outline" className="ml-2">
                        {orderItemsSearch.trim()
                          ? `${filteredOrderItems.length}/${orderItems.length}`
                          : orderItems.length}
                      </Badge>
                    </CardTitle>
                  </CardHeader>

                  <div className="px-6 space-y-4">
                    {/* Add Product Button */}
                    <div className="flex justify-between items-center">
                      <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search order items..."
                          className="pl-10"
                          value={orderItemsSearch}
                          onChange={(e) => setOrderItemsSearch(e.target.value)}
                        />
                      </div>

                      <Popover open={productOpen} onOpenChange={setProductOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            size="sm"
                            disabled={!selectedCatalogId}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Product
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-0" align="end">
                          <Command>
                            <CommandInput
                              placeholder="Search products..."
                              value={productSearch}
                              onValueChange={setProductSearch}
                            />
                            <CommandList>
                              <CommandEmpty>
                                {productsLoading ? (
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
                                    onSelect={() => addProductToOrder(product)}
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

                    {/* Order Items List - Following the centralized state pattern */}
                    {filteredOrderItems.length > 0 ? (
                      <div className="space-y-3">
                        {filteredOrderItems.map((item) => (
                          <OrderItemCard
                            key={item.item_id}
                            item={item}
                            onQuantityChange={handleQuantityChange}
                            onPriceChange={handlePriceChange}
                            onRemove={handleRemoveItem}
                          />
                        ))}
                      </div>
                    ) : orderItems.length > 0 ? (
                      <div className="text-center py-8">
                        <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-sm font-medium mb-2">
                          No items match your search
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          Try adjusting your search terms or clear the search to
                          see all items.
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2 bg-transparent"
                          onClick={() => setOrderItemsSearch("")}
                        >
                          Clear Search
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-sm font-medium mb-2">
                          No items in order
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          This order doesn't have any items. Use the "Add
                          Product" button to add items.
                        </p>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Order Summary */}
                  {orderSummary && (
                    <>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <Receipt className="h-5 w-5 text-primary" />
                          Order Summary
                        </CardTitle>
                      </CardHeader>

                      <div className="px-6 space-y-4">
                        <div className="bg-muted/30 rounded-lg p-4 border border-border/50">
                          <div className="space-y-3">
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-muted-foreground">
                                Total Items:
                              </span>
                              <span className="font-medium">
                                {orderSummary.totalItems} items
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-muted-foreground">
                                Unique Products:
                              </span>
                              <span className="font-medium">
                                {orderSummary.uniqueProducts} products
                              </span>
                            </div>
                            <Separator className="my-2" />
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-muted-foreground">
                                Subtotal:
                              </span>
                              <span className="font-medium">
                                ${orderSummary.subtotal.toFixed(2)}
                              </span>
                            </div>
                            <Separator className="my-2" />
                            <div className="flex justify-between items-center text-base font-semibold">
                              <span>Total Amount:</span>
                              <span className="text-primary">
                                ${orderSummary.total.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <Separator />
                    </>
                  )}

                  {/* Shipping Information */}
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Truck className="h-5 w-5 text-primary" />
                      Shipping Information
                    </CardTitle>
                  </CardHeader>

                  <div className="px-6 space-y-6">
                    {/* Address Line 1 */}
                    <FormField
                      control={form.control}
                      name="shipping_address_line1"
                      render={({ field }) => (
                        <FormItem className="grid grid-cols-4 gap-4 items-center space-y-0">
                          <FormLabel className="text-right font-medium text-muted-foreground">
                            Address Line 1
                          </FormLabel>
                          <div className="space-y-2 col-span-3">
                            <FormControl>
                              <Input
                                placeholder="Enter address line 1"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />

                    {/* Address Line 2 */}
                    <FormField
                      control={form.control}
                      name="shipping_address_line2"
                      render={({ field }) => (
                        <FormItem className="grid grid-cols-4 gap-4 items-center space-y-0">
                          <FormLabel className="text-right font-medium text-muted-foreground">
                            Address Line 2
                          </FormLabel>
                          <div className="space-y-2 col-span-3">
                            <FormControl>
                              <Input
                                placeholder="Enter address line 2"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />

                    {/* City */}
                    <FormField
                      control={form.control}
                      name="shipping_city"
                      render={({ field }) => (
                        <FormItem className="grid grid-cols-4 gap-4 items-center space-y-0">
                          <FormLabel className="text-right font-medium text-muted-foreground">
                            City
                          </FormLabel>
                          <div className="space-y-2 col-span-3">
                            <FormControl>
                              <Input placeholder="Enter city" {...field} />
                            </FormControl>
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />

                    {/* State */}
                    <FormField
                      control={form.control}
                      name="shipping_state"
                      render={({ field }) => (
                        <FormItem className="grid grid-cols-4 gap-4 items-center space-y-0">
                          <FormLabel className="text-right font-medium text-muted-foreground">
                            State
                          </FormLabel>
                          <div className="space-y-2 col-span-3">
                            <FormControl>
                              <Input placeholder="Enter state" {...field} />
                            </FormControl>
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />

                    {/* ZIP Code */}
                    <FormField
                      control={form.control}
                      name="shipping_zip"
                      render={({ field }) => (
                        <FormItem className="grid grid-cols-4 gap-4 items-center space-y-0">
                          <FormLabel className="text-right font-medium text-muted-foreground">
                            ZIP Code
                          </FormLabel>
                          <div className="space-y-2 col-span-3">
                            <FormControl>
                              <Input placeholder="Enter ZIP code" {...field} />
                            </FormControl>
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />

                    {/* Country */}
                    <FormField
                      control={form.control}
                      name="shipping_country"
                      render={({ field }) => (
                        <FormItem className="grid grid-cols-4 gap-4 items-center space-y-0">
                          <FormLabel className="text-right font-medium text-muted-foreground">
                            Country
                          </FormLabel>
                          <div className="space-y-2 col-span-3">
                            <FormControl>
                              <Input placeholder="Enter country" {...field} />
                            </FormControl>
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />

                    {/* Shipping Notes */}
                    <FormField
                      control={form.control}
                      name="shipping_notes"
                      render={({ field }) => (
                        <FormItem className="grid grid-cols-4 gap-4 items-center space-y-0">
                          <FormLabel className="text-right font-medium text-muted-foreground">
                            Shipping Notes
                          </FormLabel>
                          <div className="space-y-2 col-span-3">
                            <FormControl>
                              <Textarea
                                placeholder="Enter shipping notes"
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
                </Form>
              </div>
            ) : (
              // Error State / Not Found
              <div className="flex flex-col items-center justify-center h-96 text-center px-4">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <ShoppingCart className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Order not found</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  The order you're looking for doesn't exist or may have been
                  deleted. Please check the order ID and try again.
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

          {order && (
            <div className="flex justify-end gap-4 p-4 border-t absolute bottom-0 right-0 left-0 mt-auto bg-background/60 backdrop-blur-lg">
              <SheetClose asChild>
                <Button type="button" variant="outline" disabled={isSaving}>
                  Cancel
                </Button>
              </SheetClose>
              <Button
                type="button"
                disabled={isSaving || isLoading || !order}
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
                    <Edit className="h-4 w-4 mr-2" />
                    Update Order
                  </>
                )}
              </Button>
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export default UpdateOrderSheet;
