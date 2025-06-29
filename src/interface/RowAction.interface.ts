import { type LucideIcon } from "lucide-react";
import { type Row } from "@tanstack/react-table";

type ActionItem<TData> = {
  label: string;
  icon?: LucideIcon;
  action: (row: Row<TData>) => void;
  isSeparator?: false; // Explicitly false or undefined
};

type SeparatorItem = {
  isSeparator: true;
  // No other properties needed for a separator
  label?: never;
  icon?: never;
  action?: never;
};

export type RowActionItem<TData> = ActionItem<TData> | SeparatorItem;

export interface RowActionsProps<TData> {
  row: Row<TData>;
  actions: RowActionItem<TData>[];
}
