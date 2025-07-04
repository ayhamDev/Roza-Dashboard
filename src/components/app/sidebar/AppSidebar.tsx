"use client";

import {
  BookOpen,
  LayoutDashboard,
  Megaphone,
  Package,
  ShoppingCart,
  Speaker,
  Tags,
  Users,
} from "lucide-react";
import * as React from "react";
import logo from "@/assets/Rozalogo.svg";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import { supabase } from "@/supabase";
import { useQuery } from "@tanstack/react-query";
import { AppSidebarNav } from "./AppSidebarNav";
import { AppUser } from "./AppUser";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: OrdersCount } = useQuery<number | null>({
    queryKey: ["order", "status:pending"],
    refetchInterval: 10 * 1000,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("order")
        .select("", { count: "exact", head: true }) // Don't fetch any data
        .eq("status", "Pending");

      if (error) throw error;

      return count; // No data, just count
    },
  });

  const { state } = useSidebar();
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        {state == "expanded" && (
          <img
            src={logo}
            alt=""
            className="w-[150px] m-auto py-4 select-none "
          />
        )}
        {/* Add your logo or button content here */}
      </SidebarHeader>
      <SidebarContent>
        <AppSidebarNav
          title="Dashboard"
          items={[
            {
              title: "Home",
              url: "/dashboard",
              icon: LayoutDashboard,
            },
          ]}
        />
        <AppSidebarNav
          title="Sales Management"
          items={[
            {
              title: "Clients",
              url: "/dashboard/client",
              icon: Users, // 👥 Represents a group of people (clients)
            },
            {
              title: "Orders",
              url: "/dashboard/order",
              icon: ShoppingCart, // 🛒 Represents orders
              badge: OrdersCount,
            },
          ]}
        />
        <AppSidebarNav
          title="Inventory Management"
          items={[
            {
              title: "Products",
              url: "/dashboard/product",
              icon: Package, // 📦 Represents product packages
            },
            {
              title: "Categories",
              url: "/dashboard/category",
              icon: Tags, // 🏷️ Represents item tags/categories
            },
          ]}
        />
        <AppSidebarNav
          title="Distribution Management"
          items={[
            {
              title: "Catalogs",
              url: "/dashboard/catalog",
              icon: BookOpen, // 📖 Represents a catalog
            },
            {
              title: "Campaign",
              url: "/dashboard/campaign",
              icon: Megaphone,
            },
          ]}
        />
      </SidebarContent>
      <SidebarFooter>
        <AppUser
          user={{
            avatar: "https://github.com/shadcn.png",
            email: "tM8Yv@example.com",
            name: "Shadcn",
          }}
        />
      </SidebarFooter>
    </Sidebar>
  );
}
