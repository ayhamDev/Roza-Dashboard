import { Outlet, createRootRoute } from "@tanstack/react-router";
import AppRouteError from "@/components/app/AppRouteError";
import AppNotFound from "@/components/app/AppNotFound";
import { NuqsAdapter } from "nuqs/adapters/react";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SheetProvider } from "@/context/sheets";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/context/theme";

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
        <SheetProvider>
          <Outlet />
        </SheetProvider>
        <Toaster position="top-center" />
        <ReactQueryDevtools
          initialIsOpen={false}
          buttonPosition="bottom-left"
        />
      </QueryClientProvider>
    </NuqsAdapter>
  );
}
