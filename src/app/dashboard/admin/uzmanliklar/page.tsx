import { createClient } from "@/lib/supabase/server";
import { UzmanliklarClient } from "@/components/uzmanliklar-client";
import { revalidatePath } from "next/cache";

export default async function AdminUzmanliklarPage() {
  const supabase = await createClient();

  const { data: uzmanliklar } = await supabase
    .from("uzmanliklar")
    .select("*")
    .order("ad", { ascending: true });

  const updateUzmanlik = async (formData: FormData) => {
    "use server";
    const id = formData.get("id") as string;
    const ad = formData.get("ad") as string;
    const aciklama = formData.get("aciklama") as string;

    const supabaseServer = await createClient();
    
    await supabaseServer
      .from("uzmanliklar")
      .update({ ad, aciklama })
      .eq("id", id);
      
    revalidatePath("/dashboard/admin/uzmanliklar");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-text">Uzmanlık Alanları</h1>
          <p className="text-muted text-sm mt-1">Klinikte verilen hizmetlerin bağlı olduğu uzmanlık alanları.</p>
        </div>
        <button className="px-4 py-2 bg-accent text-white text-sm font-medium rounded-lg hover:bg-accent/90 transition-colors">
          Yeni Uzmanlık Ekle
        </button>
      </div>

      <UzmanliklarClient 
        uzmanliklar={uzmanliklar || []} 
        updateAction={updateUzmanlik} 
      />
    </div>
  );
}
