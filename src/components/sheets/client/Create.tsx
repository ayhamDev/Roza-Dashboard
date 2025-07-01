import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import CountrySelect from "@/components/ui/country-select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
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
import { useIsMobile } from "@/hooks/use-mobile";
import type { Database } from "@/interface/database.types";
import { cn } from "@/lib/utils";
import { supabase } from "@/supabase";
import { zodResolver } from "@hookform/resolvers/zod";
import type { DialogProps } from "@radix-ui/react-dialog";
import { useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Please enter a valid email address"),
  phone: z
    .string()
    .min(1, "Phone is required")
    .max(20, "Phone must be 20 characters or less"),
  whatsapp_phone: z
    .string()
    .min(1, "WhatsApp phone is required")
    .max(20, "WhatsApp phone must be 20 characters or less"),
  address_line1: z.string().min(1, "Address Line 1 is required"),
  address_line2: z.string().min(1, "Address Line 2 is required"),
  city: z
    .string()
    .min(1, "City is required")
    .max(100, "City must be 100 characters or less"),
  state: z
    .string()
    .min(1, "State is required")
    .max(100, "State must be 100 characters or less"),
  zip: z
    .string()
    .min(1, "ZIP code is required")
    .refine((val) => !isNaN(Number(val)), {
      message: "ZIP must be a number",
    }),
  country: z
    .string()
    .min(1, "Country is required")
    .max(100, "Country must be 100 characters or less"),
});

type FormData = z.infer<typeof formSchema>;

const CreateClientSheet = (
  props: React.ComponentProps<React.FC<DialogProps>>
) => {
  const IsMobile = useIsMobile();
  const qc = useQueryClient();
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      whatsapp_phone: "",
      address_line1: "",
      address_line2: "",
      city: "",
      state: "",
      zip: "",
      country: "",
    },
  });
  const onSubmit = async (data: FormData) => {
    try {
      const { error } = await supabase.from("client").insert({
        name: data.name,
        email: data.email,
        phone: data.phone,
        whatsapp_phone: data.whatsapp_phone,
        address_line1: data.address_line1,
        address_line2: data.address_line2,
        city: data.city,
        state: data.state,
        zip: Number(data.zip),
        country: data.country,
      });

      if (error) {
        toast.error("Failed to create client", {
          description: error.message,
        });
      } else {
        props?.onOpenChange?.(false);
        toast.success("Client created successfully!");
        qc.invalidateQueries({
          predicate: (query) =>
            (query.queryKey?.[0] as string)?.startsWith?.("client"),
        });
        // optionally reset form or close sheet here
      }
    } catch (err) {
      toast.error("Something went wrong", {
        description:
          err instanceof Error ? err.message : "Unknown error occurred",
      });
    }
  };

  return (
    <Sheet {...props}>
      <SheetContent
        className={cn(
          "min-w-[600px] [&>button:first-of-type]:hidden",
          IsMobile && "min-w-auto w-full"
        )}
      >
        <ScrollArea className="max-h-full">
          <SheetHeader className="flex flex-row justify-between items-center border-b select-none border-sidebar-border sticky top-0 bg-background/60 backdrop-blur-lg mb-4">
            <SheetTitle className="flex items-center gap-2">
              <span>Create New</span>
              <Badge variant={"secondary"} className="text-lg">
                Client
              </Badge>
            </SheetTitle>
            <SheetClose asChild>
              <Button size={"icon"} variant={"ghost"}>
                <X />
              </Button>
            </SheetClose>
          </SheetHeader>

          <div className=" pb-20">
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
                          Name
                        </FormLabel>
                        <div className="space-y-2 col-span-2">
                          <FormControl>
                            <Input placeholder="Enter client name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />

                  {/* Email */}
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem className="grid grid-cols-3 gap-4 items-start space-y-0">
                        <FormLabel className="text-right col-span-1 font-medium text-muted-foreground">
                          Email
                        </FormLabel>
                        <div className="space-y-2 col-span-2">
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="Enter email address"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />

                  {/* Phone */}
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem className="grid grid-cols-3 gap-4 items-start space-y-0">
                        <FormLabel className="text-right col-span-1 font-medium text-muted-foreground">
                          Phone
                        </FormLabel>
                        <div className="space-y-2 col-span-2">
                          <FormControl>
                            <PhoneInput
                              type="tel"
                              defaultCountry="US"
                              placeholder="Enter phone number"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />

                  {/* WhatsApp Phone */}
                  <FormField
                    control={form.control}
                    name="whatsapp_phone"
                    render={({ field }) => (
                      <FormItem className="grid grid-cols-3 gap-4 items-start space-y-0">
                        <FormLabel className="text-right col-span-1 font-medium text-muted-foreground">
                          WhatsApp Phone
                        </FormLabel>
                        <div className="space-y-2 col-span-2">
                          <FormControl>
                            <PhoneInput
                              defaultCountry="US"
                              type="tel"
                              placeholder="Enter WhatsApp number"
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

                {/* Address Information Section */}
                <div className="space-y-10 px-6">
                  <h3 className="text-lg font-semibold">Address Information</h3>

                  {/* Address Line 1 */}
                  <FormField
                    control={form.control}
                    name="address_line1"
                    render={({ field }) => (
                      <FormItem className="grid grid-cols-3 gap-4 items-start space-y-0">
                        <FormLabel className="text-right col-span-1 font-medium text-muted-foreground">
                          Address Line 1
                        </FormLabel>
                        <div className="space-y-2 col-span-2">
                          <FormControl>
                            <Textarea
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
                    name="address_line2"
                    render={({ field }) => (
                      <FormItem className="grid grid-cols-3 gap-4 items-start space-y-0">
                        <FormLabel className="text-right col-span-1 font-medium text-muted-foreground">
                          Address Line 2
                        </FormLabel>
                        <div className="space-y-2 col-span-2">
                          <FormControl>
                            <Textarea
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
                    name="city"
                    render={({ field }) => (
                      <FormItem className="grid grid-cols-3 gap-4 items-start space-y-0">
                        <FormLabel className="text-right col-span-1 font-medium text-muted-foreground">
                          City
                        </FormLabel>
                        <div className="space-y-2 col-span-2">
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
                    name="state"
                    render={({ field }) => (
                      <FormItem className="grid grid-cols-3 gap-4 items-start space-y-0">
                        <FormLabel className="text-right col-span-1 font-medium text-muted-foreground">
                          State
                        </FormLabel>
                        <div className="space-y-2 col-span-2">
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
                    name="zip"
                    render={({ field }) => (
                      <FormItem className="grid grid-cols-3 gap-4 items-start space-y-0">
                        <FormLabel className="text-right col-span-1 font-medium text-muted-foreground">
                          ZIP Code
                        </FormLabel>
                        <div className="space-y-2 col-span-2">
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
                    name="country"
                    render={({ field }) => (
                      <FormItem className="grid grid-cols-3 gap-4 items-start space-y-0">
                        <FormLabel className="text-right col-span-1 font-medium text-muted-foreground">
                          Country
                        </FormLabel>
                        <div className="space-y-2 col-span-2">
                          <FormControl>
                            <CountrySelect
                              {...field}
                              placeholder="Enter country"
                              className="w-full"
                            />
                          </FormControl>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />
                </div>

                {/* Form Actions */}
              </div>
            </Form>
          </div>
          <div className="flex justify-end gap-3 p-4 border-t absolute bottom-0 right-0 left-0 mt-auto bg-background/60 backdrop-blur-lg">
            <SheetClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </SheetClose>
            <Button
              type="button"
              onClick={() => {
                form.handleSubmit(onSubmit)();
              }}
            >
              Create Client
            </Button>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export default CreateClientSheet;
