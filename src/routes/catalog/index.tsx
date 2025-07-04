import AppNotFound from "@/components/app/AppNotFound";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/catalog/")({
  component: RouteComponent,
});

function RouteComponent() {
  return <AppNotFound buttons={false} />;
}
