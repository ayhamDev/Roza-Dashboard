import { LoginForm } from "@/components/login-form";
import { ThemeProvider } from "@/context/theme";
import { NoAuthGuard } from "@/lib/authGuard";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/login")({
  component: RouteComponent,
  beforeLoad: async () => {
    return await NoAuthGuard();
  },
});

function RouteComponent() {
  return (
    <ThemeProvider
      defaultTheme="system"
      key={"dashboard"}
      storageKey="dashboard"
    >
      <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm md:max-w-3xl">
          <LoginForm />
        </div>
      </div>
    </ThemeProvider>
  );
}
