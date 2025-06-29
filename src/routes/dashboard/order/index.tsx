import { useBreadcrumbs } from "@/context/breadcrumpst";
import { createFileRoute } from "@tanstack/react-router";
import { useLayoutEffect } from "react";

export const Route = createFileRoute("/dashboard/order/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { setBreadcrumbs } = useBreadcrumbs();
  useLayoutEffect(() => {
    setBreadcrumbs([
      {
        id: "orders",
        label: "Orders",
        href: "/dashboard/order",
        isActive: true,
      },
    ]);
  }, []);
  return <div>Hello "/dashboard/order/"!</div>;
}
