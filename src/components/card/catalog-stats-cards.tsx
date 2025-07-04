"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BookOpen,
  Package,
  TrendingUp,
  FileEdit,
  Eye,
  EyeOff,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/supabase";

interface CatalogStats {
  totalCatalogs: number;
  activeCatalogs: number;
  draftCatalogs: number;
  disabledCatalogs: number;
  totalItems: number;
  recentlyUpdated: number;
}

export function CatalogStatsCards() {
  const { data: stats, isLoading } = useQuery<CatalogStats>({
    queryKey: ["catalog-stats"],
    queryFn: async () => {
      // Get catalog counts by status
      const { data: catalogData, error: catalogError } = await supabase
        .from("catalog")
        .select("status, catalog_id");

      if (catalogError) throw catalogError;

      // Get total items count across all catalogs
      const { data: itemsData, error: itemsError } = await supabase
        .from("catalog_transitions")
        .select("catalog_id", { count: "exact" });

      if (itemsError) throw itemsError;

      // Get recently updated catalogs (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: recentData, error: recentError } = await supabase
        .from("catalog")
        .select("catalog_id")
        .gte("updated_at", sevenDaysAgo.toISOString());

      if (recentError) throw recentError;

      const totalCatalogs = catalogData?.length || 0;
      const activeCatalogs =
        catalogData?.filter((c) => c.status === "enabled").length || 0;
      const draftCatalogs =
        catalogData?.filter((c) => c.status === "draft").length || 0;
      const disabledCatalogs =
        catalogData?.filter((c) => c.status === "disabled").length || 0;
      const totalItems = itemsData?.length || 0;
      const recentlyUpdated = recentData?.length || 0;

      return {
        totalCatalogs,
        activeCatalogs,
        draftCatalogs,
        disabledCatalogs,
        totalItems,
        recentlyUpdated,
      };
    },
  });

  const statsCards = [
    {
      title: "Total Catalogs",
      value: stats?.totalCatalogs || 0,
      icon: BookOpen,
      description: "All catalogs in system",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Active Catalogs",
      value: stats?.activeCatalogs || 0,
      icon: Eye,
      description: "Currently enabled",
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Draft Catalogs",
      value: stats?.draftCatalogs || 0,
      icon: FileEdit,
      description: "In draft status",
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
    },
    {
      title: "Disabled Catalogs",
      value: stats?.disabledCatalogs || 0,
      icon: EyeOff,
      description: "Currently disabled",
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
    {
      title: "Total Items",
      value: stats?.totalItems || 0,
      icon: Package,
      description: "Items across all catalogs",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Recently Updated",
      value: stats?.recentlyUpdated || 0,
      icon: TrendingUp,
      description: "Updated in last 7 days",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
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
