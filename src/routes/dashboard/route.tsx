import AppBreadcrumps from "@/components/app/AppBreadcrumps";
import { AppSidebar } from "@/components/app/sidebar/AppSidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { BreadcrumbsProvider } from "@/context/breadcrumpst";
import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard")({
  component: DashboardLayout,
});

function DashboardLayout() {
  // const location = useLocation();

  // // Routes that should not have layout
  // const noLayoutPaths = ["/builder"];

  // if (noLayoutPaths?.some((path) => location.pathname.includes(path))) {
  //   return (
  //     <div className="w-full h-full flex flex-1 flex-col gap-4  pt-0 ">
  //       <Outlet />
  //     </div>
  //   );
  // }

  return (
    <BreadcrumbsProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <AppBreadcrumps />
          <div className="flex flex-1 flex-col gap-4  pt-0 ">
            <Outlet />
          </div>
        </SidebarInset>
      </SidebarProvider>
    </BreadcrumbsProvider>
  );
}
