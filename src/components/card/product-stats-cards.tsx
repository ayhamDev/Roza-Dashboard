"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Package,
  CheckCircle,
  AlertTriangle,
  Eye,
  EyeOff,
  DollarSign,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/supabase";

interface ProductStats {
  totalProducts: number;
  inStockProducts: number;
  outOfStockProducts: number;
  visibleProducts: number;
  hiddenProducts: number;
  totalInventoryValue: number;
}

export function ProductStatsCards() {
  const { data: stats, isLoading } = useQuery<ProductStats>({
    queryKey: ["product-stats"],
    queryFn: async () => {
      // Get all products with stock and visibility info
      const { data: productData, error: productError } = await supabase
        .from("item")
        .select("item_id, stock_quantity, is_catalog_visible, cost_price");

      if (productError) throw productError;

      const totalProducts = productData?.length || 0;
      const inStockProducts =
        productData?.filter((p) => (p.stock_quantity || 0) > 0).length || 0;
      const outOfStockProducts =
        productData?.filter((p) => (p.stock_quantity || 0) === 0).length || 0;
      const visibleProducts =
        productData?.filter((p) => p.is_catalog_visible === true).length || 0;
      const hiddenProducts =
        productData?.filter((p) => p.is_catalog_visible === false).length || 0;
      const totalInventoryValue =
        productData?.reduce((sum, p) => {
          const quantity = p.stock_quantity || 0;
          const price = p.cost_price || 0;
          return sum + quantity * price;
        }, 0) || 0;

      return {
        totalProducts,
        inStockProducts,
        outOfStockProducts,
        visibleProducts,
        hiddenProducts,
        totalInventoryValue,
      };
    },
  });

  const statsCards = [
    {
      title: "Total Products",
      value: stats?.totalProducts || 0,
      icon: Package,
      description: "All products in system",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "In Stock",
      value: stats?.inStockProducts || 0,
      icon: CheckCircle,
      description: "Products available",
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Out of Stock",
      value: stats?.outOfStockProducts || 0,
      icon: AlertTriangle,
      description: "Products unavailable",
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
    {
      title: "Visible Products",
      value: stats?.visibleProducts || 0,
      icon: Eye,
      description: "Shown in catalog",
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
    {
      title: "Hidden Products",
      value: stats?.hiddenProducts || 0,
      icon: EyeOff,
      description: "Hidden from catalog",
      color: "text-gray-600",
      bgColor: "bg-gray-50",
    },
    {
      title: "Inventory Value",
      value: `$${(stats?.totalInventoryValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: DollarSign,
      description: "Total inventory worth",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      isMonetary: true,
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
