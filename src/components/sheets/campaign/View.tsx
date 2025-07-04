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
  BookOpen,
  Calendar,
  Clock,
  Copy,
  Edit,
  ExternalLink,
  FileEdit,
  Hash,
  Link,
  Loader2,
  Mail,
  MessageSquare,
  Pause,
  Play,
  Send,
  Target,
  Trash,
  User,
  Users,
  X,
  Check,
} from "lucide-react";
import type React from "react";
import { useCallback, useMemo } from "react";

interface ViewCampaignSheetProps
  extends React.ComponentProps<React.FC<DialogProps>> {
  id: string;
}

interface Campaign {
  campaign_id: string;
  name: string;
  description?: string;
  subject?: string;
  message: string;
  delivery_method: string[];
  status: string;
  catalog_id: number;
  total_recipients?: number;
  created_at?: string;
  updated_at?: string;
  catalog?: {
    catalog_id: number;
    name: string;
    status: string;
  };
}

// Unified recipient interface that both components will use
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

const ViewCampaignSheet = (props: ViewCampaignSheetProps) => {
  const { id, ...sheetProps } = props;
  const IsMobile = useIsMobile();
  const { openSheet } = useSheet();

  // Use consistent query keys across components
  const campaignQueryKey = useMemo(() => ["campaign", id], [id]);
  const recipientsQueryKey = useMemo(() => ["campaign-recipients", id], [id]);

  // Fetch campaign data with proper error handling
  const {
    data: campaign,
    isLoading,
    error,
  } = useQuery({
    queryKey: campaignQueryKey,
    queryFn: async (): Promise<Campaign> => {
      if (!id) throw new Error("Campaign ID is required");

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
      return data as Campaign;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Unified recipient query - same structure as update component
  const { data: recipients = [] } = useQuery({
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

      // Return unified structure - filter out recipients without client data
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
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  console.log("Recipients in view:", recipients);

  // Enhanced DisplayField component with icons and better styling
  const DisplayField = useCallback(
    ({
      label,
      value,
      icon: Icon,
      className = "",
      prefix = "",
      suffix = "",
    }: {
      label: string;
      value: string | number | undefined | null;
      icon?: React.ElementType;
      className?: string;
      prefix?: string;
      suffix?: string;
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
            {value !== null && value !== undefined ? (
              `${prefix}${value}${suffix}`
            ) : (
              <span className="text-muted-foreground italic">Not provided</span>
            )}
          </p>
          {value && (
            <div className="opacity-0 group-hover:opacity-100 transition-opacity ml-auto">
              <AppCopyButton text={`${prefix}${value}${suffix}`} />
            </div>
          )}
        </div>
      </div>
    ),
    []
  );

  // Campaign info component for better visual representation
  const CampaignInfo = useCallback(
    ({
      icon: Icon,
      label,
      value,
      prefix = "",
      suffix = "",
    }: {
      icon: React.ElementType;
      label: string;
      value: string | number | null | undefined;
      prefix?: string;
      suffix?: string;
    }) => {
      if (value === null || value === undefined) return null;

      return (
        <div className="flex items-center gap-4 border-border/50 bg-muted/30 rounded-lg p-4 border group">
          <div className="flex-shrink-0">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0 flex flex-col gap-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {label}
            </p>
            <p className="text-sm font-medium truncate">{`${prefix}${value}${suffix}`}</p>
          </div>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <AppCopyButton text={`${prefix}${value}${suffix}`} />
          </div>
        </div>
      );
    },
    []
  );

  // Memoize configurations to prevent re-renders
  const deliveryMethodConfig = useMemo(
    () => ({
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
    }),
    []
  );

  const statusConfig = useMemo(
    () => ({
      Draft: {
        icon: <FileEdit className="h-4 w-4 text-yellow-500" />,
        label: "Draft",
        description: "Campaign is being prepared",
        color:
          "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      },
      Active: {
        icon: <Play className="h-4 w-4 text-green-500" />,
        label: "Active",
        description: "Campaign is currently running",
        color:
          "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      },
      Completed: {
        icon: <Check className="h-4 w-4 text-blue-500" />,
        label: "Completed",
        description: "Campaign has finished",
        color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      },
      Cancelled: {
        icon: <Pause className="h-4 w-4 text-red-500" />,
        label: "Cancelled",
        description: "Campaign was cancelled",
        color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      },
    }),
    []
  );

  // Copy campaign ID to clipboard
  const copyCampaignId = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(id);
    } catch (err) {
      console.error("Failed to copy campaign ID:", err);
    }
  }, [id]);

  // Handle opening other sheets with proper cleanup
  const handleOpenCatalogSheet = useCallback(() => {
    if (campaign?.catalog?.catalog_id) {
      openSheet("catalog:view", {
        id: campaign.catalog.catalog_id,
      });
    }
  }, [campaign?.catalog?.catalog_id, openSheet]);

  const handleOpenClientSheet = useCallback(
    (clientId: number) => {
      openSheet("client:view", { id: clientId });
    },
    [openSheet]
  );

  const handleEditCampaign = useCallback(() => {
    if (campaign?.campaign_id) {
      openSheet("campaign:update", { id: campaign.campaign_id });
    }
  }, [campaign?.campaign_id, openSheet]);

  if (error) {
    return (
      <Sheet {...sheetProps}>
        <SheetContent
          className={cn(
            "w-[700px] min-w-[700px] max-w-[700px] [&>button:first-of-type]:hidden",
            IsMobile && "min-w-auto w-full"
          )}
        >
          <div className="flex flex-col items-center justify-center h-96 text-center px-4">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <X className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              Error loading campaign
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              {error instanceof Error
                ? error.message
                : "An unknown error occurred"}
            </p>
            <Button variant="outline" className="mt-4 bg-transparent" asChild>
              <SheetClose>Go back</SheetClose>
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

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
                <p className="text-sm font-medium">Loading campaign details</p>
                <p className="text-xs text-muted-foreground">Please wait...</p>
              </div>
            </div>
          </div>
        )}

        <ScrollArea className="max-h-full min-h-full">
          <div className="space-y-6 pb-6 mb-20">
            <SheetHeader className="flex flex-row justify-between items-center border-b select-none border-sidebar-border sticky top-0 bg-background/60 backdrop-blur-lg mb-4">
              <SheetTitle className="flex items-center gap-2">
                <span>View</span>
                <Badge variant={"secondary"} className="text-lg">
                  Campaign Details
                </Badge>
              </SheetTitle>
              <SheetClose asChild>
                <Button size={"icon"} variant={"ghost"}>
                  <X />
                </Button>
              </SheetClose>
            </SheetHeader>

            {campaign ? (
              <div className="space-y-6">
                {/* Basic Information Card */}
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Target className="h-5 w-5 text-primary" />
                    Campaign Information
                  </CardTitle>
                </CardHeader>
                <div className="px-6">
                  <div className="grid gap-4">
                    {/* Campaign ID with copy button */}
                    <div className="flex items-center gap-4 border-border/50 bg-muted/30 rounded-lg p-4 border group">
                      <div className="flex-shrink-0">
                        <Hash className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col gap-2">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Campaign ID
                        </p>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-mono font-medium">{id}</p>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-6 w-6 p-0 bg-transparent"
                            onClick={copyCampaignId}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    <CampaignInfo
                      icon={Target}
                      label="Campaign Name"
                      value={campaign.name}
                    />

                    {campaign.description && (
                      <div className="bg-muted/30 rounded-lg p-4 border border-border/50">
                        <div className="flex items-center gap-2 mb-2">
                          <MessageSquare className="h-4 w-4 text-muted-foreground" />
                          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Description
                          </label>
                        </div>
                        <p className="text-sm leading-relaxed">
                          {campaign.description}
                        </p>
                      </div>
                    )}

                    {/* Status */}
                    <div className="flex items-center gap-4 border-border/50 bg-muted/30 rounded-lg p-4 border">
                      <div className="flex-shrink-0">
                        {
                          statusConfig[
                            campaign.status as keyof typeof statusConfig
                          ]?.icon
                        }
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col gap-2">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Status
                        </p>
                        <div className="flex items-center gap-2">
                          <Badge
                            className={
                              statusConfig[
                                campaign.status as keyof typeof statusConfig
                              ]?.color
                            }
                          >
                            {
                              statusConfig[
                                campaign.status as keyof typeof statusConfig
                              ]?.label
                            }
                          </Badge>
                          <p className="text-sm text-muted-foreground">
                            {
                              statusConfig[
                                campaign.status as keyof typeof statusConfig
                              ]?.description
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Relationships */}
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Link className="h-5 w-5 text-primary" />
                    Relationships
                  </CardTitle>
                </CardHeader>
                <div className="px-6">
                  {campaign.catalog ? (
                    <div className="flex items-center gap-4 border-border/50 bg-muted/30 rounded-lg p-4 border group">
                      <div className="flex-shrink-0">
                        <BookOpen className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col gap-2">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Associated Catalog
                        </p>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            className="font-medium text-sm cursor-pointer select-none max-w-[220px] w-fit truncate bg-transparent"
                            title="Open Catalog"
                            onClick={handleOpenCatalogSheet}
                          >
                            <span className="truncate max-w-[200px]">
                              {campaign.catalog.name}
                            </span>
                            <ExternalLink className="h-3 w-3 ml-1" />
                          </Button>
                          <Badge className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            {campaign.catalog.status?.toUpperCase() ||
                              "UNKNOWN"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4 border-border/50 bg-muted/30 rounded-lg p-4 border">
                      <div className="flex-shrink-0">
                        <BookOpen className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col gap-2">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Associated Catalog
                        </p>
                        <p className="text-sm text-muted-foreground">
                          No catalog associated
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Delivery Configuration */}
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Send className="h-5 w-5 text-primary" />
                    Delivery Configuration
                  </CardTitle>
                </CardHeader>
                <div className="px-6">
                  <div className="space-y-4">
                    {/* Delivery Methods */}
                    <div className="bg-muted/30 rounded-lg p-4 border border-border/50">
                      <div className="flex items-center gap-2 mb-3">
                        <Send className="h-4 w-4 text-muted-foreground" />
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Delivery Methods
                        </label>
                      </div>
                      {campaign.delivery_method &&
                      campaign.delivery_method.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {campaign.delivery_method.map((method: string) => (
                            <div
                              key={method}
                              className="flex items-center gap-2 bg-background rounded-md px-3 py-2 border"
                            >
                              {
                                deliveryMethodConfig[
                                  method as keyof typeof deliveryMethodConfig
                                ]?.icon
                              }
                              <span className="text-sm font-medium">
                                {
                                  deliveryMethodConfig[
                                    method as keyof typeof deliveryMethodConfig
                                  ]?.label
                                }
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          No delivery methods configured
                        </p>
                      )}
                    </div>

                    {/* Email Subject */}
                    {campaign.delivery_method?.includes("email") &&
                      campaign.subject && (
                        <DisplayField
                          label="Email Subject"
                          value={campaign.subject}
                          icon={Mail}
                        />
                      )}
                  </div>
                </div>

                <Separator />

                {/* Recipients */}
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Users className="h-5 w-5 text-primary" />
                    Recipients ({recipients.length})
                  </CardTitle>
                </CardHeader>
                <div className="px-6">
                  {recipients && recipients.length > 0 ? (
                    <div className="space-y-3">
                      <div className="text-sm text-muted-foreground mb-4">
                        Campaign will be sent to {recipients.length} selected
                        client{recipients.length !== 1 ? "s" : ""}
                      </div>
                      <ScrollArea className="max-h-[500px]">
                        <div className="space-y-2 pr-4">
                          {recipients.map((recipient) => (
                            <div
                              key={recipient.recipient_id}
                              className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/50"
                            >
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <p className="font-medium text-sm truncate">
                                      {recipient.client.name ||
                                        "Unknown Client"}
                                    </p>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-5 w-5 p-0 text-muted-foreground hover:text-foreground"
                                      onClick={() =>
                                        handleOpenClientSheet(
                                          recipient.client.client_id
                                        )
                                      }
                                    >
                                      <ExternalLink className="h-3 w-3" />
                                    </Button>
                                  </div>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {recipient.client.email || "No email"}
                                  </p>
                                  <div className="group flex gap-2 items-center justify-start">
                                    <Badge variant={"outline"}>
                                      {typeof window !== "undefined" &&
                                        `${window.location.origin}/catalog/${campaign.campaign_id}?recipient=${recipient.recipient_id}`}
                                    </Badge>
                                    <span className="group-hover:opacity-100 opacity-0 transition-all duration-300">
                                      <AppCopyButton
                                        text={
                                          typeof window !== "undefined"
                                            ? `${window.location.origin}/catalog/${campaign.campaign_id}?recipient=${recipient.recipient_id}`
                                            : ""
                                        }
                                      />
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="text-xs">
                                  {deliveryMethodConfig[
                                    recipient.delivery_method as keyof typeof deliveryMethodConfig
                                  ]?.label || recipient.delivery_method}
                                </Badge>
                                <Badge
                                  variant={
                                    recipient.status === "sent"
                                      ? "default"
                                      : "secondary"
                                  }
                                  className={
                                    recipient.status === "sent"
                                      ? "bg-green-100 text-green-800"
                                      : recipient.status === "failed"
                                        ? "bg-red-100 text-red-800"
                                        : "bg-yellow-100 text-yellow-800"
                                  }
                                >
                                  {recipient.status || "pending"}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-sm font-medium mb-2">
                        No Recipients Selected
                      </h3>
                      <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                        No clients have been selected for this campaign
                      </p>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Message Content */}
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    Message Content
                  </CardTitle>
                </CardHeader>
                <div className="px-6">
                  <div className="bg-muted/30 rounded-lg p-4 border border-border/50">
                    <div className="flex items-center gap-2 mb-3">
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Campaign Message
                      </label>
                    </div>
                    <div className="bg-background rounded-md p-4 border">
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {campaign.message}
                      </p>
                    </div>
                    <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
                      <span>Message content for campaign delivery</span>
                      <span>{campaign.message?.length || 0} characters</span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Timeline */}
                {(campaign.created_at || campaign.updated_at) && (
                  <>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Clock className="h-5 w-5 text-primary" />
                        Timeline
                      </CardTitle>
                    </CardHeader>
                    <div className="space-y-4 px-6">
                      {campaign.created_at && (
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                              Created
                            </p>
                            <p className="text-sm font-medium flex gap-2">
                              {getFormattedDateMeta(campaign.created_at).full}
                              <span className="text-muted-foreground text-sm">
                                (
                                {
                                  getFormattedDateMeta(campaign.created_at)
                                    .relative
                                }
                                )
                              </span>
                            </p>
                          </div>
                        </div>
                      )}
                      {campaign.updated_at && (
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                              Last Updated
                            </p>
                            <p className="text-sm font-medium flex gap-2">
                              {getFormattedDateMeta(campaign.updated_at).full}
                              <span className="text-muted-foreground text-sm">
                                (
                                {
                                  getFormattedDateMeta(campaign.updated_at)
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
              !isLoading && (
                <div className="flex flex-col items-center justify-center h-96 text-center px-4">
                  <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <Target className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">
                    Campaign not found
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    The campaign you're looking for doesn't exist or may have
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
          </div>

          {campaign && (
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
                onClick={handleEditCampaign}
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

export default ViewCampaignSheet;
