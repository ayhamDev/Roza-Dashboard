import { DataTable } from "@/components/data-table";
import { useBreadcrumbs } from "@/context/breadcrumpst";
import { useTable } from "@/hooks/use-table";
import { supabase } from "@/supabase";
import { createFileRoute } from "@tanstack/react-router";
import { useLayoutEffect } from "react";

export const Route = createFileRoute("/dashboard/client/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { setBreadcrumbs } = useBreadcrumbs();
  useLayoutEffect(() => {
    setBreadcrumbs([
      {
        id: "client",
        label: "Clients",
        href: "/dashboard/client",
        isActive: true,
      },
    ]);
  }, []);
  const { table, searchParams } = useTable({
    columns: [
      {
        accessorKey: "name",
      },
    ],
    baseQueryKey: ["client"],
  });
  supabase;
  return (
    <>
      <DataTable data={[]} table={table} isError={false} isLoading={true} />
    </>
  );
}
