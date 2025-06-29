"use client";

import * as React from "react";
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  Tags,
  BookOpen,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { AppUser } from "./AppUser";
import { AppSidebarNav } from "./AppSidebarNav";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              {/* Add your logo or button content here */}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
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
            },
          ]}
        />
        <AppSidebarNav
          title="Stock Management"
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
          title="Catalogs Management"
          items={[
            {
              title: "Catalogs",
              url: "/dashboard/catalog",
              icon: BookOpen, // 📖 Represents a catalog
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
