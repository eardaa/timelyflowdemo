import { createClient } from "@/lib/supabase/server";
import { Badge, type BadgeVariant } from "@/components/badge";
import { formatDate } from "@/lib/utils";
import { StatCard } from "@/components/stat-card";
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
    case "tamamlandi": return "default";
    case "reddedildi":
    case "iptal":
    case "gelmedi": return "danger";
    case "gecmis": return "muted";
    default: return "outline";
  }
}

export default async function DoktorDashboardPage() {
  const supabase = await createClient();

  // Tarihi geçen randevuların durumlarını otomatik güncelle
  await autoUpdatePastAppointments(supabase);

  // 1. Doktorun Kimliğini Bul
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // TimelyFlow mimarisinde doktor email üzerinden veya auth_id ile doktor eşleştirilebilir. 
  // Şemaya auth_user_id eklendiği için artık doğrudan eşleştiriyoruz.
  const { data: doktorData } = await supabase
    .from("doktor")
    .select("id")
    .eq("auth_user_id", user.id)
    .single();

  const doktorId = doktorData?.id;
  const today = new Date().toISOString().split("T")[0];

  // Metrikleri Hazırla
  let bugunRandevuSayisi = 0;
  let bekleyenRandevuSayisi = 0;
  
  // Hastaların Listesi
  let bugunkuRandevular: any[] = [];
  let yaklasanRandevular: any[] = [];

  if (doktorId) {
    // Bugünün Randevuları
    const { data: br } = await supabase
      .from("randevu")
      .select(`
        id,
        randevu_tarihi,
        randevu_tipi,
        durum,
        randevu_kisi (isim, soyisim),
        hizmetler (hizmet_adi)
      `)
      .eq("doktor_id", doktorId)
      .like("randevu_tarihi", `${today}%`)
      .order("randevu_tarihi", { ascending: true });
      
    bugunkuRandevular = br || [];
    bugunRandevuSayisi = bugunkuRandevular.length;

    // Bekleyen Randevular
    const { count: bekleyenCount } = await supabase
      .from("randevu")
      .select("*", { count: "exact", head: true })
      .eq("doktor_id", doktorId)
      .eq("durum", "beklemede");
      
    bekleyenRandevuSayisi = bekleyenCount || 0;

    // Yaklaşan Randevular (Gelecek Randevular, Bugünden Sonraki En Yakın 10)
    const { data: yr } = await supabase
      .from("randevu")
      .select(`
        id,
        randevu_tarihi,
        randevu_tipi,
        durum,
        randevu_kisi (isim, soyisim),
        hizmetler (hizmet_adi)
      `)
      .eq("doktor_id", doktorId)
      .gt("randevu_tarihi", `${today} 23:59:59`) // Yüzeysel bir büyüktür filtresi
      .order("randevu_tarihi", { ascending: true })
      .limit(10);
      
    yaklasanRandevular = yr || [];
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold font-display text-text">Doktor Paneli</h1>
        <p className="text-muted text-sm mt-1">Bugünkü randevularınız ve bekleyen onaylar.</p>
      </div>

      {/* Metrikler */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="Bugünkü Randevular" 
          value={bugunRandevuSayisi} 
        />
        <StatCard 
          title="Bekleyen Randevular" 
          value={bekleyenRandevuSayisi} 
          description="Onayınızı bekleyenler"
        />
        <StatCard 
          title="Yaklaşan Randevular" 
          value={yaklasanRandevular.length} 
          description="Önümüzdeki günlerde"
        />
      </div>

      {/* Bugünün Randevuları */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-text">Bugünkü Randevularınız</h2>
        <div className="bg-surface rounded-xl border border-border shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Saat / Tarih</TableHead>
                <TableHead>Hasta Adı</TableHead>
                <TableHead>Hizmet</TableHead>
                <TableHead>Tip</TableHead>
                <TableHead>Durum</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bugunkuRandevular?.length ? (
                bugunkuRandevular.map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell>{formatDate(r.randevu_tarihi)}</TableCell>
                    <TableCell className="font-medium">
                      {r.randevu_kisi?.isim} {r.randevu_kisi?.soyisim}
                    </TableCell>
                    <TableCell>{r.hizmetler?.hizmet_adi}</TableCell>
                    <TableCell>{r.randevu_tipi}</TableCell>
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
                    Bugün için planlanmış randevunuz bulunmuyor.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Yaklaşan Randevular */}
      <div className="space-y-4 pt-4 border-t border-border">
        <h2 className="text-lg font-semibold text-text">Yaklaşan Randevular (Gelecek Günler)</h2>
        <div className="bg-surface rounded-xl border border-border shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Saat / Tarih</TableHead>
                <TableHead>Hasta Adı</TableHead>
                <TableHead>Hizmet</TableHead>
                <TableHead>Tip</TableHead>
                <TableHead>Durum</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {yaklasanRandevular?.length ? (
                yaklasanRandevular.map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell>{formatDate(r.randevu_tarihi)}</TableCell>
                    <TableCell className="font-medium">
                      {r.randevu_kisi?.isim} {r.randevu_kisi?.soyisim}
                    </TableCell>
                    <TableCell>{r.hizmetler?.hizmet_adi}</TableCell>
                    <TableCell>{r.randevu_tipi}</TableCell>
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
                    Yaklaşan randevunuz bulunmuyor.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

    </div>
  );
}
