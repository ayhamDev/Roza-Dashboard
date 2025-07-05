import AppNotFound from "@/components/app/AppNotFound";
import AppRouteError from "@/components/app/AppRouteError";
import { CartProvider } from "@/context/cart";
import { ThemeProvider } from "@/context/theme";
import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/catalog/$campaign_id")({
  component: RouteComponent,
  errorComponent: ({ error, reset }) => (
    <AppRouteError error={error} reset={reset} />
  ),
  notFoundComponent: () => <AppNotFound />,
});

function RouteComponent() {
  const { campaign_id } = Route.useParams();
  return (
    <ThemeProvider defaultTheme="light" key={"catalog"} storageKey="catalog">
      <CartProvider campaign_id="campaign_id">
        <Outlet />
      </CartProvider>
    </ThemeProvider>
  );
}
