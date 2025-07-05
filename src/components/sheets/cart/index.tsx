"use client";

import React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { useCart } from "@/context/cart";
import { supabase } from "@/supabase";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  CreditCard,
  Mail,
  Minus,
  Package,
  Phone,
  Plus,
  ShoppingCart,
  Trash2,
  X,
  User,
  Truck,
  Loader2,
  MapPin,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Database } from "@/interface/database.types";
import { getImageUrl } from "@/lib/GetImageUrl";

const formSchema = z.object({
  shipping_option: z.enum(["default", "custom"], {
    required_error: "Please select a shipping option",
  }),
  shipping_address_line1: z.string().optional(),
  shipping_address_line2: z.string().optional(),
  shipping_city: z.string().optional(),
  shipping_state: z.string().optional(),
  shipping_zip: z.string().optional(),
  shipping_country: z.string().optional(),
  shipping_notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface Client {
  client_id: number;
  name: string;
  email: string;
  phone?: string;
  whatsapp_phone?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  zip?: number;
  country?: string;
}

interface CartSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client | null;
  recipientId: string | null;
  catalogInfo: Database["public"]["Tables"]["catalog"]["Row"] | null;
}

export function CartSheet({
  open,
  onOpenChange,
  client,
  catalogInfo,
}: CartSheetProps) {
  const {
    items,
    totalItems,
    totalPrice,
    updateQuantity,
    removeItem,
    clearCart,
  } = useCart();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      shipping_option: "default",
      shipping_address_line1: "",
      shipping_address_line2: "",
      shipping_city: "",
      shipping_state: "",
      shipping_zip: "",
      shipping_country: "",
      shipping_notes: "",
    },
  });

  const watchShippingOption = form.watch("shipping_option");

  // Pre-fill form when client data is available
  React.useEffect(() => {
    if (client?.address_line1) {
      form.setValue("shipping_address_line1", client.address_line1 || "");
      form.setValue("shipping_address_line2", client.address_line2 || "");
      form.setValue("shipping_city", client.city || "");
      form.setValue("shipping_state", client.state || "");
      form.setValue("shipping_zip", client.zip?.toString() || "");
      form.setValue("shipping_country", client.country || "");
    }
  }, [client, form]);

  const handleQuantityChange = (itemId: number, newQuantity: number) => {
    if (newQuantity < 1) {
      removeItem(itemId);
    } else {
      updateQuantity(itemId, newQuantity);
    }
  };

  const onSubmit = async (data: FormData) => {
    if (!client) {
      toast.error("Client information not found");
      return;
    }

    if (items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    setIsSubmitting(true);

    try {
      // Create order with client information
      const orderData = {
        client_id: client.client_id,
        catalog_id: catalogInfo?.catalog_id, // You might need to determine this based on your business logic
        status: "Pending" as const,
        total_amount: totalPrice,
        ...(data.shipping_option === "custom" && {
          shipping_address_line1: data.shipping_address_line1 || null,
          shipping_address_line2: data.shipping_address_line2 || null,
          shipping_city: data.shipping_city || null,
          shipping_state: data.shipping_state || null,
          shipping_zip: data.shipping_zip
            ? Number.parseInt(data.shipping_zip)
            : null,
          shipping_country: data.shipping_country || null,
          shipping_notes: data.shipping_notes || null,
        }),
        ...(data.shipping_option === "default" &&
          client.address_line1 && {
            shipping_address_line1: client.address_line1,
            shipping_address_line2: client.address_line2,
            shipping_city: client.city,
            shipping_state: client.state,
            shipping_zip: client.zip,
            shipping_country: client.country,
          }),
      };

      const { data: newOrder, error: orderError } = await supabase
        .from("order")
        .insert(orderData as any)
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderTransactions = items.map((item) => ({
        order_id: newOrder.order_id,
        item_id: item.item_id,
        quantity: item.quantity,
        unit_price: item.retail_price,
      }));

      const { error: transactionError } = await supabase
        .from("order_transactions")
        .insert(orderTransactions);

      if (transactionError) throw transactionError;

      toast.success("Order submitted successfully!", {
        description: "We'll contact you shortly to confirm your order.",
      });

      clearCart();
      onOpenChange(false);
    } catch (error) {
      console.error("Order submission error:", error);
      toast.error("Failed to submit order", {
        description: "Please try again or contact us directly.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col [&>button:first-of-type]:hidden">
        <ScrollArea className="h-full">
          <div className="space-y-6 pb-6 mb-20">
            <SheetHeader className="flex flex-row justify-between items-center border-b select-none border-sidebar-border sticky top-0 bg-background/60 backdrop-blur-lg mb-4">
              <SheetTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                <span>Shopping</span>
                <Badge variant="secondary" className="text-lg">
                  Cart
                </Badge>
                {totalItems > 0 && (
                  <Badge variant="outline" className="ml-2">
                    {totalItems} {totalItems === 1 ? "item" : "items"}
                  </Badge>
                )}
              </SheetTitle>
              <SheetClose asChild>
                <Button size="icon" variant="ghost">
                  <X className="h-4 w-4" />
                </Button>
              </SheetClose>
            </SheetHeader>

            {items.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
                <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
                  <ShoppingCart className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  Your cart is empty
                </h3>
                <p className="text-muted-foreground mb-6 max-w-sm">
                  Browse our catalog and add some amazing products to your cart.
                </p>
                <SheetClose asChild>
                  <Button>Continue Shopping</Button>
                </SheetClose>
              </div>
            ) : (
              <>
                {/* Client Information */}
                {client && (
                  <>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <User className="h-5 w-5 text-primary" />
                        Customer Information
                      </CardTitle>
                    </CardHeader>

                    <div className="px-6">
                      <div className="bg-muted/30 rounded-lg p-4 border border-border/50">
                        <div className="space-y-2">
                          <p className="font-medium">{client.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {client.email}
                          </p>
                          {client.phone && (
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="h-4 w-4 text-muted-foreground" />
                              <span>{client.phone}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <Separator />
                  </>
                )}

                {/* Cart Items */}
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Package className="h-5 w-5 text-primary" />
                    Order Items
                    <Badge variant="outline" className="ml-2">
                      {items.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>

                <div className="px-6">
                  <div className="space-y-4">
                    {items.map((item) => (
                      <div
                        key={item.item_id}
                        className="border border-border/50 rounded-lg p-4 bg-muted/20 hover:bg-muted/40 transition-colors group"
                      >
                        <div className="flex gap-4">
                          {/* Product Image */}
                          <div className="flex-shrink-0">
                            {item.image_url ? (
                              <img
                                src={
                                  getImageUrl(item.image_url) ||
                                  "/placeholder.svg"
                                }
                                alt={item.name}
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
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-sm truncate">
                                  {item.name}
                                </h4>
                                {item.category_name && (
                                  <Badge
                                    variant="outline"
                                    className="text-xs mt-1"
                                  >
                                    {item.category_name}
                                  </Badge>
                                )}
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                                onClick={() => removeItem(item.item_id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>

                            {/* Price and Quantity Controls */}
                            <div className="flex items-center justify-between">
                              <div className="text-sm font-medium">
                                ${item.retail_price.toFixed(2)}
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 w-7 p-0 bg-transparent"
                                  onClick={() =>
                                    handleQuantityChange(
                                      item.item_id,
                                      item.quantity - 1
                                    )
                                  }
                                  disabled={item.quantity <= 1}
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <Input
                                  type="number"
                                  min="1"
                                  value={item.quantity}
                                  onChange={(e) => {
                                    const newQuantity =
                                      Number.parseInt(e.target.value) || 1;
                                    handleQuantityChange(
                                      item.item_id,
                                      newQuantity
                                    );
                                  }}
                                  className="w-16 h-7 text-center text-xs"
                                />
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 w-7 p-0 bg-transparent"
                                  onClick={() =>
                                    handleQuantityChange(
                                      item.item_id,
                                      item.quantity + 1
                                    )
                                  }
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>

                            {/* Item Total */}
                            <div className="flex justify-between items-center mt-2 pt-2 border-t border-border/50">
                              <span className="text-xs text-muted-foreground">
                                {item.quantity} × $
                                {item.retail_price.toFixed(2)}
                              </span>
                              <span className="font-semibold">
                                $
                                {(item.quantity * item.retail_price).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Clear Cart Button */}
                  <div className="flex justify-between items-center mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearCart}
                      className="text-red-500 hover:text-red-700 bg-transparent"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear Cart
                    </Button>
                    <div className="text-sm text-muted-foreground">
                      {totalItems} {totalItems === 1 ? "item" : "items"}
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Order Summary */}
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <CreditCard className="h-5 w-5 text-primary" />
                    Order Summary
                  </CardTitle>
                </CardHeader>

                <div className="px-6">
                  <div className="bg-muted/30 rounded-lg p-4 border border-border/50">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">
                          Total Items:
                        </span>
                        <span className="font-medium">{totalItems} items</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">
                          Unique Products:
                        </span>
                        <span className="font-medium">
                          {items.length} products
                        </span>
                      </div>
                      <Separator className="my-2" />
                      <div className="flex justify-between items-center text-base font-semibold">
                        <span>Total Amount:</span>
                        <span className="text-primary">
                          ${totalPrice.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Shipping Information Form */}
                <Form {...form}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Truck className="h-5 w-5 text-primary" />
                      Shipping Information
                    </CardTitle>
                  </CardHeader>

                  <div className="px-6 space-y-6">
                    {/* Shipping Option Selection */}
                    <FormField
                      control={form.control}
                      name="shipping_option"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel className="text-base font-medium">
                            Shipping Address
                          </FormLabel>
                          <FormControl>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select shipping option" />
                              </SelectTrigger>
                              <SelectContent>
                                {client?.address_line1 && (
                                  <SelectItem value="default">
                                    <div className="flex items-center gap-2">
                                      <MapPin className="h-4 w-4" />
                                      <span>Use Default Address</span>
                                    </div>
                                  </SelectItem>
                                )}
                                <SelectItem value="custom">
                                  <div className="flex items-center gap-2">
                                    <Truck className="h-4 w-4" />
                                    <span>Enter Custom Address</span>
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Default Address Display */}
                    {watchShippingOption === "default" &&
                      client?.address_line1 && (
                        <div className="bg-muted/30 rounded-lg p-4 border border-border/50">
                          <h4 className="font-medium text-sm mb-2">
                            Default Shipping Address:
                          </h4>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <p>{client.address_line1}</p>
                            {client.address_line2 && (
                              <p>{client.address_line2}</p>
                            )}
                            <p>
                              {client.city && `${client.city}, `}
                              {client.state && `${client.state} `}
                              {client.zip}
                            </p>
                            {client.country && <p>{client.country}</p>}
                          </div>
                        </div>
                      )}

                    {/* Custom Address Fields */}
                    {watchShippingOption === "custom" && (
                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="shipping_address_line1"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Address Line 1</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Enter address line 1"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="shipping_address_line2"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Address Line 2</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Enter address line 2"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="shipping_city"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>City</FormLabel>
                                <FormControl>
                                  <Input placeholder="Enter city" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="shipping_state"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>State</FormLabel>
                                <FormControl>
                                  <Input placeholder="Enter state" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="shipping_zip"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>ZIP Code</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Enter ZIP code"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="shipping_country"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Country</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Enter country"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name="shipping_notes"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Shipping Notes</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Enter shipping notes"
                                  rows={3}
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}
                  </div>
                </Form>

                {/* <Separator /> */}

                {/* Contact Information */}
                {/* <div className="px-6">
                  <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                    <h4 className="font-medium text-sm">
                      Contact us to complete your order:
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>804-800-7692</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>804-800-ROZA</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>support@rozawholesale.com</span>
                      </div>
                    </div>
                  </div>
                </div> */}
              </>
            )}
          </div>

          {/* Submit Button - Fixed at bottom */}
          {items.length > 0 && (
            <div className="flex justify-end gap-4 p-4 border-t absolute bottom-0 right-0 left-0 mt-auto bg-background/60 backdrop-blur-lg">
              <SheetClose asChild>
                <Button type="button" variant="outline" disabled={isSubmitting}>
                  Cancel
                </Button>
              </SheetClose>
              <Button
                type="button"
                disabled={isSubmitting || !client || items.length === 0}
                onClick={() => {
                  form.handleSubmit(onSubmit)();
                }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Submitting Order...
                  </>
                ) : (
                  <>
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Submit Order
                  </>
                )}
              </Button>
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
