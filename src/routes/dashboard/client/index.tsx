import AppCopyButton from "@/components/app/AppCopyButton";
import { ClientStatsCards } from "@/components/card/client-stats-cards";
import { DataTable } from "@/components/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { DataTableRowActions } from "@/components/data-table/data-table-row-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { useBreadcrumbs } from "@/context/breadcrumpst";
import { useSheet } from "@/context/sheets";
import { useTable } from "@/hooks/use-table";
import type { Database } from "@/interface/database.types";
import type { IPaginationResponse } from "@/interface/PaginationProps.interface";
import type { RowActionItem } from "@/interface/RowAction.interface";
import {
  buildPaginationResponse,
  parsePageParam,
  toRange,
} from "@/lib/pagination";
import { supabase } from "@/supabase";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import {
  Calendar,
  Delete,
  Edit,
  Eye,
  Hash,
  Mail,
  MessageCircle,
  Phone,
  Plus,
  User,
} from "lucide-react";
import { useLayoutEffect, useMemo } from "react";

export const Route = createFileRoute("/dashboard/client/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { setBreadcrumbs } = useBreadcrumbs();
  const { openSheet } = useSheet();
  useLayoutEffect(() => {
    setBreadcrumbs([
      {
        id: "dashboard",
        label: "Dashboard",
        href: "/dashboard",
      },
      {
        id: "client",
        label: "Clients",
        href: "/dashboard/client",
        isActive: true,
      },
    ]);
  }, []);

  const { table, searchParams, queryKey } = useTable({
    columns: [
      {
        accessorKey: "client_id",
        header: ({ column }) => (
          <DataTableColumnHeader icon={Hash} column={column} title="ID" />
        ),
        cell: ({ row }) => {
          const id = row.getValue("client_id") as number;
          return (
            <Badge variant="secondary" className="font-medium text-sm">
              <Hash className="h-3 w-3" />
              <span className="select-all">{id}</span>
            </Badge>
          );
        },
      },
      {
        accessorKey: "name",
        header: ({ column }) => (
          <DataTableColumnHeader icon={User} column={column} title="Name" />
        ),
        cell: ({ row }) => {
          const name = row.getValue("name") as string;

          return (
            <div className="flex items-center justify-between group relative w-full">
              <span className="font-medium text-sm select-none">{name}</span>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <AppCopyButton text={name} />
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "email",
        header: ({ column }) => (
          <DataTableColumnHeader icon={Mail} column={column} title="Email" />
        ),
        cell: ({ row }) => {
          const email = row.getValue("email") as string;

          return (
            <div className="flex items-center gap-2 pr-8 group">
              <Button
                variant="link"
                size="sm"
                className="h-8 px-2 text-sm"
                onClick={() => window.open(`mailto:${email}`, "_blank")}
              >
                {email}
              </Button>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <AppCopyButton text={email} />
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "phone",
        header: ({ column }) => (
          <DataTableColumnHeader icon={Phone} column={column} title="Phone" />
        ),
        cell: ({ row }) => {
          const phone = row.getValue("phone") as string;

          if (!phone)
            return (
              <p className="text-muted-foreground text-center m-auto w-full">
                N/A
              </p>
            );

          return (
            <div className="flex items-center gap-2 pr-8 group">
              <Button
                variant="link"
                size="sm"
                className="h-8 px-2 text-sm"
                onClick={() => window.open(`tel:${phone}`, "_blank")}
              >
                {phone}
              </Button>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <AppCopyButton text={phone} />
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "whatsapp_phone",
        header: ({ column }) => (
          <DataTableColumnHeader
            icon={MessageCircle}
            column={column}
            title="WhatsApp"
          />
        ),
        cell: ({ row }) => {
          const whatsappPhone = row.getValue("whatsapp_phone") as string;

          if (!whatsappPhone)
            return (
              <p className="text-muted-foreground text-center m-auto w-full">
                N/A
              </p>
            );
          return (
            <div className="flex items-center gap-2 pr-8 group">
              <Button
                variant="link"
                size="sm"
                className="h-8 px-2 text-sm"
                onClick={() =>
                  window.open(
                    `https://wa.me/${whatsappPhone.replace(/\D/g, "")}`,
                    "_blank"
                  )
                }
              >
                {whatsappPhone}
              </Button>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <AppCopyButton text={whatsappPhone} />
              </div>
            </div>
          );
        },
      },
      {
        id: "actions",
        cell: ({ row }) => {
          const actions: RowActionItem<any>[] = [
            {
              icon: Eye,
              label: "View ",
              action: (row) => {
                return openSheet("client:view", {
                  id: row.getValue("client_id") as string,
                });
              },
            },
            {
              icon: Edit,
              label: "Edit",
              action: (row) => {
                return openSheet("client:update", {
                  id: row.getValue("client_id") as string,
                });
              },
            },
            {
              isSeparator: true,
            },
            {
              icon: Delete,
              label: "Delete ",
              action: (row) => {
                console.log(row);
              },
            },
          ];
          return <DataTableRowActions row={row} actions={actions} />;
        },
      },
      {
        accessorKey: "created_at",
        header: ({ column }) => (
          <DataTableColumnHeader
            icon={Calendar}
            column={column}
            title="Created at"
          />
        ),
        cell: ({ row }) => {
          const createdAt = row.getValue("created_at") as string;
          const date = parseISO(createdAt);

          return (
            <div className="flex items-center gap-2">
              {format(date, "yyyy-MM-dd hh:mm a")?.toLowerCase()}
              <span className="text-muted-foreground">
                ({formatDistanceToNow(date)} ago)
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "updated_at",
        header: ({ column }) => (
          <DataTableColumnHeader
            icon={Calendar}
            column={column}
            title="Updated at"
          />
        ),
        cell: ({ row }) => {
          const createdAt = row.getValue("updated_at") as string;
          const date = parseISO(createdAt);

          return (
            <div className="flex items-center gap-2">
              {format(date, "yyyy-MM-dd hh:mm a")?.toLowerCase()}
              <span className="text-muted-foreground">
                ({formatDistanceToNow(date)} ago)
              </span>
            </div>
          );
        },
      },
    ],
    baseQueryKey: ["client"],
  });

  // const page = Number(searchParams.page) + 1;
  // const limit = 10;
  // const from = (page - 1) * limit;
  // const to = from + limit - 1;

  const page = useMemo(
    () => parsePageParam(searchParams.page),
    [searchParams.page]
  );
  const { from, to } = useMemo(
    () => toRange(page, searchParams.limit),
    [page, searchParams.limit]
  );

  const { data, isLoading, isError } = useQuery<
    IPaginationResponse<Database["public"]["Tables"]["client"]["Row"]>
  >({
    queryKey,
    queryFn: async () => {
      const QueryBuilder = supabase
        .from("client")
        .select("*", { count: "exact" })
        .range(from, to);
      if (searchParams.search) {
        QueryBuilder.or(
          `name.ilike.%${searchParams.search}%,email.ilike.%${searchParams.search}%,phone.ilike.%${searchParams.search}%,whatsapp_phone.ilike.%${searchParams.search}%`
        );
      }
      if (searchParams.sort) {
        QueryBuilder.order(searchParams.sort.by as any, {
          ascending: searchParams.sort.order === "asc",
        });
      }
      const { data, count, error } = await QueryBuilder;

      if (error) throw error;

      return buildPaginationResponse(data, searchParams, count);
    },
  });
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between py-3 bg-background/20 backdrop-blur-xl  md:px-8 px-4">
        <CardTitle>Clients Management</CardTitle>
        <Button
          onClick={() => {
            openSheet("client:create", { id: "hello" });
          }}
          className="cursor-pointer"
          variant={"default"}
          size={"lg"}
        >
          <Plus /> Create Client
        </Button>
      </div>
      <div className="md:px-8 px-4">
        <ClientStatsCards />
        <Card>
          <CardContent>
            <DataTable
              data={data}
              table={table}
              isLoading={isLoading}
              isError={isError}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
