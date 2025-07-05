"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  User,
  ShoppingCart,
  Package,
  Mail,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  AlertCircle,
  RefreshCw,
  Activity,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/supabase";
import { useSheet, type Sheets } from "@/context/sheets";

interface ActivityItem {
  id: string;
  type: string;
  action: string;
  description: string;
  timestamp: string;
  status?: string | null;
  amount?: number | null;
  originalID?: any;
  metadata?: {
    email?: string;
    category?: string;
    recipients?: number;
    clientName?: string;
    isUpdate?: boolean;
  };
}

// @ts-ignore
function getActivityIcon(type: string, isUpdate?: boolean) {
  const iconClass = "h-4 w-4";

  switch (type) {
    case "client":
      return <User className={iconClass} />;
    case "order":
      return <ShoppingCart className={iconClass} />;
    case "product":
      return <Package className={iconClass} />;
    case "campaign":
      return <Mail className={iconClass} />;
    default:
      return <Activity className={iconClass} />;
  }
}

function getStatusIcon(status: string) {
  const iconClass = "h-3 w-3";

  switch (status.toLowerCase()) {
    case "pending":
      return <Clock className={iconClass} />;
    case "processing":
      return <RefreshCw className={iconClass} />;
    case "shipped":
      return <Truck className={iconClass} />;
    case "completed":
    case "delivered":
      return <CheckCircle className={iconClass} />;
    case "cancelled":
      return <XCircle className={iconClass} />;
    default:
      return <AlertCircle className={iconClass} />;
  }
}

function getStatusColor(status: string) {
  switch (status.toLowerCase()) {
    case "pending":
      return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-800";
    case "processing":
      return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-800";
    case "shipped":
      return "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-800";
    case "completed":
    case "delivered":
      return "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-800";
    case "cancelled":
      return "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-800";
    default:
      return "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-950/20 dark:text-gray-400 dark:border-gray-800";
  }
}

function getTypeColor(type: string) {
  switch (type) {
    case "client":
      return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-800";
    case "order":
      return "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-800";
    case "product":
      return "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-800";
    case "campaign":
      return "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/20 dark:text-orange-400 dark:border-orange-800";
    default:
      return "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-950/20 dark:text-gray-400 dark:border-gray-800";
  }
}

function formatRelativeTime(timestamp: string) {
  const now = new Date();
  const time = new Date(timestamp);
  const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return "Just now";
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes}m ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}h ago`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days}d ago`;
  }
}

function ActivitySkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-start space-x-4 p-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-5 w-16" />
            </div>
            <Skeleton className="h-3 w-48" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function RecentActivityFeed() {
  const { openSheet } = useSheet();
  const {
    data: activities,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["recent-activities"],
    queryFn: async () => {
      const activities: ActivityItem[] = [];

      // Get recent clients
      const { data: recentClients } = await supabase
        .from("client")
        .select("client_id, name, email, created_at, updated_at")
        .order("updated_at", { ascending: false })
        .limit(5);

      recentClients?.forEach((client) => {
        const createdAt = client.created_at || new Date().toISOString();
        const updatedAt = client.updated_at || new Date().toISOString();
        const isUpdate =
          new Date(updatedAt).getTime() > new Date(createdAt).getTime() + 1000;

        activities.push({
          id: `client-${client.client_id}`,
          originalID: client.client_id,
          type: "client",
          action: isUpdate ? "Client updated" : "New client registered",
          description: client.name,
          timestamp: updatedAt,
          metadata: { email: client.email, isUpdate },
        });
      });

      // Get recent orders
      const { data: recentOrders } = await supabase
        .from("order")
        .select(
          `
          order_id, 
          total_amount, 
          status, 
          created_at,
          updated_at,
          client!inner(name, email)
        `
        )
        .order("updated_at", { ascending: false })
        .limit(5);

      recentOrders?.forEach((order) => {
        const createdAt = order.created_at || new Date().toISOString();
        const updatedAt = order.updated_at || new Date().toISOString();
        const isUpdate =
          new Date(updatedAt).getTime() > new Date(createdAt).getTime() + 1000;

        activities.push({
          id: `order-${order.order_id}`,
          originalID: order.order_id,
          type: "order",
          action: isUpdate ? "Order updated" : "New order placed",
          description: `Order #${order.order_id}`,
          timestamp: updatedAt,
          status: order.status,
          amount: order.total_amount,
          metadata: { clientName: (order.client as any)?.name, isUpdate },
        });
      });

      // Get recent products
      const { data: recentProducts } = await supabase
        .from("item")
        .select(
          `
          item_id, 
          name, 
          created_at,
          updated_at,
          item_category!inner(name)
        `
        )
        .order("updated_at", { ascending: false })
        .limit(5);

      recentProducts?.forEach((product) => {
        const createdAt = product.created_at || new Date().toISOString();
        const updatedAt = product.updated_at || new Date().toISOString();
        const isUpdate =
          new Date(updatedAt).getTime() > new Date(createdAt).getTime() + 1000;

        activities.push({
          id: `product-${product.item_id}`,
          originalID: product.item_id,
          type: "product",
          action: isUpdate ? "Product updated" : "New product added",
          description: product.name,
          timestamp: updatedAt,
          metadata: {
            category: (product.item_category as any)?.name,
            isUpdate,
          },
        });
      });

      // Get recent campaigns
      const { data: recentCampaigns } = await supabase
        .from("campaign")
        .select(
          "campaign_id, name, status, total_recipients, created_at, updated_at"
        )
        .order("updated_at", { ascending: false })
        .limit(3);

      recentCampaigns?.forEach((campaign) => {
        const createdAt = campaign.created_at || new Date().toISOString();
        const updatedAt = campaign.updated_at || new Date().toISOString();
        const isUpdate =
          new Date(updatedAt).getTime() > new Date(createdAt).getTime() + 1000;

        activities.push({
          id: `campaign-${campaign.campaign_id}`,
          originalID: campaign.campaign_id,
          type: "campaign",
          action: isUpdate ? "Campaign updated" : "Campaign created",
          description: campaign.name,
          timestamp: updatedAt,
          status: campaign.status,
          metadata: {
            recipients: campaign.total_recipients as number,
            isUpdate,
          },
        });
      });

      return activities
        .sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )
        .slice(0, 10);
    },
  });

  useEffect(() => {
    const intervalId = setInterval(() => {
      refetch();
    }, 60000);

    return () => clearInterval(intervalId);
  }, [refetch]);

  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-500" />
            Recent Activity
          </CardTitle>
          <CardDescription>
            Unable to load recent activity. Please try again.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => refetch()} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>
              Latest updates from your store and campaigns
            </CardDescription>
          </div>
          <Button
            onClick={() => refetch()}
            variant="ghost"
            size="sm"
            disabled={isFetching}
          >
            <RefreshCw
              className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
            />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[500px]">
          {isLoading ? (
            <div className="p-6">
              <ActivitySkeleton />
            </div>
          ) : !activities || activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
              <Activity className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                No recent activity
              </h3>
              <p className="text-sm text-muted-foreground">
                Activity will appear here as you use your store
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {activities.map((activity) => (
                <div
                  onClick={() => {
                    openSheet(`${activity.type}:view` as Sheets, {
                      id: activity.originalID,
                    });
                  }}
                  key={activity.id}
                  className="flex items-start gap-4 p-6 hover:bg-muted/50 transition-colors"
                >
                  {/* Icon */}
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${getTypeColor(activity.type)}`}
                  >
                    {getActivityIcon(
                      activity.type,
                      activity.metadata?.isUpdate
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div>
                        <p className="font-medium text-sm leading-none mb-1">
                          {activity.action}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                          {activity.description}
                        </p>
                      </div>

                      {/* Badges */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {activity.metadata?.isUpdate && (
                          <Badge
                            variant="outline"
                            className="text-xs bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-800"
                          >
                            Updated
                          </Badge>
                        )}
                        {activity.status && (
                          <Badge
                            variant="outline"
                            className={`text-xs flex items-center gap-1 ${getStatusColor(activity.status)}`}
                          >
                            {getStatusIcon(activity.status)}
                            {activity.status.charAt(0).toUpperCase() +
                              activity.status.slice(1)}
                          </Badge>
                        )}
                        {activity.amount && (
                          <Badge
                            variant="outline"
                            className="text-xs bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-800"
                          >
                            $
                            {activity.amount.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Metadata */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {activity.metadata?.email && (
                          <span className="truncate max-w-[200px]">
                            {activity.metadata.email}
                          </span>
                        )}
                        {activity.metadata?.clientName && (
                          <span className="truncate max-w-[150px]">
                            by {activity.metadata.clientName}
                          </span>
                        )}
                        {activity.metadata?.category && (
                          <span className="truncate max-w-[100px]">
                            in {activity.metadata.category}
                          </span>
                        )}
                        {activity.metadata?.recipients && (
                          <span>{activity.metadata.recipients} recipients</span>
                        )}
                      </div>

                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatRelativeTime(activity.timestamp)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
