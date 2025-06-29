import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { type Table as TableType } from "@tanstack/react-table";
import { MoreVertical } from "lucide-react";
import { Separator } from "../ui/separator";
import { Badge } from "../ui/badge";
import { type IDataTableAction } from ".";

// Define the type for the action

// Define the interface for the props
interface DataTableGlobalActionsProps<TData> {
  table: TableType<TData>;
  actions: IDataTableAction[]; // Dynamic actions passed from the parent
}

export default function DataTableGlobalActions<TData>({
  table,
  actions,
}: DataTableGlobalActionsProps<TData>) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="relative">
          <MoreVertical className="h-4 w-4" />
          <span className="hidden md:block">Bulk Actions</span>
          {table.getSelectedRowModel().rows.length ? (
            <Badge
              className="absolute top-[-10px] left-[-15px] animate-bounce"
              variant={"default"}
            >
              {table.getSelectedRowModel().rows.length}
            </Badge>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <Separator className="mb-1" />
        {actions.map((action, index) => (
          <DropdownMenuItem key={index} onClick={action.onClick}>
            {action.icon} {action.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
