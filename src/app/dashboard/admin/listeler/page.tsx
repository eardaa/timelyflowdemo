import { createClient } from "@/lib/supabase/server";
import { ListelerClient } from "@/components/listeler-client";

export default async function AdminListelerPage() {
  const supabase = await createClient();

  // Tab 2 Verileri (Listeler)
  const { data: listeler } = await supabase
    .from("liste")
    .select("*")
    .order("olusturulma_tarihi", { ascending: false });

  return (
    <div className="space-y-6 flex-1 flex flex-col h-[calc(100vh-theme(spacing.20))]">
      <ListelerClient listeler={listeler || []} />
    </div>
  );
}
