import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { DoktorlarClient } from "@/components/doktorlar-client";
import { DoktorEkleModal } from "@/components/doktor-ekle-modal";
import { toggleDoktorAktif } from "./actions";

export default async function AdminDoktorlarPage() {
  const supabase = await createClient();

  const { data: doktorlar } = await supabase
    .from("doktor")
    .select(`
      id,
      ad,
      soyad,
      unvan,
      telefon,
      email,
      aktif,
      klinik_lokasyon,
      uzmanliklar ( ad )
    `)
    .order("ad", { ascending: true });

  const { data: uzmanliklar } = await supabase
    .from("uzmanliklar")
    .select("id, ad")
    .order("ad", { ascending: true });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-text">Doktor Yönetimi</h1>
          <p className="text-muted text-sm mt-1">Klinikteki doktorların listesi ve durum ayarları.</p>
        </div>
        <DoktorEkleModal uzmanliklar={uzmanliklar || []} />
      </div>

      <DoktorlarClient
        doktorlar={(doktorlar as any) || []}
        toggleAction={toggleDoktorAktif}
      />
    </div>
  );
}
