"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { Database } from "@/interface/database.types";
import { generateRoseColor, getRoseChartColor } from "@/lib/smart-colors";
import { supabase } from "@/supabase";
import { useQuery } from "@tanstack/react-query";
import { format, subDays } from "date-fns";
import {
  DollarSign,
  Package,
  ShoppingCart,
  TrendingUp,
  Truck,
  Users,
} from "lucide-react";
import { log } from "node:console";
import React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Label,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";

// Type for order status from database
type OrderStatus = Database["public"]["Enums"]["order_status"];

// Smart rose-based chart configuration
const chartConfig = {
  revenue: {
    label: "Revenue",
    color: getRoseChartColor("revenue"),
  },
  orders: {
    label: "Orders",
    color: getRoseChartColor("orders"),
  },
  customers: {
    label: "Customers",
    color: getRoseChartColor("customers"),
  },
} satisfies ChartConfig;

const stockChartConfig = {
  stock: {
    label: "Stock",
    color: getRoseChartColor("primary"),
  },
} satisfies ChartConfig;

const orderChartConfig = {
  orders: {
    label: "Orders",
  },
  Pending: {
    label: "Pending",
    color: getRoseChartColor("Pending"),
  },
  Confirmed: {
    label: "Confirmed",
    color: getRoseChartColor("Confirmed"),
  },
  Shipped: {
    label: "Shipped",
    color: getRoseChartColor("Shipped"),
  },
  Delivered: {
    label: "Delivered",
    color: getRoseChartColor("Delivered"),
  },
  Cancelled: {
    label: "Cancelled",
    color: getRoseChartColor("Cancelled"),
  },
} satisfies ChartConfig;

// Custom tooltip component for stock chart
const StockTooltipContent = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="rounded-lg border bg-background p-3 shadow-md">
        <div className="grid gap-2">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-foreground">
              {data.category}
            </span>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: data.fill }}
              />
              <span>Stock Level</span>
            </div>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-muted-foreground">
              Items in stock:
            </span>
            <span className="text-sm font-bold text-foreground">
              {data.stock.toLocaleString()} units
            </span>
          </div>
          <div className="text-xs text-muted-foreground">
            Category represents{" "}
            {((data.stock / payload[0].payload.totalStock) * 100).toFixed(1)}%
            of total inventory
          </div>
        </div>
      </div>
    );
  }
  return null;
};

// Custom tooltip component for order status chart
const OrderStatusTooltipContent = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const total = payload[0].payload.totalOrders || 0;
    const percentage =
      total > 0 ? ((data.orders / total) * 100).toFixed(1) : "0";

    // Status descriptions and icons
    const statusInfo: Record<string, { description: string; icon: string }> = {
      Pending: {
        description: "Awaiting confirmation",
        icon: "⏳",
      },
      Confirmed: {
        description: "Order confirmed, preparing",
        icon: "✅",
      },
      Shipped: {
        description: "In transit to customer",
        icon: "🚚",
      },
      Delivered: {
        description: "Successfully completed",
        icon: "📦",
      },
      Cancelled: { description: "Order cancelled", icon: "❌" },
    };

    const info = statusInfo[data.status] || {
      description: "Unknown status",
      icon: "❓",
      priority: 0,
    };

    return (
      <div className="rounded-lg border bg-background p-4 shadow-lg min-w-[200px]">
        <div className="grid gap-3">
          {/* Header with status and icon */}
          <div className="flex items-center gap-2">
            <span className="text-lg">{info.icon}</span>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-foreground">
                {data.status} Orders
              </span>
              <span className="text-xs text-muted-foreground">
                {info.description}
              </span>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-border" />

          {/* Statistics */}
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Order count:
              </span>
              <span className="text-sm font-bold text-foreground">
                {data.orders.toLocaleString()}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Percentage:</span>
              <span className="text-sm font-bold text-foreground">
                {percentage}%
              </span>
            </div>
          </div>

          {/* Color indicator */}
          <div className="flex items-center gap-2 pt-1">
            <div
              className="h-3 w-3 rounded-full border"
              style={{ backgroundColor: data.fill }}
            />
            <span className="text-xs text-muted-foreground">
              Chart color indicator
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export function DashboardCharts() {
  const [activeChart, setActiveChart] = React.useState<
    "revenue" | "orders" | "customers"
  >("revenue");
  const [isDarkMode, setIsDarkMode] = React.useState(false);

  // Detect dark mode
  React.useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains("dark"));
    };

    checkDarkMode();

    // Watch for theme changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  // Fetch revenue/orders data for the last 30 days
  const { data: revenueData = [], isLoading: revenueLoading } = useQuery({
    queryKey: ["dashboard-revenue"],
    queryFn: async () => {
      const thirtyDaysAgo = format(subDays(new Date(), 30), "yyyy-MM-dd");

      const { data, error } = await supabase
        .from("order")
        .select(
          `
          created_at,
          total_amount,
          client_id
        `
        )
        .gte("created_at", thirtyDaysAgo)
        .neq("status", "Pending")
        .order("created_at", { ascending: true });
      console.log(data, error);

      if (error) throw error;

      // Group by date
      const groupedData = data.reduce((acc: any, order) => {
        const date = format(new Date(order.created_at), "yyyy-MM-dd");
        if (!acc[date]) {
          acc[date] = {
            date,
            revenue: 0,
            orders: 0,
            customers: new Set(),
          };
        }
        acc[date].revenue += order.total_amount || 0;
        acc[date].orders += 1;
        acc[date].customers.add(order.client_id);
        return acc;
      }, {});

      return Object.values(groupedData).map((item: any) => ({
        ...item,
        customers: item.customers.size,
      }));
    },
  });

  // Fetch stock by category data
  const { data: stockData = [], isLoading: stockLoading } = useQuery({
    queryKey: ["dashboard-stock"],
    queryFn: async () => {
      const { data, error } = await supabase.from("item").select(
        `
          stock_quantity,
          item_category!inner(name)
        `
      );

      if (error) throw error;

      // Group by category and assign smart rose colors
      const groupedData = data.reduce((acc: any, item) => {
        const categoryName = item.item_category?.name || "Other";
        if (!acc[categoryName]) {
          acc[categoryName] = {
            category: categoryName,
            stock: 0,
          };
        }
        acc[categoryName].stock += item.stock_quantity || 0;
        return acc;
      }, {});

      // Convert to array and assign smart rose colors
      const categories = Object.values(groupedData).slice(0, 5);
      const totalStock = categories.reduce(
        (sum: number, item: any) => sum + item.stock,
        0
      );

      return categories.map((item: any, index: number) => ({
        ...item,
        fill: generateRoseColor(index, categories.length, isDarkMode),
        totalStock, // Add total for percentage calculation in tooltip
      }));
    },
  });

  // Fetch order status data using proper enum types
  const { data: orderStatusData = [], isLoading: orderStatusLoading } =
    useQuery({
      queryKey: ["dashboard-order-status"],
      queryFn: async () => {
        const { data, error } = await supabase.from("order").select("status");

        if (error) throw error;

        // Group by status using proper enum values
        const groupedData = data.reduce((acc: any, order) => {
          const status: OrderStatus = order.status || "Pending";
          if (!acc[status]) {
            acc[status] = {
              status,
              orders: 0,
            };
          }
          acc[status].orders += 1;
          return acc;
        }, {});

        // Convert to array and assign smart rose colors using exact enum values
        return Object.entries(groupedData).map(
          ([status, data]: [string, any]) => ({
            ...data,
            fill: getRoseChartColor(status, isDarkMode),
            totalOrders: Object.values(groupedData).reduce(
              (sum: number, item: any) => sum + item.orders,
              0
            ),
          })
        );
      },
    });

  const revenueGrowth = React.useMemo(() => {
    if (revenueData.length < 2) return "0";
    const firstDay = revenueData[0]?.revenue || 0;
    const lastDay = revenueData[revenueData.length - 1]?.revenue || 0;
    if (firstDay === 0) return "0";
    return (((lastDay - firstDay) / firstDay) * 100).toFixed(1);
  }, [revenueData]);

  const totalOrders = React.useMemo(() => {
    return orderStatusData.reduce(
      (acc: number, curr: any) => acc + curr.orders,
      0
    );
  }, [orderStatusData]);

  const getChartInfo = (chart: "revenue" | "orders" | "customers") => {
    const configs = {
      revenue: {
        title: "Revenue Analytics",
        description: "Daily revenue performance and growth trends",
        icon: DollarSign,
      },
      orders: {
        title: "Order Analytics",
        description: "Daily order volume and processing trends",
        icon: ShoppingCart,
      },
      customers: {
        title: "Customer Analytics",
        description: "Daily customer acquisition and engagement metrics",
        icon: Users,
      },
    };
    return configs[chart];
  };

  const currentChartInfo = getChartInfo(activeChart);

  if (revenueLoading || stockLoading || orderStatusLoading) {
    return (
      <div className="space-y-6">
        <Card className="w-full">
          <CardContent className="flex items-center justify-center h-[400px]">
            <div className="text-muted-foreground">
              Loading dashboard data...
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Revenue Analytics Chart - Interactive */}
      <Card className="w-full">
        <CardHeader className="flex flex-col items-stretch border-b !p-0 sm:flex-row">
          <div className="flex flex-1 flex-col justify-center gap-1 px-6 pt-4 pb-3 sm:!py-0">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <currentChartInfo.icon className="h-4 w-4 sm:h-5 sm:w-5" />
              Last Month {currentChartInfo.title}
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              {currentChartInfo.description}
            </CardDescription>
          </div>
          <div className="flex">
            {(["revenue", "orders", "customers"] as const).map((key) => {
              const config = {
                revenue: {
                  label: "Revenue",
                  format: (val: number) =>
                    val < 1000 ? `$${val}` : `$${(val / 1000).toFixed(0)}k`,
                },
                orders: {
                  label: "Orders",
                  format: (val: number) => val.toLocaleString(),
                },
                customers: {
                  label: "Customers",
                  format: (val: number) => val.toLocaleString(),
                },
              };
              const total = revenueData.reduce(
                (acc: number, curr: any) => acc + (curr[key] || 0),
                0
              );
              console.log(total);

              return (
                <button
                  key={key}
                  data-active={activeChart === key}
                  className="data-[active=true]:bg-muted/50 relative z-30 flex flex-1 flex-col justify-center gap-1 border-t px-4 py-3 text-left even:border-l sm:border-t-0 sm:border-l sm:px-6 sm:py-4"
                  onClick={() => setActiveChart(key)}
                >
                  <span className="text-muted-foreground text-xs">
                    {config[key].label}
                  </span>
                  <span className="text-sm leading-none font-bold sm:text-xl">
                    {config[key].format(total)}
                  </span>
                </button>
              );
            })}
          </div>
        </CardHeader>
        <CardContent className="px-2 sm:p-6">
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[350px] sm:h-[400px] lg:h-[450px] w-full"
          >
            <BarChart
              accessibilityLayer
              data={revenueData}
              margin={{
                left: 12,
                right: 12,
              }}
            >
              <CartesianGrid vertical={false} className="stroke-border" />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                className="text-muted-foreground"
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return date.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  });
                }}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => {
                      return new Date(value).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      });
                    }}
                  />
                }
              />
              <Bar
                dataKey={activeChart}
                fill={getRoseChartColor(activeChart, isDarkMode)}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-4">
            <Badge
              variant="outline"
              className="text-green-600 border-green-200 bg-green-50 w-fit dark:text-green-400 dark:border-green-800 dark:bg-green-950"
            >
              <TrendingUp className="h-3 w-3 mr-1" />+{revenueGrowth}% growth
            </Badge>
            <span className="text-xs sm:text-sm text-muted-foreground">
              Last 30 days performance
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Bottom Row - Stock and Order Status Charts */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Stock by Category Chart */}
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Stock by Category
            </CardTitle>
            <CardDescription>
              Current inventory levels across categories
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="px-6 pb-6">
              <ChartContainer
                config={stockChartConfig}
                className="h-[280px] w-full"
              >
                <BarChart
                  accessibilityLayer
                  data={stockData}
                  layout="vertical"
                  margin={{
                    left: 5,
                    right: 5,
                    top: 5,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid horizontal={false} className="stroke-border" />
                  <YAxis
                    dataKey="category"
                    type="category"
                    tickLine={false}
                    tickMargin={6}
                    axisLine={false}
                    width={70}
                    fontSize={10}
                    className="text-muted-foreground"
                    tickFormatter={(value) => {
                      return value.length > 8
                        ? `${value.substring(0, 8)}...`
                        : value;
                    }}
                  />
                  <XAxis dataKey="stock" type="number" hide />
                  <ChartTooltip
                    cursor={false}
                    content={<StockTooltipContent />}
                  />
                  <Bar dataKey="stock" radius={[0, 3, 3, 0]} maxBarSize={35} />
                </BarChart>
              </ChartContainer>
            </div>
          </CardContent>
          <CardFooter className="flex-col items-start gap-2 text-sm pt-0">
            <div className="flex gap-2 leading-none font-medium">
              <TrendingUp className="h-4 w-4" />
              Stock levels optimized
            </div>
            <div className="text-muted-foreground leading-none">
              Total items:{" "}
              {stockData
                .reduce((acc: number, curr: any) => acc + curr.stock, 0)
                .toLocaleString()}
            </div>
          </CardFooter>
        </Card>

        {/* Order Status Chart */}
        <Card className="flex flex-col">
          <CardHeader className="items-center pb-0">
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Order Status
            </CardTitle>
            <CardDescription>
              Current order distribution by status
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 pb-0">
            <ChartContainer
              config={orderChartConfig}
              className="mx-auto aspect-square max-h-[280px]"
            >
              <PieChart>
                <ChartTooltip
                  cursor={false}
                  content={<OrderStatusTooltipContent />}
                />
                <Pie
                  data={orderStatusData}
                  dataKey="orders"
                  nameKey="status"
                  innerRadius={50}
                  strokeWidth={2}
                  stroke="hsl(var(--background))"
                >
                  <Label
                    content={({ viewBox }) => {
                      if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                        return (
                          <text
                            x={viewBox.cx}
                            y={viewBox.cy}
                            textAnchor="middle"
                            dominantBaseline="middle"
                          >
                            <tspan
                              x={viewBox.cx}
                              y={viewBox.cy}
                              className="fill-foreground text-2xl font-bold"
                            >
                              {totalOrders.toLocaleString()}
                            </tspan>
                            <tspan
                              x={viewBox.cx}
                              y={(viewBox.cy || 0) + 20}
                              className="fill-muted-foreground text-sm"
                            >
                              Orders
                            </tspan>
                          </text>
                        );
                      }
                    }}
                  />
                </Pie>
              </PieChart>
            </ChartContainer>
          </CardContent>
          <CardFooter className="flex-col gap-2 text-sm">
            <div className="text-muted-foreground leading-none">
              Real-time order status tracking
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
