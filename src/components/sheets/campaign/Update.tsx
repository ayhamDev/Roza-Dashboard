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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
  Copy,
  ExternalLink,
  FileEdit,
  Link,
  Loader2,
  Mail,
  MessageSquare,
  Pause,
  Play,
  Plus,
  Send,
  Target,
  User,
  Users,
  X,
} from "lucide-react";
import { nanoid } from "nanoid";
import type React from "react";
import { useMemo, useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

const formSchema = z.object({
  name: z
    .string()
    .min(1, "Campaign name is required")
    .max(150, "Name must be 150 characters or less"),
  description: z.string().optional(),
  subject: z.string().optional(),
  message: z
    .string()
    .min(1, "Message is required")
    .max(5000, "Message must be 5000 characters or less"),
  delivery_method: z
    .array(z.enum(["email", "sms", "whatsapp"]))
    .min(1, "Please select at least one delivery method"),
  status: z.enum(["Draft", "Active", "Completed", "Cancelled"], {
    required_error: "Please select a status",
  }),
  catalog_id: z.number().min(1, "Please select a catalog"),
  recipient_type: z.enum(["all", "selected"], {
    required_error: "Please select recipient type",
  }),
});

type FormData = z.infer<typeof formSchema>;

interface Catalog {
  catalog_id: number;
  name: string;
  status: string;
}

// Unified recipient interface - same as view component
interface CampaignRecipient {
  recipient_id: string;
  campaign_id: string;
  client_id: number;
  delivery_method: string;
  status: string;
  client: {
    client_id: number;
    name: string;
    email: string;
    phone?: string;
    whatsapp_phone?: string;
  };
}

// Client interface for form usage
interface Client {
  client_id: number;
  name: string;
  email: string;
  phone?: string;
  whatsapp_phone?: string;
  selectedDeliveryMethod?: string;
}

interface UpdateCampaignSheetProps
  extends React.ComponentProps<React.FC<DialogProps>> {
  id: string;
}

const UpdateCampaignSheet = (props: UpdateCampaignSheetProps) => {
  const { id, ...sheetProps } = props;
  const { openSheet } = useSheet();
  const IsMobile = useIsMobile();
  const qc = useQueryClient();
  const [catalogSearch, setCatalogSearch] = useState("");
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [clientSearch, setClientSearch] = useState("");
  const [clientOpen, setClientOpen] = useState(false);
  const [selectedClients, setSelectedClients] = useState<Client[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);

  // Use consistent query keys - same as view component
  const campaignQueryKey = useMemo(() => ["campaign", id], [id]);
  const recipientsQueryKey = useMemo(() => ["campaign-recipients", id], [id]);

  // Fetch existing campaign data
  const { data: campaign, isLoading } = useQuery({
    queryKey: campaignQueryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campaign")
        .select(
          `
          *,
          catalog:catalog_id!inner(
            catalog_id,
            name,
            status
          )
        `
        )
        .eq("campaign_id", id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  // Unified recipient query - same structure as view component
  const { data: existingRecipients = [] } = useQuery({
    queryKey: recipientsQueryKey,
    queryFn: async (): Promise<CampaignRecipient[]> => {
      if (!id) return [];

      const { data, error } = await supabase
        .from("campaign_recipient")
        .select(
          `
          recipient_id,
          campaign_id,
          client_id,
          delivery_method,
          status,
          client:client_id!inner(
            client_id,
            name,
            email,
            phone,
            whatsapp_phone
          )
        `
        )
        .eq("campaign_id", id);

      if (error) {
        console.error("Error fetching recipients:", error);
        return [];
      }

      // Return unified structure - same as view component
      return (data || [])
        .filter((recipient: any) => recipient?.client)
        .map((recipient: any) => ({
          recipient_id: recipient.recipient_id,
          campaign_id: recipient.campaign_id,
          client_id: recipient.client_id,
          delivery_method: recipient.delivery_method,
          status: recipient.status,
          client: recipient.client,
        })) as CampaignRecipient[];
    },
    enabled: !!id,
  });

  // Transform recipients for form usage
  const transformedRecipients = useMemo(() => {
    return existingRecipients.map((recipient) => ({
      client_id: recipient.client.client_id,
      name: recipient.client.name,
      email: recipient.client.email,
      phone: recipient.client.phone,
      whatsapp_phone: recipient.client.whatsapp_phone,
      selectedDeliveryMethod: recipient.delivery_method,
    }));
  }, [existingRecipients]);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      subject: "",
      message: "",
      delivery_method: [],
      status: "Draft",
      catalog_id: 0,
      recipient_type: "selected",
    },
  });

  // Populate form when campaign data is loaded
  const populateForm = useCallback(() => {
    if (campaign) {
      const formData = {
        name: campaign?.name || "",
        description: campaign.description || "",
        subject: campaign.subject || "",
        message: campaign.message || "",
        delivery_method: campaign.delivery_method || [],
        status: campaign.status || "Draft",
        catalog_id: campaign.catalog_id || 0,
        recipient_type:
          transformedRecipients.length > 0
            ? ("selected" as const)
            : ("all" as const),
      };

      form.reset(formData);
    }
  }, [campaign, transformedRecipients.length, form]);

  useEffect(() => {
    populateForm();
  }, [populateForm]);

  // Load existing recipients into selected clients
  useEffect(() => {
    if (transformedRecipients.length > 0) {
      setSelectedClients(transformedRecipients);
    }
  }, [transformedRecipients]);

  const watchedDeliveryMethods = form.watch("delivery_method");
  const watchedRecipientType = form.watch("recipient_type");

  // Fetch catalogs with search
  const { data: catalogs = [], isLoading: catalogsLoading } = useQuery({
    queryKey: ["catalogs-search", catalogSearch],
    queryFn: async () => {
      let query = supabase
        .from("catalog")
        .select("catalog_id, name, status")
        .eq("status", "enabled")
        .order("name");

      if (catalogSearch.trim()) {
        query = query.ilike("name", `%${catalogSearch}%`);
      }

      const { data, error } = await query.limit(50);
      if (error) throw error;
      return data as Catalog[];
    },
  });

  // Build client query conditions based on selected delivery methods
  const clientQueryConditions = useMemo(() => {
    if (!watchedDeliveryMethods.length) return null;

    const conditions = [];
    if (watchedDeliveryMethods.includes("email")) {
      conditions.push("email.neq.null");
    }
    if (watchedDeliveryMethods.includes("sms")) {
      conditions.push("phone.neq.null");
    }
    if (watchedDeliveryMethods.includes("whatsapp")) {
      conditions.push("whatsapp_phone.neq.null");
    }

    return conditions.length > 0 ? conditions.join(",") : null;
  }, [watchedDeliveryMethods]);

  const selectedClientIds = useMemo(
    () => selectedClients.map((c) => c.client_id),
    [selectedClients]
  );

  // Fetch available clients based on delivery methods
  const { data: availableClients = [], isLoading: clientsLoading } = useQuery({
    queryKey: [
      "clients-for-campaign",
      clientSearch,
      clientQueryConditions,
      selectedClientIds,
    ],
    queryFn: async () => {
      if (!clientQueryConditions) return [];

      let query = supabase
        .from("client")
        .select("client_id, name, email, phone, whatsapp_phone")
        .order("name");

      // Apply delivery method filters
      query = query.or(clientQueryConditions);

      // Apply search filter
      if (clientSearch.trim()) {
        query = query.or(
          `name.ilike.%${clientSearch}%,email.ilike.%${clientSearch}%`
        );
      }

      // Exclude already selected clients
      const selectedIds = selectedClients.map((c) => c.client_id);
      if (selectedIds.length > 0) {
        query = query.not("client_id", "in", `(${selectedIds.join(",")})`);
      }

      const { data, error } = await query.limit(50);
      if (error) throw error;
      return data as Client[];
    },
    enabled:
      clientOpen &&
      watchedRecipientType === "selected" &&
      !!clientQueryConditions,
  });

  const onSubmit = async (data: FormData) => {
    try {
      setIsUpdating(true);

      // Validation for selected recipients
      if (data.recipient_type === "selected") {
        if (selectedClients.length === 0) {
          toast.error("Please select at least one client");
          return;
        }

        // Check if all selected clients have delivery methods
        const clientsWithoutMethod = selectedClients.filter(
          (c) => !c.selectedDeliveryMethod
        );
        if (clientsWithoutMethod.length > 0) {
          toast.error("Please select delivery method for all selected clients");
          return;
        }
      }

      // Update campaign
      const { error: campaignError } = await supabase
        .from("campaign")
        .update({
          name: data.name,
          description: data.description || null,
          subject: data.subject || null,
          message: data.message,
          delivery_method: data.delivery_method,
          status: data.status,
          catalog_id: data.catalog_id,
          total_recipients:
            data.recipient_type === "selected" ? selectedClients.length : null,
          updated_at: new Date().toISOString(),
        })
        .eq("campaign_id", id);

      if (campaignError) {
        throw campaignError;
      }

      // Delete existing recipients
      const { error: deleteError } = await supabase
        .from("campaign_recipient")
        .delete()
        .eq("campaign_id", id);

      if (deleteError) {
        console.error("Failed to delete existing recipients:", deleteError);
      }

      // Create new campaign recipients if specific clients are selected
      if (data.recipient_type === "selected" && selectedClients.length > 0) {
        const recipients = selectedClients.map((client) => ({
          campaign_id: id,
          client_id: client.client_id,
          recipient_id: nanoid(8),
          delivery_method: client.selectedDeliveryMethod!,
          status: "pending",
        }));

        const { error: recipientsError } = await supabase
          .from("campaign_recipient")
          .insert(recipients);

        if (recipientsError) {
          console.error(
            "Failed to create campaign recipients:",
            recipientsError
          );
          toast.error("Campaign updated but recipients couldn't be assigned", {
            description:
              "You can manage recipients later from the campaign details",
          });
        }
      }

      toast.success("Campaign updated successfully!");
      props?.onOpenChange?.(false);

      // Invalidate queries with same keys as view component
      qc.invalidateQueries({
        predicate: (query) => query.queryKey?.[0] === "campaign",
      });
      qc.invalidateQueries({
        predicate: (query) => query.queryKey?.[0] === "campaign-recipients",
      });
      console.log(true);
    } catch (err) {
      toast.error("Something went wrong", {
        description:
          err instanceof Error ? err.message : "Unknown error occurred",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const selectedCatalog = catalogs.find(
    (catalog) => catalog.catalog_id === form.watch("catalog_id")
  );

  const deliveryMethodConfig = {
    email: {
      icon: <Mail className="h-4 w-4" />,
      label: "Email",
      description: "Send via email to client email addresses",
    },
    sms: {
      icon: <MessageSquare className="h-4 w-4" />,
      label: "SMS",
      description: "Send via SMS to client phone numbers",
    },
    whatsapp: {
      icon: <Send className="h-4 w-4" />,
      label: "WhatsApp",
      description: "Send via WhatsApp to client WhatsApp numbers",
    },
  };

  const statusConfig = {
    Draft: {
      icon: <FileEdit className="h-4 w-4 text-yellow-500" />,
      label: "Draft",
      description: "Campaign is being prepared",
    },
    Active: {
      icon: <Play className="h-4 w-4 text-green-500" />,
      label: "Active",
      description: "Campaign is currently running",
    },
    Completed: {
      icon: <Check className="h-4 w-4 text-blue-500" />,
      label: "Completed",
      description: "Campaign has finished",
    },
    Cancelled: {
      icon: <Pause className="h-4 w-4 text-red-500" />,
      label: "Cancelled",
      description: "Campaign was cancelled",
    },
  };

  // Add client to selected list
  const addClient = (client: Client) => {
    setSelectedClients((prev) => [...prev, client]);
    setClientOpen(false);
    setClientSearch("");
  };

  // Remove client from selected list
  const removeClient = (clientId: number) => {
    setSelectedClients((prev) => prev.filter((c) => c.client_id !== clientId));
  };

  // Get available contact methods for a client
  const getClientContactMethods = useCallback((client: Client) => {
    const methods: string[] = [];
    if (client.email) methods.push("email");
    if (client.phone) methods.push("sms");
    if (client.whatsapp_phone) methods.push("whatsapp");
    return methods;
  }, []);

  // Copy campaign ID to clipboard
  const copyCampaignId = async () => {
    try {
      await navigator.clipboard.writeText(id);
      toast.success("Campaign ID copied to clipboard");
    } catch (err) {
      toast.error("Failed to copy campaign ID");
    }
  };

  // Optimize delivery method change handler
  const handleDeliveryMethodChange = useCallback(
    (checked: boolean, method: string, currentValue: string[]) => {
      const updatedValue = checked
        ? [...(currentValue || []), method]
        : currentValue?.filter((value) => value !== method) || [];

      // Only clear selected clients if we're in selected mode and methods changed
      if (watchedRecipientType === "selected" && selectedClients.length > 0) {
        // Check if any selected clients no longer have compatible methods
        const newMethods = updatedValue;
        const incompatibleClients = selectedClients.filter((client) => {
          const clientMethods = getClientContactMethods(client);
          return !clientMethods.some((cm) => newMethods.includes(cm));
        });

        if (incompatibleClients.length > 0) {
          setSelectedClients((prev) =>
            prev.filter((client) => {
              const clientMethods = getClientContactMethods(client);
              return clientMethods.some((cm) => newMethods.includes(cm));
            })
          );
        }
      }

      return updatedValue;
    },
    [watchedRecipientType, selectedClients, getClientContactMethods]
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
                <p className="text-sm font-medium">Loading campaign details</p>
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
                Campaign
              </Badge>
            </SheetTitle>
            <SheetClose asChild>
              <Button size={"icon"} variant={"ghost"}>
                <X />
              </Button>
            </SheetClose>
          </SheetHeader>

          {campaign ? (
            <div className="pb-20">
              <Form {...form}>
                <div className="space-y-6">
                  {/* Basic Information Section */}
                  <div className="space-y-6 px-6">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Campaign Information
                    </h3>

                    {/* Campaign ID */}
                    <div className="grid grid-cols-3 gap-4 items-start space-y-0">
                      <div className="text-right col-span-1 font-medium text-muted-foreground">
                        Campaign ID
                      </div>
                      <div className="space-y-2 col-span-2">
                        <div className="flex items-center gap-2">
                          <Input
                            value={id}
                            readOnly
                            className="font-mono text-sm bg-muted/50"
                          />
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-9 w-9 p-0 bg-transparent"
                            onClick={copyCampaignId}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                        <FormDescription>
                          Unique identifier for this campaign
                        </FormDescription>
                      </div>
                    </div>

                    {/* Campaign Name */}
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem className="grid grid-cols-3 gap-4 items-start space-y-0">
                          <FormLabel className="text-right col-span-1 font-medium text-muted-foreground">
                            Campaign Name *
                          </FormLabel>
                          <div className="space-y-2 col-span-2">
                            <FormControl>
                              <Input
                                placeholder="Enter campaign name"
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
                                placeholder="Enter campaign description"
                                rows={3}
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Optional description for internal reference
                            </FormDescription>
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
                            Status *
                          </FormLabel>
                          <div className="space-y-2 col-span-2">
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select campaign status" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {Object.entries(statusConfig).map(
                                  ([key, config]) => (
                                    <SelectItem key={key} value={key}>
                                      <div className="flex items-center gap-2">
                                        {config.icon}
                                        <span>{config.label}</span>
                                      </div>
                                    </SelectItem>
                                  )
                                )}
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              {statusConfig[field.value]?.description}
                            </FormDescription>
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>

                  <Separator />

                  {/* Catalog Selection */}
                  <div className="space-y-6 px-6">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Link className="h-5 w-5 text-primary" />
                      Relationships
                    </h3>

                    <FormField
                      control={form.control}
                      name="catalog_id"
                      render={({ field }) => (
                        <FormItem className="grid grid-cols-3 gap-4 items-start space-y-0">
                          <FormLabel className="text-right col-span-1 font-medium text-muted-foreground">
                            Select Catalog *
                          </FormLabel>
                          <div className="space-y-2 col-span-2">
                            <Popover
                              open={catalogOpen}
                              onOpenChange={setCatalogOpen}
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
                                    {selectedCatalog ? (
                                      <div className="flex items-center gap-2">
                                        <BookOpen className="h-4 w-4" />
                                        {selectedCatalog?.name}
                                      </div>
                                    ) : (
                                      "Select catalog"
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
                                    placeholder="Search catalogs..."
                                    value={catalogSearch}
                                    onValueChange={setCatalogSearch}
                                  />
                                  <CommandList>
                                    <CommandEmpty>
                                      {catalogsLoading ? (
                                        <div className="flex items-center justify-center py-4">
                                          <Loader2 className="h-4 w-4 animate-spin" />
                                          <span className="ml-2">
                                            Loading...
                                          </span>
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
                                            field.onChange(catalog.catalog_id);
                                            setCatalogOpen(false);
                                          }}
                                        >
                                          <Check
                                            className={cn(
                                              "mr-2 h-4 w-4",
                                              field.value === catalog.catalog_id
                                                ? "opacity-100"
                                                : "opacity-0"
                                            )}
                                          />
                                          <div className="flex items-center gap-2">
                                            <BookOpen className="h-4 w-4" />
                                            <span>{catalog.name}</span>
                                          </div>
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                                  </CommandList>
                                </Command>
                              </PopoverContent>
                            </Popover>
                            <FormDescription>
                              Associate this campaign with a catalog
                            </FormDescription>
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />

                    {selectedCatalog && (
                      <div className="grid grid-cols-3 gap-4 items-center">
                        <div className="text-right col-span-1 font-medium text-muted-foreground">
                          Catalog Details
                        </div>
                        <div className="col-span-2">
                          <div className="flex items-center justify-between bg-muted/30 rounded-lg p-4 border border-border/50">
                            <div className="flex items-center gap-2">
                              <BookOpen className="h-4 w-4" />
                              <div>
                                <p className="font-medium">
                                  {selectedCatalog?.name}
                                </p>
                                <Badge className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                  ENABLED
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

                  {/* Delivery Configuration */}
                  <div className="space-y-6 px-6">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Send className="h-5 w-5" />
                      Delivery Configuration
                    </h3>

                    {/* Delivery Methods */}
                    <FormField
                      control={form.control}
                      name="delivery_method"
                      render={() => (
                        <FormItem className="grid grid-cols-3 gap-4 items-start space-y-0">
                          <FormLabel className="text-right col-span-1 font-medium text-muted-foreground">
                            Delivery Methods *
                          </FormLabel>
                          <div className="space-y-3 col-span-2">
                            {Object.entries(deliveryMethodConfig).map(
                              ([key, config]) => (
                                <FormField
                                  key={key}
                                  control={form.control}
                                  name="delivery_method"
                                  render={({ field }) => {
                                    return (
                                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                        <FormControl>
                                          <Checkbox
                                            checked={field.value?.includes(
                                              key as any
                                            )}
                                            onCheckedChange={(checked) => {
                                              const updatedValue =
                                                handleDeliveryMethodChange(
                                                  !!checked,
                                                  key,
                                                  field.value
                                                );
                                              field.onChange(updatedValue);
                                            }}
                                          />
                                        </FormControl>
                                        <div className="space-y-1 leading-none">
                                          <div className="flex items-center gap-2">
                                            {config.icon}
                                            <FormLabel className="font-medium">
                                              {config.label}
                                            </FormLabel>
                                          </div>
                                          <FormDescription className="text-xs">
                                            {config.description}
                                          </FormDescription>
                                        </div>
                                      </FormItem>
                                    );
                                  }}
                                />
                              )
                            )}
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />

                    {/* Subject (for email) */}
                    {watchedDeliveryMethods.includes("email") && (
                      <FormField
                        control={form.control}
                        name="subject"
                        render={({ field }) => (
                          <FormItem className="grid grid-cols-3 gap-4 items-start space-y-0">
                            <FormLabel className="text-right col-span-1 font-medium text-muted-foreground">
                              Email Subject
                            </FormLabel>
                            <div className="space-y-2 col-span-2">
                              <FormControl>
                                <Input
                                  placeholder="Enter email subject"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                Subject line for email campaigns
                              </FormDescription>
                              <FormMessage />
                            </div>
                          </FormItem>
                        )}
                      />
                    )}
                  </div>

                  <Separator />

                  {/* Recipients Configuration */}
                  <div className="space-y-6 px-6">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Recipients Configuration
                    </h3>

                    {/* Recipient Type */}
                    <FormField
                      control={form.control}
                      name="recipient_type"
                      render={({ field }) => (
                        <FormItem className="grid grid-cols-3 gap-4 items-start space-y-0">
                          <FormLabel className="text-right col-span-1 font-medium text-muted-foreground">
                            Send To *
                          </FormLabel>
                          <div className="space-y-3 col-span-2">
                            <FormControl>
                              <RadioGroup
                                onValueChange={(value) => {
                                  field.onChange(value);
                                  if (value === "all") {
                                    setSelectedClients([]);
                                  }
                                }}
                                value={field.value}
                                className="flex flex-col space-y-2"
                              >
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem
                                    value="all"
                                    id="all"
                                    disabled={true}
                                  />
                                  <label
                                    htmlFor="all"
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                  >
                                    All eligible clients
                                  </label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem
                                    value="selected"
                                    id="selected"
                                  />
                                  <label
                                    htmlFor="selected"
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                  >
                                    Selected clients only
                                  </label>
                                </div>
                              </RadioGroup>
                            </FormControl>
                            <FormDescription>
                              {field.value === "all"
                                ? "Campaign will be sent to all clients who have the required contact information for the selected delivery methods"
                                : "Campaign will be sent only to the clients you select below"}
                            </FormDescription>
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />

                    {/* Client Selection */}
                    {watchedRecipientType === "selected" && (
                      <div className="grid grid-cols-3 gap-4 items-start space-y-0">
                        <div className="text-left col-span-1 font-medium text-muted-foreground">
                          Select Clients
                        </div>
                        <div className="space-y-4 col-span-2">
                          {watchedDeliveryMethods.length === 0 ? (
                            <div className="text-center py-4 text-sm text-muted-foreground">
                              Please select delivery methods first
                            </div>
                          ) : (
                            <>
                              {/* Add Client Button */}
                              <div className="flex justify-between items-center">
                                <div className="text-sm text-muted-foreground">
                                  {selectedClients.length} client
                                  {selectedClients.length !== 1 ? "s" : ""}{" "}
                                  selected
                                </div>
                                <Popover
                                  open={clientOpen}
                                  onOpenChange={setClientOpen}
                                >
                                  <PopoverTrigger asChild>
                                    <Button type="button" size="sm">
                                      <Plus className="h-4 w-4 mr-2" />
                                      Add Client
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent
                                    className="w-80 p-0"
                                    align="end"
                                  >
                                    <Command>
                                      <CommandInput
                                        placeholder="Search clients..."
                                        value={clientSearch}
                                        onValueChange={setClientSearch}
                                      />
                                      <ScrollArea className="h-[300px]">
                                        <CommandList>
                                          <CommandEmpty>
                                            {clientsLoading ? (
                                              <div className="flex items-center justify-center py-4">
                                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                                <span>Loading clients...</span>
                                              </div>
                                            ) : (
                                              "No eligible clients found."
                                            )}
                                          </CommandEmpty>
                                          <CommandGroup>
                                            {availableClients.map((client) => {
                                              const contactMethods =
                                                getClientContactMethods(client);
                                              const compatibleMethods =
                                                contactMethods.filter(
                                                  (method) =>
                                                    watchedDeliveryMethods.includes(
                                                      method as any
                                                    )
                                                );

                                              return (
                                                <CommandItem
                                                  key={client.client_id}
                                                  value={client.name}
                                                  onSelect={() =>
                                                    addClient(client)
                                                  }
                                                  className="flex items-center gap-3 p-3"
                                                >
                                                  <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-sm truncate">
                                                      {client.name}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground truncate">
                                                      {client.email}
                                                    </p>
                                                    <div className="flex gap-1 mt-1">
                                                      {compatibleMethods.map(
                                                        (method) => (
                                                          <Badge
                                                            key={method}
                                                            variant="secondary"
                                                            className="text-xs"
                                                          >
                                                            {
                                                              deliveryMethodConfig[
                                                                method as keyof typeof deliveryMethodConfig
                                                              ]?.label
                                                            }
                                                          </Badge>
                                                        )
                                                      )}
                                                    </div>
                                                  </div>
                                                  <Plus className="h-4 w-4 text-muted-foreground" />
                                                </CommandItem>
                                              );
                                            })}
                                          </CommandGroup>
                                        </CommandList>
                                      </ScrollArea>
                                    </Command>
                                  </PopoverContent>
                                </Popover>
                              </div>

                              {/* Selected Clients List */}
                              {selectedClients.length > 0 && (
                                <ScrollArea className="h-[240px]">
                                  <div className="space-y-3 pr-4">
                                    {selectedClients.map((client) => {
                                      const contactMethods =
                                        getClientContactMethods(client);
                                      const availableMethods =
                                        contactMethods.filter((method) =>
                                          watchedDeliveryMethods.includes(
                                            method as any
                                          )
                                        );

                                      return (
                                        <div
                                          key={client.client_id}
                                          className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border/50"
                                        >
                                          <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                            <div className="flex-1 min-w-0">
                                              <div className="flex items-center gap-2 mb-1">
                                                <p className="font-medium text-sm truncate">
                                                  {client.name}
                                                </p>
                                                <Button
                                                  size="sm"
                                                  variant="ghost"
                                                  className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                                                  onClick={() =>
                                                    openSheet("client:view", {
                                                      id: client.client_id,
                                                    })
                                                  }
                                                >
                                                  <ExternalLink className="h-3 w-3" />
                                                </Button>
                                              </div>
                                              <p className="text-xs text-muted-foreground truncate mb-2">
                                                {client.email}
                                              </p>

                                              {/* Delivery Method Selection */}
                                              <div className="flex items-center gap-2">
                                                <span className="text-xs text-muted-foreground">
                                                  Send via:
                                                </span>
                                                <Select
                                                  value={
                                                    client.selectedDeliveryMethod ||
                                                    ""
                                                  }
                                                  onValueChange={(value) => {
                                                    setSelectedClients((prev) =>
                                                      prev.map((c) =>
                                                        c.client_id ===
                                                        client.client_id
                                                          ? {
                                                              ...c,
                                                              selectedDeliveryMethod:
                                                                value,
                                                            }
                                                          : c
                                                      )
                                                    );
                                                  }}
                                                >
                                                  <SelectTrigger className="h-7 w-auto min-w-[100px] text-xs">
                                                    <SelectValue placeholder="Select method" />
                                                  </SelectTrigger>
                                                  <SelectContent>
                                                    {availableMethods.map(
                                                      (method) => (
                                                        <SelectItem
                                                          key={method}
                                                          value={method}
                                                        >
                                                          <div className="flex items-center gap-2">
                                                            {
                                                              deliveryMethodConfig[
                                                                method as keyof typeof deliveryMethodConfig
                                                              ]?.icon
                                                            }
                                                            <span>
                                                              {
                                                                deliveryMethodConfig[
                                                                  method as keyof typeof deliveryMethodConfig
                                                                ]?.label
                                                              }
                                                            </span>
                                                          </div>
                                                        </SelectItem>
                                                      )
                                                    )}
                                                  </SelectContent>
                                                </Select>
                                              </div>
                                            </div>
                                          </div>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950 flex-shrink-0 ml-2"
                                            onClick={() =>
                                              removeClient(client.client_id)
                                            }
                                          >
                                            <X className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </ScrollArea>
                              )}

                              {selectedClients.length === 0 && (
                                <div className="text-center py-8">
                                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                  <h3 className="text-sm font-medium mb-2">
                                    No clients selected
                                  </h3>
                                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                                    Use the "Add Client" button to select
                                    clients for this campaign
                                  </p>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Message Content */}
                  <div className="space-y-6 px-6">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <MessageSquare className="h-5 w-5" />
                      Message Content
                    </h3>

                    <FormField
                      control={form.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem className="grid grid-cols-3 gap-4 items-start space-y-0">
                          <FormLabel className="text-right col-span-1 font-medium text-muted-foreground">
                            Message *
                          </FormLabel>
                          <div className="space-y-2 col-span-2">
                            <FormControl>
                              <Textarea
                                placeholder="Enter your campaign message..."
                                rows={8}
                                className="resize-none"
                                {...field}
                              />
                            </FormControl>
                            <div className="flex justify-between items-center text-xs text-muted-foreground">
                              <FormDescription>
                                The main content of your campaign message
                              </FormDescription>
                              <span>
                                {field.value?.length || 0}/5000 characters
                              </span>
                            </div>
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
                  Campaign not found
                </h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  The campaign you're trying to update doesn't exist or may have
                  been deleted. Please check the campaign ID and try again.
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
              <Button type="button" variant="outline" disabled={isUpdating}>
                Cancel
              </Button>
            </SheetClose>
            <Button
              type="button"
              disabled={isUpdating || isLoading || !campaign}
              onClick={() => {
                form.handleSubmit(onSubmit)();
              }}
            >
              {isUpdating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating Campaign...
                </>
              ) : (
                "Update Campaign"
              )}
            </Button>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export default UpdateCampaignSheet;
