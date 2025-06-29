import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { type RowActionsProps } from "@/interface/RowAction.interface";
import { MoreHorizontal } from "lucide-react";

export function DataTableRowActions<TData>({
  row,
  actions,
}: RowActionsProps<TData>) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <Separator className="mb-1" />
        {actions.map((item, index) => {
          if (item.isSeparator) {
            return <DropdownMenuSeparator key={`sep-${index}`} />;
          }
          return (
            <DropdownMenuItem
              key={item.label}
              onClick={() => item.action(row)} // Pass the row to the action function
            >
              {item.icon && <item.icon className="mr-2 h-4 w-4" />}{" "}
              {/* Render icon if provided */}
              {item.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
