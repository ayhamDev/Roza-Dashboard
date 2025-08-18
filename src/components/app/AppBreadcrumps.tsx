"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useBreadcrumbs } from "@/context/breadcrumpst";
import React from "react";
import { SidebarTrigger } from "../ui/sidebar";
import { Link } from "@tanstack/react-router";
import { AppThemeToggle } from "./AppThemeToggle";

const AppBreadcrumbs = () => {
  const { breadcrumbs } = useBreadcrumbs();

  return (
    <header className="w-full md:px-8 px-4 py-3 mb-0 backdrop-blur-xl  bg-background/20 border-b border-sidebar-border  z-[20] sticky top-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <Breadcrumb>
            <BreadcrumbList>
              {breadcrumbs.map((item, index) => (
                <React.Fragment key={item.id}>
                  <BreadcrumbItem>
                    {item.isActive ? (
                      <BreadcrumbPage>{item.label}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink href={item.href ?? "#"} asChild>
                        <Link to={item.href ?? "#"}>{item.label}</Link>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                  {index < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
                </React.Fragment>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <AppThemeToggle />
      </div>
    </header>
  );
};

export default AppBreadcrumbs;
