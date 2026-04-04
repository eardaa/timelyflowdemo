import { createClient } from "@/lib/supabase/server";
import TakvimClient from "./takvim-client";

export default async function DoktorTakvimPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: doktorData } = await supabase
    .from("doktor")
    .select("id")
    .eq("email", user.email)
    .single();

  const doktorId = doktorData?.id;

  let takvimGecmisi: any[] = [];
  if (doktorId) {
    const { data } = await supabase
      .from("doktor_takvim")
      .select("*")
      .eq("doktor_id", doktorId)
      .order("tarih", { ascending: true })
      .order("baslangic_saat", { ascending: true });
    
    if (data) takvimGecmisi = data;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-text">Takvim</h1>
          <p className="text-muted text-sm mt-1">Müsaitlik durumunuzu ve planlı saatlerinizi yönetin.</p>
        </div>
      </div>

      <TakvimClient takvimGecmisi={takvimGecmisi} doktorId={doktorId} />
    </div>
  );
}