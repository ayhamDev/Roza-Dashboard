import { useBreadcrumbs } from "@/context/breadcrumpst";
import { createFileRoute } from "@tanstack/react-router";
import { useLayoutEffect } from "react";

export const Route = createFileRoute("/dashboard/product/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { setBreadcrumbs } = useBreadcrumbs();
  useLayoutEffect(() => {
    setBreadcrumbs([
      {
        id: "products",
        label: "Products",
        href: "/dashboard/product",
        isActive: true,
      },
    ]);
  }, []);
  return <div>Hello "/dashboard/product/"!</div>;
}
