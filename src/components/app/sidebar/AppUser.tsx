"use client";

import { supabase } from "@/supabase";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { LogOut, MoreVertical } from "lucide-react";

export function AppUser() {
  const { isMobile } = useSidebar();
  const navigate = useNavigate();
  const [user, setUser] = useState<{
    name: string;
    email: string;
    avatar: string;
  } | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        const { user_metadata } = data.user;
        setUser({
          name: user_metadata.full_name || "User",
          email: data.user.email || "",
          avatar: user_metadata.avatar_url || "",
        });
      }
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/login", replace: true });
  };

  const loading = !user;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              {loading ? (
                <>
                  <Skeleton className="h-8 w-8 rounded-lg" />
                  <div className="grid flex-1 space-y-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <Skeleton className="ml-auto h-4 w-4" />
                </>
              ) : (
                <>
                  <Avatar className="h-8 w-8 rounded-lg grayscale">
                    <AvatarImage src={user.email} alt={user.email} />
                    <AvatarFallback className="rounded-lg">
                      {user.email?.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{user.email}</span>
                  </div>
                  <MoreVertical className="ml-auto" size={16} />
                </>
              )}
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          {!loading && (
            <DropdownMenuContent
              className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
              side={isMobile ? "bottom" : "right"}
              align="end"
              sideOffset={4}
            >
              {/* <DropdownMenuGroup>
                <DropdownMenuItem>
                  <UserCircle className="mr-2" size={16} />
                  Account
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <CreditCard className="mr-2" size={16} />
                  Billing
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Bell className="mr-2" size={16} />
                  Notifications
                </DropdownMenuItem>
              </DropdownMenuGroup> */}
              {/* <DropdownMenuSeparator /> */}
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2" size={16} />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          )}
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
