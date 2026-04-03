import { createClient } from "@/lib/supabase/server";
import { HizmetlerClient } from "@/components/hizmetler-client";
import { revalidatePath } from "next/cache";

export default async function AdminHizmetlerPage() {
  const supabase = await createClient();

  const { data: hizmetler } = await supabase
    .from("hizmetler")
    .select(`
      *,
      uzmanliklar ( ad )
    `)
    .order("hizmet_adi", { ascending: true });

  const { data: uzmanliklar } = await supabase
    .from("uzmanliklar")
    .select("id, ad")
    .order("ad", { ascending: true });

  const updateHizmet = async (formData: FormData) => {
    "use server";
    const id = formData.get("id") as string;
    const hizmet_adi = formData.get("hizmet_adi") as string;
    const fiyat = formData.get("fiyat") ? parseFloat(formData.get("fiyat") as string) : null;
    const sure_dakika = formData.get("sure_dakika") ? parseInt(formData.get("sure_dakika") as string) : null;
    const aciklama = formData.get("aciklama") as string;
    const uzmanlik_id = formData.get("uzmanlik_id") ? parseInt(formData.get("uzmanlik_id") as string) : null;
    const aktif = formData.get("aktif") === "true";

    const supabaseServer = await createClient();
    
    await supabaseServer
      .from("hizmetler")
      .update({ hizmet_adi, fiyat, sure_dakika, aciklama, uzmanlik_id, aktif })
      .eq("id", id);
      
    revalidatePath("/dashboard/admin/hizmetler");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-text">Hizmetler</h1>
          <p className="text-muted text-sm mt-1">Klinikte verilen hizmetlerin listesi ve detayları.</p>
        </div>
        <button className="px-4 py-2 bg-accent text-white text-sm font-medium rounded-lg hover:bg-accent/90 transition-colors">
          Yeni Hizmet Ekle
        </button>
      </div>

      <HizmetlerClient 
        hizmetler={hizmetler || []} 
        uzmanliklar={uzmanliklar || []}
        updateAction={updateHizmet} 
      />
    </div>
  );
}
