import { Outlet, createRootRoute } from "@tanstack/react-router";
import AppRouteError from "@/components/app/AppRouteError";
import AppNotFound from "@/components/app/AppNotFound";
import { NuqsAdapter } from "nuqs/adapters/react";

export const Route = createRootRoute({
  component: RootComponent,
  errorComponent: ({ error, reset }) => (
    <AppRouteError error={error} reset={reset} />
  ),
  notFoundComponent: ({}) => <AppNotFound />,
});

function RootComponent() {
  return (
    <NuqsAdapter>
      <Outlet />
    </NuqsAdapter>
  );
}
