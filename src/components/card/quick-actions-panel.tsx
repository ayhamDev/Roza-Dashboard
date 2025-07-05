"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSheet } from "@/context/sheets";
import {
  BookOpen,
  Package,
  Plus,
  Send,
  ShoppingCart,
  Tag,
  Users,
} from "lucide-react";

export function QuickActionsPanel() {
  const { openSheet } = useSheet();

  const quickActions = [
    {
      title: "Create Client",
      description: "Add a new customer",
      icon: Users,
      action: () => openSheet("client:create"),
      color: "bg-blue-50 hover:bg-blue-100 text-blue-700",
    },
    {
      title: "Add Product",
      description: "Create new product",
      icon: Package,
      action: () => openSheet("product:create"),
      color: "bg-green-50 hover:bg-green-100 text-green-700",
    },
    {
      title: "New Order",
      description: "Process an order",
      icon: ShoppingCart,
      action: () => openSheet("order:create"),
      color: "bg-purple-50 hover:bg-purple-100 text-purple-700",
    },
    {
      title: "Create Category",
      description: "Add product category",
      icon: Tag,
      action: () => openSheet("category:create"),
      color: "bg-orange-50 hover:bg-orange-100 text-orange-700",
    },
    {
      title: "New Catalog",
      description: "Create product catalog",
      icon: BookOpen,
      action: () => openSheet("catalog:create"),
      color: "bg-indigo-50 hover:bg-indigo-100 text-indigo-700",
    },
    {
      title: "Launch Campaign",
      description: "Start new campaign",
      icon: Send,
      action: () => openSheet("campaign:create"),
      color: "bg-pink-50 hover:bg-pink-100 text-pink-700",
    },
  ];

  // const utilityActions = [
  //   {
  //     title: "Export Data",
  //     description: "Download reports",
  //     icon: Download,
  //     action: () => console.log("Export data"),
  //     color: "bg-gray-50 hover:bg-gray-100 text-gray-700",
  //   },
  //   {
  //     title: "Import Data",
  //     description: "Bulk import items",
  //     icon: Upload,
  //     action: () => console.log("Import data"),
  //     color: "bg-gray-50 hover:bg-gray-100 text-gray-700",
  //   },
  //   {
  //     title: "Analytics",
  //     description: "View detailed reports",
  //     icon: BarChart3,
  //     action: () => console.log("Open analytics"),
  //     color: "bg-emerald-50 hover:bg-emerald-100 text-emerald-700",
  //   },
  //   {
  //     title: "Settings",
  //     description: "System configuration",
  //     icon: Settings,
  //     action: () => console.log("Open settings"),
  //     color: "bg-gray-50 hover:bg-gray-100 text-gray-700",
  //   },
  // ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 flex-wrap ">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Button
                  key={index}
                  variant="ghost"
                  className={`h-auto p-4 flex-1 min-w-max flex flex-col items-start gap-2 ${action.color}`}
                  onClick={action.action}
                >
                  <Icon className="h-5 w-5" />
                  <div className="text-left">
                    <div className="font-medium">{action.title}</div>
                    <div className="text-xs opacity-70">
                      {action.description}
                    </div>
                  </div>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
