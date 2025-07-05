import { Badge } from "@/components/ui/badge";
import {
  Clock,
  CheckCircle,
  Truck,
  Package,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

type OrderStatus =
  | "Pending"
  | "Confirmed"
  | "Shipped"
  | "Delivered"
  | "Cancelled";

interface StatusBadgeProps {
  status: OrderStatus;
  border?: boolean;
  className?: string;
}
export const statusConfig = {
  Pending: {
    icon: Clock,
    label: "Pending",
    variant: "secondary" as const,
    className:
      "bg-yellow-100 text-yellow-900 border-yellow-200 hover:bg-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-900",
  },
  Confirmed: {
    icon: CheckCircle,
    label: "Confirmed",
    variant: "secondary" as const,
    className:
      "bg-blue-100 text-blue-900 border-blue-200 hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900",
  },
  Shipped: {
    icon: Truck,
    label: "Shipped",
    variant: "secondary" as const,
    className:
      "bg-purple-100 text-purple-900 border-purple-200 hover:bg-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-900",
  },
  Delivered: {
    icon: Package,
    label: "Delivered",
    variant: "secondary" as const,
    className:
      "bg-green-100 text-green-900 border-green-200 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900",
  },
  Cancelled: {
    icon: XCircle,
    label: "Cancelled",
    variant: "secondary" as const,
    className:
      "bg-red-100 text-red-900 border-red-200 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900",
  },
};

export function AppStatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || {
    icon: AlertCircle,
    label: status,
    variant: "outline" as const,
    className: "bg-gray-100 text-gray-900 border-gray-200",
  };

  const Icon = config.icon;

  return (
    <Badge
      variant={config.variant}
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium transition-colors",
        config.className,
        className
      )}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}
