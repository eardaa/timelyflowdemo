import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { LoginClient } from "./login-client";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (roleData?.role === "admin") {
      redirect("/dashboard/admin");
    } else if (roleData?.role === "doktor") {
      redirect("/dashboard/doktor");
    } else {
      redirect("/dashboard");
    }
  }

  const params = await searchParams;
  const error = params?.error === "true";

  return <LoginClient error={error} />;
}
