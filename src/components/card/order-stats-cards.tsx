"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ShoppingCart,
  Clock,
  CheckCircle,
  XCircle,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/supabase";

interface OrderStats {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
  recentOrders: number;
}

export function OrderStatsCards() {
  const { data: stats, isLoading } = useQuery<OrderStats>({
    queryKey: ["order-stats"],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      // Get all orders with status and amounts
      const { data: orderData, error: orderError } = await supabase
        .from("order")
        .select("order_id, status, total_amount, created_at");

      if (orderError) throw orderError;

      // Get recent orders (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: recentData, error: recentError } = await supabase
        .from("order")
        .select("order_id,status,total_amount,created_at")
        .gte("created_at", sevenDaysAgo.toISOString());

      if (recentError) throw recentError;

      const totalOrders = orderData?.length || 0;
      const pendingOrders =
        orderData?.filter((o) => o.status === "Pending").length || 0;
      const completedOrders =
        orderData?.filter((o) => o.status === "Delivered").length || 0;
      const cancelledOrders =
        orderData?.filter((o) => o.status === "Cancelled").length || 0;
      const totalRevenue =
        recentData?.reduce(
          (sum, o) =>
            o.status !== "Cancelled" && o.status != "Pending"
              ? sum + (o.total_amount || 0)
              : sum,
          0
        ) || 0;
      const recentOrders = recentData?.length || 0;

      return {
        totalOrders,
        pendingOrders,
        completedOrders,
        cancelledOrders,
        totalRevenue,
        recentOrders,
      };
    },
  });

  const statsCards = [
    {
      title: "Total Orders",
      value: stats?.totalOrders || 0,
      icon: ShoppingCart,
      description: "All orders in system",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Pending Orders",
      value: stats?.pendingOrders || 0,
      icon: Clock,
      description: "Orders awaiting processing",
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
    },
    {
      title: "Completed Orders",
      value: stats?.completedOrders || 0,
      icon: CheckCircle,
      description: "Successfully completed",
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Cancelled Orders",
      value: stats?.cancelledOrders || 0,
      icon: XCircle,
      description: "Cancelled or rejected",
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
    {
      title: "Total Revenue",
      value: `$${(stats?.totalRevenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: DollarSign,
      description: "Total order value (7 days)",
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      isMonetary: true,
    },
    {
      title: "Recent Orders",
      value: stats?.recentOrders || 0,
      icon: TrendingUp,
      description: "Orders in last 7 days",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 mb-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-muted rounded w-20"></div>
              <div className="h-4 w-4 bg-muted rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-16 mb-1"></div>
              <div className="h-3 bg-muted rounded w-24"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 mb-6">
      {statsCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <Icon className={`h-6 w-6 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-1">
                {stat.isMonetary
                  ? stat.value
                  : typeof stat.value === "number"
                    ? stat.value.toLocaleString()
                    : stat.value}
              </div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
