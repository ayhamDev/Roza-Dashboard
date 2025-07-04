"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  Mail,
  Phone,
  MessageCircle,
  Plus,
  TrendingUp,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/supabase";

interface ClientStats {
  totalClients: number;
  clientsWithEmail: number;
  clientsWithPhone: number;
  clientsWithWhatsApp: number;
  recentlyAdded: number;
  completedProfiles: number;
}

export function ClientStatsCards() {
  const { data: stats, isLoading } = useQuery<ClientStats>({
    queryKey: ["client-stats"],
    queryFn: async () => {
      // Get all clients
      const { data: clientData, error: clientError } = await supabase
        .from("client")
        .select("client_id, email, phone, whatsapp_phone, created_at");

      if (clientError) throw clientError;

      // Get recently added clients (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: recentData, error: recentError } = await supabase
        .from("client")
        .select("client_id")
        .gte("created_at", sevenDaysAgo.toISOString());

      if (recentError) throw recentError;

      const totalClients = clientData?.length || 0;
      const clientsWithEmail =
        clientData?.filter((c) => c.email && c.email.trim() !== "").length || 0;
      const clientsWithPhone =
        clientData?.filter((c) => c.phone && c.phone.trim() !== "").length || 0;
      const clientsWithWhatsApp =
        clientData?.filter(
          (c) => c.whatsapp_phone && c.whatsapp_phone.trim() !== ""
        ).length || 0;
      const recentlyAdded = recentData?.length || 0;
      const completedProfiles =
        clientData?.filter(
          (c) =>
            c.email &&
            c.email.trim() !== "" &&
            ((c.phone && c.phone.trim() !== "") ||
              (c.whatsapp_phone && c.whatsapp_phone.trim() !== ""))
        ).length || 0;

      return {
        totalClients,
        clientsWithEmail,
        clientsWithPhone,
        clientsWithWhatsApp,
        recentlyAdded,
        completedProfiles,
      };
    },
  });

  const statsCards = [
    {
      title: "Total Clients",
      value: stats?.totalClients || 0,
      icon: Users,
      description: "All registered clients",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "With Email",
      value: stats?.clientsWithEmail || 0,
      icon: Mail,
      description: "Clients with email address",
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "With Phone",
      value: stats?.clientsWithPhone || 0,
      icon: Phone,
      description: "Clients with phone number",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "With WhatsApp",
      value: stats?.clientsWithWhatsApp || 0,
      icon: MessageCircle,
      description: "Clients with WhatsApp",
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
    {
      title: "Recently Added",
      value: stats?.recentlyAdded || 0,
      icon: Plus,
      description: "Added in last 7 days",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      title: "Complete Profiles",
      value: stats?.completedProfiles || 0,
      icon: TrendingUp,
      description: "Email + phone/WhatsApp",
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
