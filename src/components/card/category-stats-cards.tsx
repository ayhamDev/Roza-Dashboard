"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tag, Package, Plus, TrendingUp, Hash, Layers } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/supabase";

interface CategoryStats {
  totalCategories: number;
  categoriesWithItems: number;
  emptyCategories: number;
  totalItemsAcrossCategories: number;
  recentlyCreated: number;
  averageItemsPerCategory: number;
}

export function CategoryStatsCards() {
  const { data: stats, isLoading } = useQuery<CategoryStats>({
    queryKey: ["category-stats"],
    queryFn: async () => {
      // Get all categories with item counts
      const { data: categoryData, error: categoryError } = await supabase.from(
        "item_category"
      ).select(`
          category_id,
          created_at,
          items:item(count)
        `);

      if (categoryError) throw categoryError;

      // Get recently created categories (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: recentData, error: recentError } = await supabase
        .from("item_category")
        .select("category_id")
        .gte("created_at", sevenDaysAgo.toISOString());

      if (recentError) throw recentError;

      const totalCategories = categoryData?.length || 0;
      const categoriesWithItems =
        categoryData?.filter((c) => (c.items as any)?.[0]?.count > 0).length ||
        0;
      const emptyCategories = totalCategories - categoriesWithItems;
      const totalItemsAcrossCategories =
        categoryData?.reduce(
          (sum, c) => sum + ((c.items as any)?.[0]?.count || 0),
          0
        ) || 0;
      const recentlyCreated = recentData?.length || 0;
      const averageItemsPerCategory =
        totalCategories > 0
          ? Math.round(totalItemsAcrossCategories / totalCategories)
          : 0;

      return {
        totalCategories,
        categoriesWithItems,
        emptyCategories,
        totalItemsAcrossCategories,
        recentlyCreated,
        averageItemsPerCategory,
      };
    },
  });

  const statsCards = [
    {
      title: "Total Categories",
      value: stats?.totalCategories || 0,
      icon: Tag,
      description: "All categories in system",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Categories with Items",
      value: stats?.categoriesWithItems || 0,
      icon: Package,
      description: "Categories containing products",
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Empty Categories",
      value: stats?.emptyCategories || 0,
      icon: Layers,
      description: "Categories without products",
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
    },
    {
      title: "Total Items",
      value: stats?.totalItemsAcrossCategories || 0,
      icon: Hash,
      description: "Items across all categories",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Recently Created",
      value: stats?.recentlyCreated || 0,
      icon: Plus,
      description: "Created in last 7 days",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      title: "Avg Items/Category",
      value: stats?.averageItemsPerCategory || 0,
      icon: TrendingUp,
      description: "Average items per category",
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
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
                {stat.value.toLocaleString()}
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
