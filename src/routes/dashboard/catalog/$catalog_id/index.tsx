import { CatalogBuilder } from "@/components/app/CatalogBuilder";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/catalog/$catalog_id/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { catalog_id } = Route.useParams();
  return <CatalogBuilder catalogId={catalog_id as any} />;
}
