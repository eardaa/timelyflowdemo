import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/dashboard-shell";
import { redirect } from "next/navigation";
import type { AppRole } from "@/lib/types";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // user_roles tablosundan role bilgisini çek
  const { data: roleData } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  const role = (roleData?.role as AppRole) || "doktor";

  let userName = "";

  if (role === "admin") {
    userName = user.email || "Yönetici";
  } else {
    // Doktor ise ismini doktor tablosundan çek (auth.users tablosu ile id üzerinden eşleştiği varsayımıyla)
    // Şema tanımına göre doktor_id auth id'siyle örtüşmüyorsa e-posta çekilir. 
    // TimelyFlow kurallarında "auth id -> user_roles -> doktor" mantığı vardır.
    // Doktor ise ismini doktor tablosundan çek 
    const { data: doktorData } = await supabase
      .from("doktor")
      .select("ad, soyad")
      .eq("auth_user_id", user.id)
      .single();

    if (doktorData) {
      userName = `Dr. ${doktorData.ad} ${doktorData.soyad}`;
    } else {
      userName = user.email || "Doktor";
    }
  }

  return (
    <DashboardShell role={role} userName={userName} userEmail={user?.email || ""}>
      {children}
    </DashboardShell>
  );
}
