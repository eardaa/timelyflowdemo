import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/badge";
import { revalidatePath } from "next/cache";
import { formatDate } from "@/lib/utils";

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

  // Server Action to add new availability
  const addMusaitlik = async (formData: FormData) => {
    "use server";
    
    const tarih = formData.get("tarih") as string;
    const baslangic = formData.get("baslangic") as string;
    const bitis = formData.get("bitis") as string;
    const notBilgi = formData.get("not") as string;
    const doktor_id = formData.get("doktor_id") as string;
    
    if (!tarih || !baslangic || !bitis || !doktor_id) return;

    const supabaseServer = await createClient();
    await supabaseServer
      .from("doktor_takvim")
      .insert({
        doktor_id,
        tarih,
        baslangic_saat: baslangic + ":00", // Time format gereksinimi
        bitis_saat: bitis + ":00",
        musait: true,
        not_bilgi: notBilgi || null
      });
      
    revalidatePath("/dashboard/doktor/takvim");
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-text">Takvimim</h1>
          <p className="text-muted text-sm mt-1">Müsaitlik durumunuzu ve planlı saatlerinizi yönetin.</p>
        </div>
      </div>

      {/* Müsaitlik Ekleme Formu */}
      <div className="bg-surface p-6 rounded-xl border border-border shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        <h2 className="text-lg font-semibold text-text mb-4">Yeni Müsaitlik Ekle</h2>
        <form action={addMusaitlik} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <input type="hidden" name="doktor_id" value={doktorId} />
          
          <div className="md:col-span-1">
            <label className="block text-xs font-medium text-muted mb-1">Tarih</label>
            <input 
              type="date" 
              name="tarih" 
              required 
              className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-surface text-text focus:outline-none focus:ring-2 focus:ring-accent/50"
            />
          </div>
          <div className="md:col-span-1">
            <label className="block text-xs font-medium text-muted mb-1">Başlangıç (SS:DD)</label>
            <input 
              type="time" 
              name="baslangic" 
              required 
              className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-surface text-text focus:outline-none focus:ring-2 focus:ring-accent/50"
            />
          </div>
          <div className="md:col-span-1">
            <label className="block text-xs font-medium text-muted mb-1">Bitiş (SS:DD)</label>
            <input 
              type="time" 
              name="bitis" 
              required 
              className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-surface text-text focus:outline-none focus:ring-2 focus:ring-accent/50"
            />
          </div>
          <div className="md:col-span-1">
            <label className="block text-xs font-medium text-muted mb-1">Not (İsteğe bağlı)</label>
            <input 
              type="text" 
              name="not" 
              placeholder="Örn. Öğle Arası"
              className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-surface text-text focus:outline-none focus:ring-2 focus:ring-accent/50"
            />
          </div>
          <div className="md:col-span-1">
            <button 
              type="submit"
              className="w-full py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors"
            >
              Kaydet
            </button>
          </div>
        </form>
      </div>

      {/* Basit Takvim Görünümü (Grid Listesi) */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-text">Planlanmış Saatler</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {takvimGecmisi?.length ? (
            takvimGecmisi.map((slot: any) => (
              <div 
                key={slot.id} 
                className="bg-surface border border-border rounded-xl p-4 shadow-sm relative overflow-hidden group"
              >
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${slot.musait ? "bg-success" : "bg-danger"}`} />
                <div className="pl-3">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-semibold text-text">{formatDate(slot.tarih).split(' ')[0]}</span>
                    <Badge variant={slot.musait ? "success" : "danger"}>
                      {slot.musait ? "Müsait" : "Dolu"}
                    </Badge>
                  </div>
                  <div className="text-xl font-bold font-display text-text my-2">
                    {slot.baslangic_saat.substring(0, 5)} - {slot.bitis_saat.substring(0, 5)}
                  </div>
                  {slot.not_bilgi && (
                    <p className="text-xs text-muted truncate mt-2 border-t border-border pt-2">
                      {slot.not_bilgi}
                    </p>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-8 text-center text-muted bg-surface border border-border rounded-xl">
              Henüz takviminize müsaitlik eklemediniz.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
