import { createServerClient } from "@/src/utils/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function validateAdmin() {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return redirect("/login");
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.role !== "admin") {
      return redirect("/dashboard/customer");
    }
  } catch (error) {
    console.error("Admin validation error:", error);
    return redirect("/login");
  }
}
