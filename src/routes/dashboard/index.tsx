"use client";

import { useBreadcrumbs } from "@/context/breadcrumpst";
import { createFileRoute } from "@tanstack/react-router";
import { useLayoutEffect } from "react";

import { DashboardOverviewStats } from "@/components/card/dashboard-overview-stats";
import { QuickActionsPanel } from "@/components/card/quick-actions-panel";
import { RecentActivityFeed } from "@/components/card/recent-activity-feed";
import { SystemAlerts } from "@/components/card/system-alerts";
import { DashboardCharts } from "@/components/chart/dashboard-charts";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Zap } from "lucide-react";

export const Route = createFileRoute("/dashboard/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { setBreadcrumbs } = useBreadcrumbs();

  useLayoutEffect(() => {
    setBreadcrumbs([
      {
        id: "dashboard",
        label: "Dashboard",
        href: "/dashboard",
        isActive: true,
      },
    ]);
  }, []);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between py-3 bg-background/20 backdrop-blur-xl md:px-8 px-4 min-h-[64px]">
        <div>
          <h1 className="text-2xl font-bold">Roza Business Analytics</h1>
          <p className="text-sm text-muted-foreground">
            Comprehensive overview of your Roza business performance and key
            metrics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="bg-blue-50 text-blue-700 border-blue-200"
          >
            <Zap className="h-3 w-3 mr-1" />
            Real-time Data
          </Badge>
        </div>
      </div>

      <div className="md:px-8 px-4 space-y-8">
        {/* Enhanced Stats with Trends */}
        <DashboardOverviewStats />

        {/* Charts Section */}
        <div>
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="h-5 w-5" />
            <h2 className="text-xl font-semibold">Performance Analytics</h2>
          </div>
          <DashboardCharts />
        </div>

        {/* Activity and Actions */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <RecentActivityFeed />
          </div>
          <div className="space-y-6">
            <QuickActionsPanel />

            <SystemAlerts />
          </div>
        </div>
      </div>
    </div>
  );
}
