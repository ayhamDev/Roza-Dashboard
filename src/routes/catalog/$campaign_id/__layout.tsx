import AppNotFound from "@/components/app/AppNotFound";
import AppRouteError from "@/components/app/AppRouteError";
import { ThemeProvider } from "@/context/theme";
import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/catalog/$campaign_id/__layout")({
  component: RouteComponent,
  errorComponent: ({ error, reset }) => (
    <AppRouteError error={error} reset={reset} />
  ),
  notFoundComponent: () => <AppNotFound />,
});

function RouteComponent() {
  return (
    <ThemeProvider defaultTheme="light" key={"catalog"} storageKey="catalog">
      <Outlet />
    </ThemeProvider>
  );
}
