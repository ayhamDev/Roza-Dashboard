import { adminGuard } from "@/lib/authGuard";
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: RouteComponent,
  beforeLoad: async () => {
    const isAdmin = await adminGuard();

    if (isAdmin) return redirect({ to: "/dashboard" });
    return redirect({ to: "/login" });
  },
});

function RouteComponent() {
  return <div>Hello "/"!</div>;
}
