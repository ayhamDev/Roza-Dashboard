import { Outlet, createRootRoute } from "@tanstack/react-router";
import AppRouteError from "@/components/app/AppRouteError";
import AppNotFound from "@/components/app/AppNotFound";
import { NuqsAdapter } from "nuqs/adapters/react";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
const queryClient = new QueryClient();

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
      <QueryClientProvider client={queryClient}>
        <Outlet />
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </NuqsAdapter>
  );
}
