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
import { cn } from "@/lib/utils";
import { supabase } from "@/supabase";
import type { DialogProps } from "@radix-ui/react-dialog";
import { useQuery } from "@tanstack/react-query";
import {
  Calendar,
  Clock,
  Edit,
  Hash,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Trash,
  User,
  X,
} from "lucide-react";
import type React from "react";

interface ViewClientSheetProps
  extends React.ComponentProps<React.FC<DialogProps>> {
  id: string;
}

const ViewClientSheet = (props: ViewClientSheetProps) => {
  const { id, ...sheetProps } = props;
  const IsMobile = useIsMobile();
  const { openSheet } = useSheet();

  const { data: client, isLoading } = useQuery({
    queryKey: ["client", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client")
        .select("*")
        .eq("client_id", id as any)
        .single();

      if (error) throw error;
      return data;
    },
  });

  // Enhanced DisplayField component with icons and better styling
  const DisplayField = ({
    label,
    value,
    icon: Icon,
    className = "",
  }: {
    label: string;
    value: string | number | undefined | null;
    icon?: React.ElementType;
    className?: string;
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
          {value || (
            <span className="text-muted-foreground italic">Not provided</span>
          )}
        </p>
        {value && (
          <div className="opacity-0 group-hover:opacity-100 transition-opacity ml-auto">
            <AppCopyButton text={value as any} />
          </div>
        )}
      </div>
    </div>
  );

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
      <div className="flex items-center gap-4  border-border/50  bg-muted/30 rounded-lg p-4 border group">
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
                <p className="text-sm font-medium">Loading client details</p>
                <p className="text-xs text-muted-foreground">Please wait...</p>
              </div>
            </div>
          </div>
        )}

        <ScrollArea className="max-h-full min-h-full">
          <div className="space-y-6 pb-6 mb-20">
            <SheetHeader className="flex  flex-row justify-between items-center border-b select-none border-sidebar-border sticky top-0 bg-background/60 backdrop-blur-lg mb-4">
              <SheetTitle className="flex items-center gap-2">
                <span>View</span>
                <Badge variant={"secondary"} className="text-lg">
                  Client Profile
                </Badge>
              </SheetTitle>
              <SheetClose asChild>
                <Button size={"icon"} variant={"ghost"}>
                  <X />
                </Button>
              </SheetClose>
            </SheetHeader>
            {client ? (
              <div className="space-y-6 ">
                {/* Contact Information Card */}
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Mail className="h-5 w-5 text-primary" />
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <div className="px-6">
                  <div className="grid gap-4">
                    <ContactMethod
                      icon={Hash}
                      label="Client ID"
                      value={client?.client_id as any}
                    />
                    <ContactMethod
                      icon={User}
                      label="Full Name"
                      value={client.name}
                    />
                    <ContactMethod
                      icon={Mail}
                      label="Email Address"
                      value={client.email}
                    />
                    <ContactMethod
                      icon={Phone}
                      label="Phone Number"
                      value={client.phone}
                    />
                    <ContactMethod
                      icon={MessageCircle}
                      label="WhatsApp"
                      value={client.whatsapp_phone}
                    />
                  </div>
                </div>

                <Separator />

                {/* Address Information Card */}
                {(client.address_line1 ||
                  client.city ||
                  client.state ||
                  client.zip ||
                  client.country) && (
                  <>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <MapPin className="h-5 w-5 text-primary" />
                        Address Information
                      </CardTitle>
                    </CardHeader>
                    <div className="space-y-4 px-6">
                      {/* Full Address Display */}
                      <div className="bg-muted/30 rounded-lg p-4 border border-border/50">
                        <div className="space-y-1">
                          {client.address_line1 && (
                            <p className="font-medium">
                              {client.address_line1}
                            </p>
                          )}
                          {client.address_line2 && (
                            <p className="text-muted-foreground">
                              {client.address_line2}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-2 text-sm">
                            {client.city && <span>{client.city}</span>}
                            {client.city && client.state && <span>•</span>}
                            {client.state && <span>{client.state}</span>}
                            {client.zip && <span>{client.zip}</span>}
                          </div>
                          {client.country && (
                            <p className="text-sm font-medium text-muted-foreground">
                              {client.country}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Individual Address Fields */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <DisplayField
                          label="Address Line 1"
                          value={client.address_line1}
                        />
                        <DisplayField
                          label="Address Line 2"
                          value={client.address_line2}
                        />
                        <DisplayField label="City" value={client.city} />
                        <DisplayField
                          label="State/Province"
                          value={client.state}
                        />
                        <DisplayField
                          label="ZIP/Postal Code"
                          value={client.zip}
                        />
                        <DisplayField label="Country" value={client.country} />
                      </div>
                    </div>
                  </>
                )}
                <Separator />
                {/* Metadata Card */}
                {(client.created_at || client.updated_at) && (
                  <>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Clock className="h-5 w-5 text-primary" />
                        Timeline
                      </CardTitle>
                    </CardHeader>
                    <div className="space-y-4 px-6">
                      {client.created_at && (
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                              Created
                            </p>
                            <p className="text-sm font-medium flex  gap-2">
                              {getFormattedDateMeta(client.created_at).full}
                              <span className="text-muted-foreground text-sm">
                                (
                                {
                                  getFormattedDateMeta(client.created_at)
                                    .relative
                                }
                                )
                              </span>
                            </p>
                          </div>
                        </div>
                      )}
                      {client.updated_at && (
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                              Last Updated
                            </p>
                            <p className="text-sm font-medium flex  gap-2">
                              {getFormattedDateMeta(client.updated_at).full}
                              <span className="text-muted-foreground text-sm">
                                (
                                {
                                  getFormattedDateMeta(client.updated_at)
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
                  <User className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Client not found</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  The client you're looking for doesn't exist or may have been
                  deleted. Please check the client ID and try again.
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
          {client && (
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
                  if (!client) return null;
                  openSheet("client:update", { id: client?.client_id });
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

export default ViewClientSheet;
