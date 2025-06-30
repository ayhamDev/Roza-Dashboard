"use client";

import { Badge } from "@/components/ui/badge";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Link, useLocation } from "@tanstack/react-router";

export function AppSidebarNav({
  title,
  items,
}: {
  title: string;
  items: {
    title: string;
    url: string;
    icon?: React.ElementType;
    badge?: string | number | undefined | null;
  }[];
}) {
  const Location = useLocation();
  const { state } = useSidebar();

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarGroupLabel>{title}</SidebarGroupLabel>
        <SidebarMenu className="gap-2">
          {items.map((item) => (
            <Link key={item.title} to={item.url}>
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  tooltip={item.title}
                  isActive={Location.pathname === item.url}
                  size={state == "expanded" ? "lg" : "default"}
                  className="pl-5"
                >
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                  {!!item.badge && (
                    <SidebarMenuBadge>
                      <Badge className="font-black">{item.badge}</Badge>
                    </SidebarMenuBadge>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </Link>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
