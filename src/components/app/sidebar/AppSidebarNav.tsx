"use client";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Link, useLocation, useRouter } from "@tanstack/react-router";

export function AppSidebarNav({
  title,
  items,
}: {
  title: string;
  items: {
    title: string;
    url: string;
    icon?: React.ElementType;
  }[];
}) {
  const Location = useLocation();
  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarGroupLabel>{title}</SidebarGroupLabel>
        <SidebarMenu>
          {items.map((item) => (
            <Link key={item.title} to={item.url}>
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  tooltip={item.title}
                  isActive={Location.pathname === item.url}
                >
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </Link>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
