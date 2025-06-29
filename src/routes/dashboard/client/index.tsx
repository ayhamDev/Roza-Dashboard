import { DataTable } from "@/components/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useBreadcrumbs } from "@/context/breadcrumpst";
import { useTable } from "@/hooks/use-table";
import type { Database } from "@/interface/database.types";
import { copyToClipboard } from "@/lib/copyToClipboard";
import { supabase } from "@/supabase";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { format, formatDate, formatDistanceToNow, parseISO } from "date-fns";
import { Calendar, Copy, Mail, MessageCircle, Phone } from "lucide-react";
import { useLayoutEffect } from "react";
export interface IPaginationResponse<T> {
  docs: T[];
  limit: number;
  total: number;
  totalPages: number;
  page: number;
}

export const Route = createFileRoute("/dashboard/client/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { setBreadcrumbs } = useBreadcrumbs();

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
        header: "ID",
        cell: ({ row }) => {
          const id = row.getValue("client_id") as string;

          return (
            <div className="flex items-center gap-3">
              <div className="flex flex-col">
                <Badge
                  variant={"secondary"}
                  className="font-medium text-sm select-none"
                >
                  # <span className="select-all">{id}</span>
                </Badge>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => {
          const name = row.getValue("name") as string;

          return (
            <div className="flex items-center gap-3">
              <div className="flex flex-col">
                <span className="font-medium text-sm select-all">{name}</span>
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
            <div className="flex items-center gap-2 pr-8">
              <Button
                variant="link"
                size="sm"
                className="h-8 px-2 text-sm"
                onClick={() => window.open(`mailto:${email}`, "_blank")}
              >
                {email}
              </Button>

              <Button
                variant="outline"
                size="icon"
                className="h-6 w-6 ml-auto"
                title="Copy"
                onClick={() => copyToClipboard(email, "Email")}
              >
                <Copy />
              </Button>
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
            <div className="flex items-center gap-2 pr-8">
              <Button
                variant="link"
                size="sm"
                className="h-8 px-2 text-sm"
                onClick={() => window.open(`tel:${phone}`, "_blank")}
              >
                {phone}
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-6 w-6 ml-auto"
                title="Copy"
                onClick={() => copyToClipboard(phone, "Phone")}
              >
                <Copy />
              </Button>
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
            <div className="flex items-center gap-2 pr-8">
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
              <Button
                variant="outline"
                size="icon"
                className="h-6 w-6 ml-auto"
                title="Copy"
                onClick={() => copyToClipboard(whatsappPhone, "WhatsApp")}
              >
                <Copy />
              </Button>
            </div>
          );
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
              {format(date, "yyyy-MM-dd HH:mm a").toLowerCase()}{" "}
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
              {format(date, "yyyy-MM-dd HH:mm a").toLowerCase()}{" "}
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

  const page = Number(searchParams.page) || 1;
  const limit = 10;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, isLoading, isError } = useQuery<
    IPaginationResponse<Database["public"]["Tables"]["client"]["Row"]>
  >({
    queryKey,
    queryFn: async () => {
      const { data, count, error } = await supabase
        .from("client")
        .select("*", { count: "exact" })
        .range(from, to);

      if (error) throw error;

      return {
        docs: data ?? [],
        limit,
        total: count ?? 0,
        totalPages: count ? Math.ceil(count / limit) : 1,
        page,
      };
    },
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between sticky top-[52px] py-3 bg-background/20 backdrop-blur-xl z-[100] md:px-8 px-4">
        <CardTitle>Clients Management</CardTitle>
        <Button variant={"outline"}>Create Client</Button>
      </div>
      <div className="md:px-8 px-4">
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
