import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/stat-card";
import { Badge, type BadgeVariant } from "@/components/badge";
import { formatDate } from "@/lib/utils";
import { autoUpdatePastAppointments } from "@/lib/services/randevu-service";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/data-table";

function getStatusBadgeVariant(status: string): BadgeVariant {
  switch (status) {
    case "beklemede": return "warning";
    case "onaylandi": return "success";
    case "tamamlandi": return "default"; // Accent / Mavi
    case "reddedildi":
    case "iptal":
    case "gelmedi": return "danger";
    case "gecmis": return "muted";
    default: return "outline";
  }
}

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  // Tarihi geçen randevuların durumlarını otomatik güncelle
  await autoUpdatePastAppointments(supabase);

  // 1. Üst Metrikler İçin İhtiyaç Duyulan Veriler
  const today = new Date().toISOString().split("T")[0];
  
  // Bugünkü randevular
  const { count: bugunkuRandevuSayisi } = await supabase
    .from("randevu")
    .select("*", { count: "exact", head: true })
    .eq("randevu_tarihi", today);

  // Bekleyen randevular
  const { count: bekleyenRandevuSayisi } = await supabase
    .from("randevu")
    .select("*", { count: "exact", head: true })
    .eq("durum", "beklemede");

  // Bu hafta (Arama - basit yaklaşımla son 7 gün alınabilir veya genel arama sayılabilir. 
  // Şimdilik örnek olması için toplam aramayı çekiyoruz)
  const { count: toplamArama } = await supabase
    .from("arama_kayit")
    .select("*", { count: "exact", head: true });

  // Aktif doktor sayısı
  const { count: aktifDoktorSayisi } = await supabase
    .from("doktor")
    .select("*", { count: "exact", head: true })
    .eq("aktif", true);

  // 2. Orta Bölüm: Son 10 Randevu
  const { data: sonRandevular } = await supabase
    .from("randevu")
    .select(`
      id,
      durum,
      randevu_tarihi,
      olusturulma_tarihi,
      randevu_kisi ( isim, soyisim ),
      doktor ( ad, soyad ),
      hizmetler ( hizmet_adi )
    `)
    .order("olusturulma_tarihi", { ascending: false })
    .limit(10);

  // 3. Orta Sağ: AI Özeti (En son kayıt)
  const { data: aiOzet } = await supabase
    .from("ai_ozet")
    .select("*")
    .order("olusturulma_tarihi", { ascending: false })
    .limit(1)
    .single();

  // Form İstatistikleri (Toplam form, arama tetiklenen form)
  const { count: toplamForm } = await supabase
    .from("form")
    .select("*", { count: "exact", head: true });
    
  const { count: aramaTetiklenenForm } = await supabase
    .from("form")
    .select("*", { count: "exact", head: true })
    .eq("arama_tetiklendi", true);

  // 4. Alt Bölüm: Doktor Listesi (Özet)
  const { data: doktorListesi } = await supabase
    .from("doktor")
    .select(`
      id,
      ad,
      soyad,
      unvan,
      aktif,
      uzmanliklar ( ad )
    `)
    .order("ad", { ascending: true });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold font-display text-text">Sistem Özeti</h1>
        <p className="text-muted text-sm mt-1">Klinik operasyonlarının genel durumu.</p>
      </div>

      {/* Üst Metrik Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Toplam Randevu (Bugün)" 
          value={bugunkuRandevuSayisi || 0} 
        />
        <StatCard 
          title="Bekleyen Randevular" 
          value={bekleyenRandevuSayisi || 0} 
        />
        <StatCard 
          title="Toplam Arama" 
          value={toplamArama || 0} 
          description="Sisteme kayıtlı"
        />
        <StatCard 
          title="Aktif Doktor Sayısı" 
          value={aktifDoktorSayisi || 0} 
        />
      </div>

      {/* Orta Bölüm (2 Kolon) */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        
        {/* Sol Kolon (%60) - Son Randevular */}
        <div className="lg:col-span-3 space-y-4">
          <h2 className="text-lg font-semibold text-text">Son Eklenen Randevular</h2>
          <div className="bg-surface rounded-xl border border-border shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Hasta</TableHead>
                  <TableHead>Doktor</TableHead>
                  <TableHead>Hizmet</TableHead>
                  <TableHead>Tarih</TableHead>
                  <TableHead>Durum</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sonRandevular?.length ? (
                  sonRandevular.map((r: any) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">
                        {r.randevu_kisi?.isim} {r.randevu_kisi?.soyisim}
                      </TableCell>
                      <TableCell>Dr. {r.doktor?.ad} {r.doktor?.soyad}</TableCell>
                      <TableCell>{r.hizmetler?.hizmet_adi}</TableCell>
                      <TableCell>{r.randevu_tarihi}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(r.durum)}>
                          {r.durum}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6 text-muted">
                      Henüz randevu bulunmuyor.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Sağ Kolon (%40) - AI Özeti ve Formlar */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-lg font-semibold text-text">Sistem Zekası (AI)</h2>
          
          {/* AI Ozet Karti */}
          <div className="bg-surface rounded-xl border border-border shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-6 space-y-6">
            {aiOzet ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted">Yoğun Saat Aralığı</p>
                    <p className="font-medium text-text mt-1">{aiOzet.yogun_saat_araligi}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted">Gelen Çağrı Sayısı</p>
                    <p className="font-medium text-text mt-1">{aiOzet.gelen_cagri_sayisi}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted">Ort. Çağrı Süresi</p>
                    <p className="font-medium text-text mt-1">{aiOzet.ort_cagri_sure}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted">Kaydedilen Randevu</p>
                    <p className="font-medium text-text mt-1">{aiOzet.kaydedilen_randevu}</p>
                  </div>
                </div>

                {aiOzet.ai_onerileri && (
                  <div className="bg-ai/5 rounded-lg border border-ai/10 p-4">
                    <p className="text-sm italic font-medium text-ai leading-relaxed">
                      " {aiOzet.ai_onerileri} "
                    </p>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-muted">Henüz AI özet verisi oluşturulmadı.</p>
            )}
          </div>

          {/* Form İstatistikleri */}
          <div className="bg-surface rounded-xl border border-border shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted">Toplam Form</p>
              <p className="text-2xl font-bold font-display text-text mt-1">{toplamForm || 0}</p>
            </div>
            <div className="h-10 w-px bg-border"></div>
            <div>
              <p className="text-sm font-medium text-muted">Arama Tetiklenen</p>
              <p className="text-2xl font-bold font-display text-text mt-1">{aramaTetiklenenForm || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Alt Bölüm - Doktor Listesi Özeti */}
      <div className="space-y-4 pt-4 border-t border-border">
        <h2 className="text-lg font-semibold text-text">Klinik Doktorları</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {doktorListesi?.map((doktor: any) => (
            <div key={doktor.id} className="bg-surface p-4 rounded-xl border border-border shadow-sm flex items-center justify-between">
              <div>
                <p className="font-medium text-text">
                  {doktor.unvan ? `${doktor.unvan} ` : "Dr. "}{doktor.ad} {doktor.soyad}
                </p>
                <p className="text-sm text-muted mt-0.5">{doktor.uzmanliklar?.ad}</p>
              </div>
              <Badge variant={doktor.aktif ? "success" : "muted"}>
                {doktor.aktif ? "Aktif" : "Pasif"}
              </Badge>
            </div>
          ))}
          {(!doktorListesi || doktorListesi.length === 0) && (
            <p className="text-muted text-sm col-span-3">Sistemde kayıtlı doktor bulunamadı.</p>
          )}
        </div>
      </div>
    </div>
  );
}
