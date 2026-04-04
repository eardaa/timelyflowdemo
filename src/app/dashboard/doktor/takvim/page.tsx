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
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800 mb-6">Yeni Müsaitlik Ekle</h2>
        <form action={addMusaitlik} className="grid grid-cols-1 md:grid-cols-5 gap-x-6 gap-y-4 items-end">
          <input type="hidden" name="doktor_id" value={doktorId} />
          
          <div className="md:col-span-1">
            <label className="block text-xs font-medium text-gray-500 mb-1">Tarih</label>
            <input 
              type="date" 
              name="tarih" 
              required 
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2.5 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors"
            />
          </div>
          <div className="md:col-span-1">
            <label className="block text-xs font-medium text-gray-500 mb-1">Başlangıç (SS:DD)</label>
            <input 
              type="time" 
              name="baslangic" 
              required 
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2.5 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors"
            />
          </div>
          <div className="md:col-span-1">
            <label className="block text-xs font-medium text-gray-500 mb-1">Bitiş (SS:DD)</label>
            <input 
              type="time" 
              name="bitis" 
              required 
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2.5 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors"
            />
          </div>
          <div className="md:col-span-1">
            <label className="block text-xs font-medium text-gray-500 mb-1">Not (İsteğe bağlı)</label>
            <input 
              type="text" 
              name="not" 
              placeholder="Örn. Öğle Arası"
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2.5 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors placeholder:text-gray-400"
            />
          </div>
          <div className="md:col-span-1 h-full flex items-end pb-[2px]">
            <button 
              type="submit"
              className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
            >
              Kaydet
            </button>
          </div>
        </form>
      </div>

      {/* Basit Takvim Görünümü (Grid Listesi) */}
      <div className="space-y-4 mt-12">
        <h2 className="text-lg font-semibold text-gray-800">Planlanmış Saatler</h2>
        
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm min-h-[160px] flex flex-col justify-center">
          {takvimGecmisi?.length ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 w-full">
              {takvimGecmisi.map((slot: any) => (
                <div 
                  key={slot.id} 
                  className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow"
                >
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${slot.musait ? "bg-green-500" : "bg-red-500"}`} />
                  <div className="pl-3">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-sm font-medium text-gray-700">{formatDate(slot.tarih).split(' ')[0]}</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${slot.musait ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {slot.musait ? "Müsait" : "Dolu"}
                      </span>
                    </div>
                    <div className="text-lg font-semibold text-gray-900 my-1">
                      {slot.baslangic_saat.substring(0, 5)} - {slot.bitis_saat.substring(0, 5)}
                    </div>
                    {slot.not_bilgi && (
                      <p className="text-xs text-gray-500 truncate mt-2 border-t border-gray-100 pt-2">
                        {slot.not_bilgi}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500 text-sm">
              Henüz takviminize müsaitlik eklemediniz.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
