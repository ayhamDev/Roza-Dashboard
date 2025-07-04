"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/supabase";
import { useQuery } from "@tanstack/react-query";
import { Users, Send, CheckCircle, Target } from "lucide-react";

interface CampaignStats {
  total_campaigns: number;
  active_campaigns: number;
  completed_campaigns: number;
  draft_campaigns: number;
  total_recipients: number;
  email_campaigns: number;
  whatsapp_campaigns: number;
  both_campaigns: number;
}

export function CampaignStatsCards() {
  const { data: stats, isLoading } = useQuery<CampaignStats>({
    queryKey: ["campaign-stats"],
    queryFn: async () => {
      const { data: campaigns, error } = await supabase
        .from("campaign")
        .select("status, delivery_method, total_recipients");

      if (error) throw error;

      const total_campaigns = campaigns.length;
      const active_campaigns = campaigns.filter(
        (c) => c.status === "active"
      ).length;
      const completed_campaigns = campaigns.filter(
        (c) => c.status === "completed"
      ).length;
      const draft_campaigns = campaigns.filter(
        (c) => c.status === "draft"
      ).length;
      const total_recipients = campaigns.reduce(
        (sum, c) => sum + (c.total_recipients || 0),
        0
      );
      const email_campaigns = campaigns.filter(
        (c) => c.delivery_method === "email"
      ).length;
      const whatsapp_campaigns = campaigns.filter(
        (c) => c.delivery_method === "whatsapp"
      ).length;
      const both_campaigns = campaigns.filter(
        (c) => c.delivery_method === "both"
      ).length;

      return {
        total_campaigns,
        active_campaigns,
        completed_campaigns,
        draft_campaigns,
        total_recipients,
        email_campaigns,
        whatsapp_campaigns,
        both_campaigns,
      };
    },
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-muted rounded w-3/4"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
          <Target className="h-6 w-6 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats?.total_campaigns || 0}
          </div>
          <p className="text-xs text-muted-foreground">All campaigns created</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Active Campaigns
          </CardTitle>
          <Send className="h-6 w-6 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {stats?.active_campaigns || 0}
          </div>
          <p className="text-xs text-muted-foreground">Currently running</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Completed</CardTitle>
          <CheckCircle className="h-6 w-6 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            {stats?.completed_campaigns || 0}
          </div>
          <p className="text-xs text-muted-foreground">
            Successfully completed
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Total Recipients
          </CardTitle>
          <Users className="h-6 w-6 text-purple-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-600">
            {stats?.total_recipients || 0}
          </div>
          <p className="text-xs text-muted-foreground">Across all campaigns</p>
        </CardContent>
      </Card>
    </div>
  );
}
