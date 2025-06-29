import { useBreadcrumbs } from "@/context/breadcrumpst";
import { createFileRoute } from "@tanstack/react-router";
import { useLayoutEffect } from "react";

export const Route = createFileRoute("/dashboard/")({
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
        isActive: true,
      },
    ]);
  }, []);
  return <div>Hello "/dashboard/"!</div>;
}
