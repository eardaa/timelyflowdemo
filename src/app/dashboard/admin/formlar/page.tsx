import { createClient } from "@/lib/supabase/server";
import { FormlarClient } from "@/components/formlar-client";

export default async function AdminFormlarPage() {
  const supabase = await createClient();

  // Tab 1 Verileri (Formlar)
  const { data: formlar } = await supabase
    .from("form")
    .select(`
      *,
      arama_kayit (*)
    `)
    .order("olusturulma_tarihi", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-text">Form Kayıtları</h1>
          <p className="text-muted text-sm mt-1">Web sitesinden gelen formlar.</p>
        </div>
      </div>

      <FormlarClient formlar={formlar || []} />
    </div>
  );
}
