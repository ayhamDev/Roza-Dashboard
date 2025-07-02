"use client";

import React from "react";

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
import { cn } from "@/lib/utils";
import { supabase } from "@/supabase";
import type { DialogProps } from "@radix-ui/react-dialog";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  BookOpen,
  Calendar,
  Clock,
  DollarSign,
  Edit,
  ExternalLink,
  Eye,
  Hash,
  Info,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  Package,
  Phone,
  Receipt,
  ShoppingCart,
  Truck,
  User,
  X,
} from "lucide-react";

interface ViewOrderSheetProps
  extends React.ComponentProps<React.FC<DialogProps>> {
  id: string;
}

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

const ViewOrderSheet = (props: ViewOrderSheetProps) => {
  const { id, ...sheetProps } = props;
  const IsMobile = useIsMobile();
  const { openSheet } = useSheet();

  // Fetch order details with related data
  const { data: order, isLoading } = useQuery({
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
  });

  // Fetch order items through order_transactions
  const { data: orderItems = [], isLoading: itemsLoading } = useQuery({
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

  // Calculate order summary
  const orderSummary = React.useMemo(() => {
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
      total: order?.total_amount || subtotal,
    };
  }, [orderItems, order?.total_amount]);

  // Status Badge Component
  const StatusBadge = ({ status }: { status: string }) => {
    const getStatusColor = (status: string) => {
      switch (status.toLowerCase()) {
        case "pending":
          return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
        case "confirmed":
          return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
        case "shipped":
          return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
        case "delivered":
          return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
        case "cancelled":
          return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
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
            Order Status
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

  // Contact method component for better visual representation
  const ContactMethod = ({
    icon: Icon,
    label,
    value,
  }: {
    icon: any;
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

  // Order Item Card Component
  const OrderItemCard = ({ item }: { item: OrderItem }) => {
    const product = item.catalog_transitions.item;
    const imageUrl = product.image_url
      ? supabase.storage.from("images").getPublicUrl(product.image_url).data
          .publicUrl
      : null;

    const totalPrice = item.quantity * item.unit_price;

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
              <div className="text-right">
                <p className="text-sm font-medium">${totalPrice.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">
                  ${item.unit_price.toFixed(2)} each
                </p>
              </div>
            </div>

            {/* Quantity and Actions */}
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1">
                  <ShoppingCart className="h-3 w-3 text-muted-foreground" />
                  <span className="font-medium">Qty: {item.quantity}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Package className="h-3 w-3 text-muted-foreground" />
                  <span>{product.stock_quantity} in stock</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-1">
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
                <Badge variant={"secondary"} className="text-lg">
                  Order
                </Badge>
                <span>Details</span>
              </SheetTitle>
              <SheetClose asChild>
                <Button size={"icon"} variant={"ghost"}>
                  <X />
                </Button>
              </SheetClose>
            </SheetHeader>

            {order ? (
              <div className="space-y-6">
                {/* Basic Information Card */}
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Info className="h-5 w-5 text-primary" />
                    Order Information
                  </CardTitle>
                </CardHeader>

                <div className="px-6">
                  <div className="grid gap-4">
                    <ContactMethod
                      icon={Hash}
                      label="Order ID"
                      value={order.order_id as any}
                    />
                    <ContactMethod
                      icon={DollarSign}
                      label="Total Amount"
                      value={`$${order.total_amount.toFixed(2)}`}
                    />
                    <StatusBadge status={order.status} />
                  </div>
                </div>

                <Separator />

                {/* Client Information */}
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-lg">
                      <User className="h-5 w-5 text-primary" />
                      Client Information
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        openSheet("client:view", { id: order.client.client_id })
                      }
                      className="bg-transparent"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Client
                    </Button>
                  </CardTitle>
                </CardHeader>

                <div className="px-6 space-y-4">
                  <ContactMethod
                    icon={User}
                    label="Client Name"
                    value={order.client.name}
                  />
                  <ContactMethod
                    icon={Mail}
                    label="Client Email"
                    value={order.client.email}
                  />
                  {order.client.phone && (
                    <ContactMethod
                      icon={Phone}
                      label="Phone"
                      value={order.client.phone}
                    />
                  )}
                  {order.client.whatsapp_phone && (
                    <ContactMethod
                      icon={MessageCircle}
                      label="WhatsApp"
                      value={order.client.whatsapp_phone}
                    />
                  )}
                </div>

                <Separator />

                {/* Catalog Information */}
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-lg">
                      <BookOpen className="h-5 w-5 text-primary" />
                      Catalog Information
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        openSheet("catalog:view", {
                          id: order.catalog.catalog_id,
                        })
                      }
                      className="bg-transparent"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Catalog
                    </Button>
                  </CardTitle>
                </CardHeader>

                <div className="px-6 space-y-4">
                  <ContactMethod
                    icon={BookOpen}
                    label="Catalog Name"
                    value={order.catalog.name}
                  />
                  <div className="flex items-center gap-4 border-border/50 bg-muted/30 rounded-lg p-4 border group">
                    <div className="flex-shrink-0">
                      <Activity className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col gap-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Catalog Status
                      </p>
                      <Badge
                        className={cn(
                          "w-fit text-xs",
                          order.catalog.status === "enabled"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                        )}
                      >
                        {order.catalog.status.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Order Items */}
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Package className="h-5 w-5 text-primary" />
                    Order Items
                    <Badge variant="outline" className="ml-2">
                      {orderItems.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>

                <div className="px-6 space-y-4">
                  {itemsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm text-muted-foreground">
                          Loading order items...
                        </span>
                      </div>
                    </div>
                  ) : orderItems.length > 0 ? (
                    <div className="space-y-3">
                      {orderItems.map((item, index) => (
                        <OrderItemCard
                          key={`${item.catalog_transitions.catalog_transition_id}-${index}`}
                          item={item}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-sm font-medium mb-2">
                        No items found
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        This order doesn't have any items.
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
                          {/* Order Details */}
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
                          {/* Add space for potential taxes, shipping, discounts */}
                          {orderSummary.total !== orderSummary.subtotal && (
                            <>
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">
                                  Adjustments:
                                </span>
                                <span className="font-medium">
                                  $
                                  {(
                                    orderSummary.total - orderSummary.subtotal
                                  ).toFixed(2)}
                                </span>
                              </div>
                            </>
                          )}
                          <Separator className="my-2" />
                          <div className="flex justify-between items-center text-base font-semibold">
                            <span>Total Amount:</span>
                            <span className="text-primary">
                              ${orderSummary.total.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Order Statistics */}
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center p-3 bg-muted/20 rounded-lg border border-border/50">
                          <div className="text-lg font-semibold text-primary">
                            {orderSummary.totalItems}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Total Items
                          </div>
                        </div>
                        <div className="text-center p-3 bg-muted/20 rounded-lg border border-border/50">
                          <div className="text-lg font-semibold text-primary">
                            {orderSummary.uniqueProducts}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Products
                          </div>
                        </div>
                        <div className="text-center p-3 bg-muted/20 rounded-lg border border-border/50">
                          <div className="text-lg font-semibold text-primary">
                            $
                            {(
                              orderSummary.total / orderSummary.totalItems
                            ).toFixed(2)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Avg/Item
                          </div>
                        </div>
                      </div>
                    </div>

                    <Separator />
                  </>
                )}

                {/* Shipping Information */}
                {(order.shipping_address_line1 ||
                  order.shipping_city ||
                  order.shipping_state ||
                  order.shipping_country ||
                  order.shipping_notes) && (
                  <>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Truck className="h-5 w-5 text-primary" />
                        Shipping Information
                      </CardTitle>
                    </CardHeader>

                    <div className="px-6 space-y-4">
                      {order.shipping_address_line1 && (
                        <ContactMethod
                          icon={MapPin}
                          label="Address Line 1"
                          value={order.shipping_address_line1}
                        />
                      )}
                      {order.shipping_address_line2 && (
                        <ContactMethod
                          icon={MapPin}
                          label="Address Line 2"
                          value={order.shipping_address_line2}
                        />
                      )}
                      {order.shipping_city && (
                        <ContactMethod
                          icon={MapPin}
                          label="City"
                          value={order.shipping_city}
                        />
                      )}
                      {order.shipping_state && (
                        <ContactMethod
                          icon={MapPin}
                          label="State"
                          value={order.shipping_state}
                        />
                      )}
                      {order.shipping_zip && (
                        <ContactMethod
                          icon={MapPin}
                          label="ZIP Code"
                          value={order.shipping_zip.toString()}
                        />
                      )}
                      {order.shipping_country && (
                        <ContactMethod
                          icon={MapPin}
                          label="Country"
                          value={order.shipping_country}
                        />
                      )}
                      {order.shipping_notes && (
                        <div className="bg-muted/30 rounded-lg p-4 border border-border/50">
                          <div className="flex items-center gap-2 mb-2">
                            <Truck className="h-4 w-4 text-muted-foreground" />
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                              Shipping Notes
                            </label>
                          </div>
                          <p className="text-sm leading-relaxed">
                            {order.shipping_notes}
                          </p>
                        </div>
                      )}
                    </div>

                    <Separator />
                  </>
                )}

                {/* Timeline Section */}
                {(order.created_at || order.updated_at) && (
                  <>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Clock className="h-5 w-5 text-primary" />
                        Timeline
                      </CardTitle>
                    </CardHeader>

                    <div className="space-y-4 px-6">
                      {order.created_at && (
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                              Order Placed
                            </p>
                            <p className="text-sm font-medium flex gap-2">
                              {getFormattedDateMeta(order.created_at).full}
                              <span className="text-muted-foreground text-sm">
                                (
                                {
                                  getFormattedDateMeta(order.created_at)
                                    .relative
                                }
                                )
                              </span>
                            </p>
                          </div>
                        </div>
                      )}
                      {order.updated_at && (
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                              Last Updated
                            </p>
                            <p className="text-sm font-medium flex gap-2">
                              {getFormattedDateMeta(order.updated_at).full}
                              <span className="text-muted-foreground text-sm">
                                (
                                {
                                  getFormattedDateMeta(order.updated_at)
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
              <Button
                type="button"
                className="cursor-pointer"
                size={"lg"}
                onClick={() => {
                  openSheet("order:update", { id: order.order_id });
                }}
              >
                <Edit />
                Edit Order
              </Button>
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export default ViewOrderSheet;
