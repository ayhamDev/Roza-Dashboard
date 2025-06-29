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

const AppBreadcrumbs = () => {
  const { breadcrumbs } = useBreadcrumbs();

  return (
    <header className="w-full px-6 py-3 mb-4 backdrop-blur-md shadow-md bg-sidebar border-b border-sidebar-border flex items-center gap-4">
      <SidebarTrigger />
      <Breadcrumb>
        <BreadcrumbList>
          {breadcrumbs.map((item, index) => (
            <React.Fragment key={item.id}>
              <BreadcrumbItem>
                {item.isActive ? (
                  <BreadcrumbPage>{item.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink href={item.href ?? "#"}>
                    {item.label}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {index < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
            </React.Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    </header>
  );
};

export default AppBreadcrumbs;
