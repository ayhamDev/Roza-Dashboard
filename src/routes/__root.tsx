import AppNotFound from "@/components/app/AppNotFound";
import AppRouteError from "@/components/app/AppRouteError";
import { Toaster } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Outlet, createRootRoute } from "@tanstack/react-router";
import { NuqsAdapter } from "nuqs/adapters/react";

const queryClient = new QueryClient();

export const Route = createRootRoute({
  component: RootComponent,
  errorComponent: ({ error, reset }) => (
    <AppRouteError error={error} reset={reset} />
  ),
  notFoundComponent: ({}) => <AppNotFound buttons={true} />,
});

function RootComponent() {
  return (
    <NuqsAdapter>
      <QueryClientProvider client={queryClient}>
        <Outlet />
        <Toaster position="top-center" />
        <ReactQueryDevtools
          initialIsOpen={false}
          buttonPosition="bottom-left"
        />
      </QueryClientProvider>
    </NuqsAdapter>
  );
}
