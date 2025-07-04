"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useSheet } from "@/context/sheets";
import type { Database } from "@/interface/database.types";
import { supabase } from "@/supabase";
import { useQuery } from "@tanstack/react-query";
import { format, subDays, subWeeks } from "date-fns";
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Edit,
  Package,
  TrendingDown,
  TrendingUp,
  XCircle,
} from "lucide-react";

type OrderStatus = Database["public"]["Enums"]["order_status"];

interface AlertData {
  lowStockCount: number;
  lowStockItems: Array<{ name: string; stock: number; id: number }>;
  outOfStockCount: number;
  outOfStockItems: Array<{ name: string; id: number }>;
  pendingOrdersCount: number;
  overdueOrdersCount: number;
  salesGrowth: {
    percentage: number;
    isPositive: boolean;
    currentWeekRevenue: number;
    previousWeekRevenue: number;
  };
}

function AlertSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 p-4 rounded-lg border">
          <Skeleton className="h-4 w-4 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
          <Skeleton className="h-8 w-20" />
        </div>
      ))}
    </div>
  );
}

export function SystemAlerts() {
  const { openSheet } = useSheet();

  // Fetch low stock items (items with stock <= 10 but > 0)
  const {
    data: lowStockData = { count: 0, items: [] },
    isLoading: lowStockLoading,
  } = useQuery({
    queryKey: ["system-alerts-low-stock"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("item")
        .select("item_id, name, stock_quantity")
        .lte("stock_quantity", 10)
        .gt("stock_quantity", 0)
        .order("stock_quantity", { ascending: true })
        .limit(10);

      if (error) throw error;

      return {
        count: data.length,
        items: data.map((item) => ({
          id: item.item_id,
          name: item.name,
          stock: item.stock_quantity,
        })),
      };
    },
  });

  // Fetch out of stock items (items with stock = 0)
  const {
    data: outOfStockData = { count: 0, items: [] },
    isLoading: outOfStockLoading,
  } = useQuery({
    queryKey: ["system-alerts-out-of-stock"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("item")
        .select("item_id, name, stock_quantity")
        .eq("stock_quantity", 0)
        .order("name", { ascending: true })
        .limit(10);

      if (error) throw error;

      return {
        count: data.length,
        items: data.map((item) => ({
          id: item.item_id,
          name: item.name,
        })),
      };
    },
  });

  // Fetch pending orders count
  const { data: pendingOrdersCount = 0, isLoading: pendingOrdersLoading } =
    useQuery({
      queryKey: ["system-alerts-pending-orders"],
      queryFn: async () => {
        const { count, error } = await supabase
          .from("order")
          .select("*", { count: "exact", head: true })
          .eq("status", "Pending");

        if (error) throw error;
        return count || 0;
      },
    });

  // Fetch sales growth data (current week vs previous week)
  const {
    data: salesGrowthData = {
      percentage: 0,
      isPositive: true,
      currentWeekRevenue: 0,
      previousWeekRevenue: 0,
    },
    isLoading: salesGrowthLoading,
  } = useQuery({
    queryKey: ["system-alerts-sales-growth"],
    queryFn: async () => {
      const currentWeekStart = format(subDays(new Date(), 7), "yyyy-MM-dd");
      const previousWeekStart = format(subWeeks(new Date(), 2), "yyyy-MM-dd");
      const previousWeekEnd = format(subDays(new Date(), 7), "yyyy-MM-dd");

      // Get current week revenue
      const { data: currentWeekData, error: currentWeekError } = await supabase
        .from("order")
        .select("total_amount,status")
        .gte("created_at", currentWeekStart)
        .in("status", ["Delivered", "Shipped", "Confirmed"]);

      if (currentWeekError) throw currentWeekError;

      // Get previous week revenue
      const { data: previousWeekData, error: previousWeekError } =
        await supabase
          .from("order")
          .select("total_amount,status")
          .gte("created_at", previousWeekStart)
          .lt("created_at", previousWeekEnd)
          .in("status", ["Delivered", "Shipped", "Confirmed"]);

      if (previousWeekError) throw previousWeekError;

      const currentWeekRevenue = currentWeekData.reduce(
        (sum, order) =>
          order.status != "Pending" ? sum + (order.total_amount || 0) : sum,
        0
      );
      const previousWeekRevenue = previousWeekData.reduce(
        (sum, order) =>
          order.status != "Pending" ? sum + (order.total_amount || 0) : sum,
        0
      );

      let percentage = 0;
      if (previousWeekRevenue > 0) {
        percentage =
          ((currentWeekRevenue - previousWeekRevenue) / previousWeekRevenue) *
          100;
      }

      return {
        percentage: Math.abs(percentage),
        isPositive: percentage >= 0,
        currentWeekRevenue,
        previousWeekRevenue,
      };
    },
  });

  // Fetch overdue orders (orders that are pending for more than 3 days)
  const { data: overdueOrdersCount = 0, isLoading: overdueOrdersLoading } =
    useQuery({
      queryKey: ["system-alerts-overdue-orders"],
      queryFn: async () => {
        const threeDaysAgo = format(subDays(new Date(), 3), "yyyy-MM-dd");

        const { count, error } = await supabase
          .from("order")
          .select("*", { count: "exact", head: true })
          .eq("status", "Pending")
          .lt("created_at", threeDaysAgo);

        if (error) throw error;
        return count || 0;
      },
    });

  const isLoading =
    lowStockLoading ||
    outOfStockLoading ||
    pendingOrdersLoading ||
    salesGrowthLoading ||
    overdueOrdersLoading;

  const totalCriticalAlerts = outOfStockData.count + overdueOrdersCount;
  const totalWarningAlerts = lowStockData.count + pendingOrdersCount;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            System Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AlertSkeleton />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <div>
              <CardTitle>System Alerts</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                {totalCriticalAlerts > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {totalCriticalAlerts} Critical
                  </Badge>
                )}
                {totalWarningAlerts > 0 && (
                  <Badge
                    variant="secondary"
                    className="text-xs bg-amber-100 text-amber-800"
                  >
                    {totalWarningAlerts} Warning
                  </Badge>
                )}
                {totalCriticalAlerts === 0 && totalWarningAlerts === 0 && (
                  <Badge
                    variant="outline"
                    className="text-xs bg-green-50 text-green-700 border-green-200"
                  >
                    All Clear
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="">
          <div className="p-6 space-y-4">
            {/* Out of Stock Alert - Critical Priority */}
            {outOfStockData.count > 0 && (
              <div className="group relative overflow-hidden rounded-lg border-2 border-red-200 bg-gradient-to-r from-red-50 to-red-50/50 p-4 transition-all hover:shadow-md dark:border-red-800 dark:from-red-950/20 dark:to-red-950/10">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                    <XCircle className="h-5 w-5 text-red-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-red-900 dark:text-red-100">
                        Critical: Out of Stock
                      </h3>
                      <Badge variant="destructive" className="text-xs">
                        {outOfStockData.count} items
                      </Badge>
                    </div>
                    <p className="text-sm text-red-700 dark:text-red-300 mb-3">
                      These products are completely out of stock and need
                      immediate restocking
                    </p>

                    {outOfStockData.items.length > 0 && (
                      <div className="space-y-2 mb-4">
                        {outOfStockData.items.slice(0, 3).map((item, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-2 bg-white/50 rounded border border-red-200/50 dark:bg-red-950/20 dark:border-red-800/50"
                          >
                            <span className="text-sm font-medium text-red-800 dark:text-red-200 truncate">
                              {item.name}
                            </span>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="outline"
                                className="text-xs text-red-600 border-red-300"
                              >
                                0 units
                              </Badge>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 px-2 text-xs bg-transparent"
                                onClick={() =>
                                  openSheet("product:update", {
                                    id: item.id,
                                  })
                                }
                              >
                                <Edit className="h-3 w-3 mr-1" />
                                Restock
                              </Button>
                            </div>
                          </div>
                        ))}
                        {outOfStockData.items.length > 3 && (
                          <div className="text-xs text-red-600 dark:text-red-400 text-center py-2">
                            + {outOfStockData.items.length - 3} more items out
                            of stock
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Low Stock Alert */}
            {lowStockData.count > 0 && (
              <div className="group relative overflow-hidden rounded-lg border-2 border-amber-200 bg-gradient-to-r from-amber-50 to-amber-50/50 p-4 transition-all hover:shadow-md dark:border-amber-800 dark:from-amber-950/20 dark:to-amber-950/10">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                    <Package className="h-5 w-5 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-amber-900 dark:text-amber-100">
                        Warning: Low Stock
                      </h3>
                      <Badge
                        variant="secondary"
                        className="text-xs bg-amber-100 text-amber-800"
                      >
                        {lowStockData.count} items
                      </Badge>
                    </div>
                    <p className="text-sm text-amber-700 dark:text-amber-300 mb-3">
                      These products are running low and should be restocked
                      soon
                    </p>

                    {lowStockData.items.length > 0 && (
                      <div className="space-y-2 mb-4">
                        {lowStockData.items.slice(0, 3).map((item, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-2 bg-white/50 rounded border border-amber-200/50 dark:bg-amber-950/20 dark:border-amber-800/50"
                          >
                            <span className="text-sm font-medium text-amber-800 dark:text-amber-200 truncate">
                              {item.name}
                            </span>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="outline"
                                className="text-xs text-amber-600 border-amber-300"
                              >
                                {item.stock} units left
                              </Badge>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 px-2 text-xs bg-transparent"
                                onClick={() =>
                                  openSheet("product:update", {
                                    id: item.id,
                                  })
                                }
                              >
                                <Edit className="h-3 w-3 mr-1" />
                                Update
                              </Button>
                            </div>
                          </div>
                        ))}
                        {lowStockData.items.length > 3 && (
                          <div className="text-xs text-amber-600 dark:text-amber-400 text-center py-2">
                            + {lowStockData.items.length - 3} more items running
                            low
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Pending Orders Alert */}
            {pendingOrdersCount > 0 && (
              <div className="group relative overflow-hidden rounded-lg border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-blue-50/50 p-4 transition-all hover:shadow-md dark:border-blue-800 dark:from-blue-950/20 dark:to-blue-950/10">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                    <Activity className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                        Pending Orders
                      </h3>
                      <Badge
                        variant="secondary"
                        className="text-xs bg-blue-100 text-blue-800"
                      >
                        {pendingOrdersCount} orders
                      </Badge>
                    </div>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                      {pendingOrdersCount} order
                      {pendingOrdersCount !== 1 ? "s" : ""} awaiting processing
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Overdue Orders Alert */}
            {overdueOrdersCount > 0 && (
              <div className="group relative overflow-hidden rounded-lg border-2 border-red-200 bg-gradient-to-r from-red-50 to-red-50/50 p-4 transition-all hover:shadow-md dark:border-red-800 dark:from-red-950/20 dark:to-red-950/10">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                    <Clock className="h-5 w-5 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-red-900 dark:text-red-100">
                        Urgent: Overdue Orders
                      </h3>
                      <Badge variant="destructive" className="text-xs">
                        {overdueOrdersCount} orders
                      </Badge>
                    </div>
                    <p className="text-sm text-red-700 dark:text-red-300 mb-3">
                      {overdueOrdersCount} order
                      {overdueOrdersCount !== 1 ? "s have" : " has"} been
                      pending for more than 3 days
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Sales Growth Alert */}
            <div
              className={`group relative overflow-hidden rounded-lg border-2 p-4 transition-all hover:shadow-md ${
                salesGrowthData.isPositive
                  ? "border-green-200 bg-gradient-to-r from-green-50 to-green-50/50 dark:border-green-800 dark:from-green-950/20 dark:to-green-950/10"
                  : "border-red-200 bg-gradient-to-r from-red-50 to-red-50/50 dark:border-red-800 dark:from-red-950/20 dark:to-red-950/10"
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full ${
                    salesGrowthData.isPositive
                      ? "bg-green-100 dark:bg-green-900/30"
                      : "bg-red-100 dark:bg-red-900/30"
                  }`}
                >
                  {salesGrowthData.isPositive ? (
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-red-600" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3
                      className={`font-semibold ${
                        salesGrowthData.isPositive
                          ? "text-green-900 dark:text-green-100"
                          : "text-red-900 dark:text-red-100"
                      }`}
                    >
                      Sales {salesGrowthData.isPositive ? "Growth" : "Decline"}
                    </h3>
                    <Badge
                      variant={
                        salesGrowthData.isPositive ? "default" : "destructive"
                      }
                      className={`text-xs ${salesGrowthData.isPositive ? "bg-green-100 text-green-800" : ""}`}
                    >
                      {salesGrowthData.isPositive ? "+" : "-"}
                      {salesGrowthData.percentage.toFixed(1)}%
                    </Badge>
                  </div>
                  <p
                    className={`text-sm mb-2 ${
                      salesGrowthData.isPositive
                        ? "text-green-700 dark:text-green-300"
                        : "text-red-700 dark:text-red-300"
                    }`}
                  >
                    Revenue{" "}
                    {salesGrowthData.isPositive ? "increased" : "decreased"} by{" "}
                    {salesGrowthData.percentage.toFixed(1)}% this week
                  </p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>
                      This week: $
                      {salesGrowthData.currentWeekRevenue.toLocaleString()}
                    </span>
                    <span>
                      Last week: $
                      {salesGrowthData.previousWeekRevenue.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* No Critical Alerts Message */}
            {outOfStockData.count === 0 &&
              lowStockData.count === 0 &&
              pendingOrdersCount === 0 &&
              overdueOrdersCount === 0 && (
                <div className="flex flex-col items-center justify-center p-8 text-center rounded-lg border-2 border-green-200 bg-gradient-to-r from-green-50 to-green-50/50 dark:border-green-800 dark:from-green-950/20 dark:to-green-950/10">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                    All Systems Normal
                  </h3>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    No critical alerts require your attention right now
                  </p>
                </div>
              )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
