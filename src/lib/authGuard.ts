// lib/guards/adminGuard.ts

import { supabase } from "@/supabase";
import { redirect } from "@tanstack/react-router";

export async function adminGuard() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw redirect({ to: "/login" });
  }

  return true;
}
