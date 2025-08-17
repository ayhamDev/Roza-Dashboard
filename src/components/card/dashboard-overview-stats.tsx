"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  Package,
  ShoppingCart,
  Tag,
  BookOpen,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Activity,
  AlertTriangle,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/supabase";

interface DashboardStats {
  totalClients: number;
  totalProducts: number;
  totalOrders: number;
  totalCategories: number;
  totalCatalogs: number;
  totalRevenue: number;
  recentActivity: number;
  completionRate: number;
  // Trend data (comparing last 7 days vs previous 7 days)
  clientsTrend: { current: number; previous: number; percentage: number };
  productsTrend: { current: number; previous: number; percentage: number };
  ordersTrend: { current: number; previous: number; percentage: number };
  revenueTrend: { current: number; previous: number; percentage: number };
  // Additional metrics
  lowStockProducts: number;
  pendingOrders: number;
  activeCampaigns: number;
  completedOrdersToday: number;
}

export function DashboardOverviewStats() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["enhanced-dashboard-stats"],
    queryFn: async () => {
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const fourteenDaysAgo = new Date(
        now.getTime() - 14 * 24 * 60 * 60 * 1000
      );
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Get current totals
      const [
        clientsResult,
        productsResult,
        ordersResult,
        categoriesResult,
        catalogsResult,
        campaignsResult,
      ] = await Promise.all([
        supabase
          .from("client")
          .select("client_id, created_at", { count: "exact" }),
        supabase
          .from("item")
          .select("item_id, created_at, stock_quantity", { count: "exact" }),
        supabase
          .from("order")
          .select("order_id, total_amount, status, created_at", {
            count: "exact",
          })
          .gte("created_at", sevenDaysAgo.toISOString()),
        supabase
          .from("item_category")
          .select("category_id", { count: "exact", head: true }),
        supabase
          .from("catalog")
          .select("catalog_id", { count: "exact", head: true }),
        supabase
          .from("campaign")
          .select("campaign_id, status", { count: "exact" }),
      ]);

      // Get trend data (last 7 days vs previous 7 days)
      const [
        recentClients,
        previousClients,
        recentProducts,
        previousProducts,
        recentOrders,
        previousOrders,
        todayOrders,
      ] = await Promise.all([
        supabase
          .from("client")
          .select("client_id", { count: "exact", head: true })
          .gte("created_at", sevenDaysAgo.toISOString()),
        supabase
          .from("client")
          .select("client_id", { count: "exact", head: true })
          .gte("created_at", fourteenDaysAgo.toISOString())
          .lt("created_at", sevenDaysAgo.toISOString()),
        supabase
          .from("item")
          .select("item_id", { count: "exact", head: true })
          .gte("created_at", sevenDaysAgo.toISOString()),
        supabase
          .from("item")
          .select("item_id", { count: "exact", head: true })
          .gte("created_at", fourteenDaysAgo.toISOString())
          .lt("created_at", sevenDaysAgo.toISOString()),
        supabase
          .from("order")
          .select("order_id,status, total_amount", { count: "exact" })
          .gte("created_at", sevenDaysAgo.toISOString()),
        supabase
          .from("order")
          .select("order_id,status, total_amount", { count: "exact" })
          .gte("created_at", fourteenDaysAgo.toISOString())
          .lt("created_at", sevenDaysAgo.toISOString()),
        supabase
          .from("order")
          .select("order_id", { count: "exact", head: true })
          .gte("created_at", today.toISOString())
          .eq("status", "Delivered"),
      ]);

      // Calculate basic stats
      const totalClients = clientsResult.count || 0;
      const totalProducts = productsResult.count || 0;
      const totalOrders = ordersResult.count || 0;
      const totalCategories = categoriesResult.count || 0;
      const totalCatalogs = catalogsResult.count || 0;
      const totalRevenue =
        ordersResult.data?.reduce(
          (sum, order) =>
            order.status != "Pending" && order.status != "Cancelled"
              ? sum + (order.total_amount || 0)
              : sum,
          0
        ) || 0;
      const completedOrders =
        ordersResult.data?.filter((order) => order.status === "Delivered")
          .length || 0;
      const completionRate =
        totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0;

      // Calculate additional metrics
      const lowStockProducts =
        productsResult.data?.filter(
          (product) => (product.stock_quantity || 0) <= 10
        ).length || 0;
      const pendingOrders =
        ordersResult.data?.filter((order) => order.status === "Pending")
          .length || 0;
      const activeCampaigns =
        campaignsResult.data?.filter((campaign) => campaign.status === "Active")
          .length || 0;
      const completedOrdersToday = todayOrders.count || 0;

      // Calculate trends
      const calculateTrend = (current: number, previous: number) => {
        if (previous === 0)
          return { current, previous, percentage: current > 0 ? 100 : 0 };
        const percentage = Math.round(((current - previous) / previous) * 100);
        return { current, previous, percentage };
      };

      const clientsTrend = calculateTrend(
        recentClients.count || 0,
        previousClients.count || 0
      );
      const productsTrend = calculateTrend(
        recentProducts.count || 0,
        previousProducts.count || 0
      );
      const ordersTrend = calculateTrend(
        recentOrders.count || 0,
        previousOrders.count || 0
      );

      const recentRevenue =
        recentOrders.data?.reduce(
          (sum, order) =>
            order.status != "Pending" && order.status != "Cancelled"
              ? sum + (order.total_amount || 0)
              : sum,
          0
        ) || 0;
      const previousRevenue =
        previousOrders.data?.reduce(
          (sum, order) =>
            order.status != "Pending" && order.status != "Cancelled"
              ? sum + (order.total_amount || 0)
              : sum,
          0
        ) || 0;
      const revenueTrend = calculateTrend(recentRevenue, previousRevenue);
      console.log(recentRevenue, previousRevenue);

      const recentActivity =
        (recentClients.count || 0) +
        (recentOrders.count || 0) +
        (recentProducts.count || 0);

      return {
        totalClients,
        totalProducts,
        totalOrders,
        totalCategories,
        totalCatalogs,
        totalRevenue,
        recentActivity,
        completionRate,
        clientsTrend,
        productsTrend,
        ordersTrend,
        revenueTrend,
        lowStockProducts,
        pendingOrders,
        activeCampaigns,
        completedOrdersToday,
      };
    },
  });

  const TrendIndicator = ({
    trend,
  }: {
    trend: { percentage: number };
    isMonetary?: boolean;
  }) => {
    const isPositive = trend.percentage >= 0;
    const Icon = isPositive ? TrendingUp : TrendingDown;
    const colorClass = isPositive
      ? "text-emerald-500 dark:text-emerald-400"
      : "text-red-500 dark:text-red-400";

    return (
      <div className={`flex items-center gap-1 text-xs ${colorClass}`}>
        <Icon className="h-3 w-3" />
        <span>{Math.abs(trend.percentage)}%</span>
      </div>
    );
  };

  const statsCards = [
    {
      title: "Total Clients",
      value: stats?.totalClients || 0,
      icon: Users,
      description: "Registered customers",
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-950/50",
      trend: stats?.clientsTrend,
    },
    {
      title: "Total Products",
      value: stats?.totalProducts || 0,
      icon: Package,
      description: "Products in inventory",
      color: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-emerald-50 dark:bg-emerald-950/50",
      trend: stats?.productsTrend,
    },
    {
      title: "Total Orders",
      value: stats?.totalOrders || 0,
      icon: ShoppingCart,
      description: "Orders processed",
      color: "text-violet-600 dark:text-violet-400",
      bgColor: "bg-violet-50 dark:bg-violet-950/50",
      trend: stats?.ordersTrend,
    },
    {
      title: "Total Revenue",
      value: `$${(stats?.totalRevenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: DollarSign,
      description: "Total sales revenue (7 days)",
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-50 dark:bg-green-950/50",
      trend: stats?.revenueTrend,
      isMonetary: true,
    },
    {
      title: "Categories",
      value: stats?.totalCategories || 0,
      icon: Tag,
      description: "Product categories",
      color: "text-orange-600 dark:text-orange-400",
      bgColor: "bg-orange-50 dark:bg-orange-950/50",
    },
    {
      title: "Catalogs",
      value: stats?.totalCatalogs || 0,
      icon: BookOpen,
      description: "Product catalogs",
      color: "text-indigo-600 dark:text-indigo-400",
      bgColor: "bg-indigo-50 dark:bg-indigo-950/50",
    },
    {
      title: "Completion Rate",
      value: `${stats?.completionRate || 0}%`,
      icon: TrendingUp,
      description: "Order completion rate",
      color: "text-cyan-600 dark:text-cyan-400",
      bgColor: "bg-cyan-50 dark:bg-cyan-950/50",
      isPercentage: true,
    },
    {
      title: "Recent Activity",
      value: stats?.recentActivity || 0,
      icon: Activity,
      description: "New items (7 days)",
      color: "text-pink-600 dark:text-pink-400",
      bgColor: "bg-pink-50 dark:bg-pink-950/50",
    },
  ];

  const alertCards = [
    {
      title: "Low Stock Alert",
      value: stats?.lowStockProducts || 0,
      icon: AlertTriangle,
      description: "Products with ≤10 items",
      color: "text-red-600 dark:text-red-400",
      bgColor: "bg-red-50 dark:bg-red-950/50",
      isAlert: true,
    },
    {
      title: "Pending Orders",
      value: stats?.pendingOrders || 0,
      icon: ShoppingCart,
      description: "Orders awaiting processing (7 days)",
      color: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-50 dark:bg-amber-950/50",
      isAlert: true,
    },
    {
      title: "Active Campaigns",
      value: stats?.activeCampaigns || 0,
      icon: Activity,
      description: "Currently running",
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-950/50",
    },
    {
      title: "Today's Orders",
      value: stats?.completedOrdersToday || 0,
      icon: TrendingUp,
      description: "Completed today",
      color: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-emerald-50 dark:bg-emerald-950/50",
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
          {Array.from({ length: 8 }).map((_, i) => (
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
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
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Stats */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-foreground">
          Business Overview
        </h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statsCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card
                key={index}
                className="hover:shadow-md dark:hover:shadow-lg transition-shadow border-border"
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-2 rounded-full ${stat.bgColor}`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold text-foreground">
                      {stat.isMonetary || stat.isPercentage
                        ? stat.value
                        : typeof stat.value === "number"
                          ? stat.value.toLocaleString()
                          : stat.value}
                    </div>
                    {stat.trend && (
                      <TrendIndicator
                        trend={stat.trend}
                        isMonetary={stat.isMonetary}
                      />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Alert Cards */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-foreground">
          Quick Insights
        </h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {alertCards.map((stat, index) => {
            const Icon = stat.icon;
            const hasAlert = stat.isAlert && (stat.value || 0) > 0;
            return (
              <Card
                key={index}
                className={`hover:shadow-md dark:hover:shadow-lg transition-shadow border-border ${
                  hasAlert
                    ? "ring-2 ring-red-200 dark:ring-red-800 bg-red-50/50 dark:bg-red-950/20"
                    : ""
                }`}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-2 rounded-full ${stat.bgColor}`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground mb-1">
                    {(stat.value || 0).toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
