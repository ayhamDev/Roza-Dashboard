import { useBreadcrumbs } from "@/context/breadcrumpst";
import { createFileRoute } from "@tanstack/react-router";
import { useLayoutEffect } from "react";

export const Route = createFileRoute("/dashboard/catalog/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { setBreadcrumbs } = useBreadcrumbs();
  useLayoutEffect(() => {
    setBreadcrumbs([
      {
        id: "catalogs",
        label: "Catalogs",
        href: "/dashboard/catalog",
        isActive: true,
      },
    ]);
  }, []);
  return <div>Hello "/dashboard/catalog/"!</div>;
}
