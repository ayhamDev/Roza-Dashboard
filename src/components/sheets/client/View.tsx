import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import type { Database } from "@/interface/database.types";
import { cn } from "@/lib/utils";
import { supabase } from "@/supabase";
import type { DialogProps } from "@radix-ui/react-dialog";
import { Loader2, X } from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

interface ViewClientSheetProps
  extends React.ComponentProps<React.FC<DialogProps>> {
  id: string;
}

const ViewClientSheet = (props: ViewClientSheetProps) => {
  const { id, ...sheetProps } = props;
  const IsMobile = useIsMobile();
  const [client, setClient] = useState<
    Database["public"]["Tables"]["client"]["Row"] | null
  >(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClient = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("client")
          .select("*")
          .eq("id", id)
          .single();

        if (error) {
          toast.error("Failed to fetch client", {
            description: error.message,
          });
        } else {
          setClient(data);
        }
      } catch (err) {
        toast.error("Something went wrong", {
          description:
            err instanceof Error ? err.message : "Unknown error occurred",
        });
      } finally {
        setLoading(false);
      }
    };

    if (sheetProps.open) {
      fetchClient();
    }
  }, [id, sheetProps.open]);

  const DisplayField = ({
    label,
    value,
    className = "",
  }: {
    label: string;
    value: string | number | undefined | null;
    className?: string;
  }) => (
    <div className={cn("grid grid-cols-3 gap-4 items-start", className)}>
      <div className="text-right col-span-1 font-medium text-muted-foreground">
        {label}
      </div>
      <div className="col-span-2">
        <div className="min-h-[40px] px-3 py-2 bg-muted/30 rounded-md border text-sm">
          {value || "—"}
        </div>
      </div>
    </div>
  );

  return (
    <Sheet {...sheetProps}>
      <SheetContent
        className={cn(
          "min-w-[600px] [&>button:first-of-type]:hidden",
          IsMobile && "min-w-auto w-full"
        )}
      >
        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                Loading client data...
              </p>
            </div>
          </div>
        )}

        <ScrollArea className="max-h-full">
          <SheetHeader className="flex flex-row justify-between items-center border-b select-none border-sidebar-border sticky top-0 bg-background/60 backdrop-blur-lg mb-4">
            <SheetTitle className="flex items-center gap-2">
              <span>View</span>
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

          <div className="pb-20">
            {client && (
              <div className="space-y-6">
                {/* Basic Information Section */}
                <div className="space-y-10 px-6">
                  <h3 className="text-lg font-semibold">Basic Information</h3>

                  <DisplayField label="Name" value={client.name} />
                  <DisplayField label="Email" value={client.email} />
                  <DisplayField label="Phone" value={client.phone} />
                  <DisplayField
                    label="WhatsApp Phone"
                    value={client.whatsapp_phone}
                  />
                </div>

                <Separator />

                {/* Address Information Section */}
                <div className="space-y-10 px-6">
                  <h3 className="text-lg font-semibold">Address Information</h3>

                  <DisplayField
                    label="Address Line 1"
                    value={client.address_line1}
                  />
                  <DisplayField
                    label="Address Line 2"
                    value={client.address_line2}
                  />
                  <DisplayField label="City" value={client.city} />
                  <DisplayField label="State" value={client.state} />
                  <DisplayField label="ZIP Code" value={client.zip} />
                  <DisplayField label="Country" value={client.country} />
                </div>

                {/* Metadata Section (if you want to show creation/update dates) */}
                {(client.created_at || client.updated_at) && (
                  <>
                    <Separator />
                    <div className="space-y-10 px-6">
                      <h3 className="text-lg font-semibold">Information</h3>

                      {client.created_at && (
                        <DisplayField
                          label="Created At"
                          value={new Date(client.created_at).toLocaleString()}
                        />
                      )}
                      {client.updated_at && (
                        <DisplayField
                          label="Updated At"
                          value={new Date(client.updated_at).toLocaleString()}
                        />
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Error State */}
            {!loading && !client && (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <p className="text-muted-foreground">Client not found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  The client you're looking for doesn't exist or has been
                  deleted.
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 p-4 border-t absolute bottom-0 right-0 left-0 mt-auto bg-background/60 backdrop-blur-lg">
            <SheetClose asChild>
              <Button type="button" variant="outline">
                Close
              </Button>
            </SheetClose>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export default ViewClientSheet;
