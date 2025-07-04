import { useTheme } from "@/context/theme";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/catalog/$campaign_id/__layout/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { setTheme } = useTheme();
  useEffect(() => {
    setTheme("light");
  }, []);
  return <div></div>;
}
