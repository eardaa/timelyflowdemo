import { createClient } from "@/lib/supabase/server";
import { Badge, type BadgeVariant } from "@/components/badge";
import { formatDate } from "@/lib/utils";
import { autoUpdatePastAppointments } from "@/lib/services/randevu-service";
import { RandevuEkleModal } from "@/components/randevu-ekle-modal";
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

export default async function AdminRandevularPage() {
  const supabase = await createClient();

  // Tarihi geçen randevuların durumlarını otomatik güncelle
  await autoUpdatePastAppointments(supabase);

  // Modal için verileri çek
  const { data: doktorlar } = await supabase
    .from("doktor")
    .select("id, ad, soyad")
    .eq("aktif", true)
    .order("ad");

  const { data: hizmetler } = await supabase
    .from("hizmetler")
    .select("id, hizmet_adi, uzmanliklar(ad)")
    .eq("aktif", true)
    .order("hizmet_adi");

  const { data: randevular } = await supabase
    .from("randevu")
    .select(`
      id,
      randevu_tarihi,
      randevu_tipi,
      durum,
      sms,
      olusturulma_tarihi,
      randevu_kisi ( isim, soyisim, telefon ),
      doktor ( ad, soyad ),
      hizmetler ( hizmet_adi )
    `)
    .order("randevu_tarihi", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-text">Tüm Randevular</h1>
          <p className="text-muted text-sm mt-1">Sistemdeki tüm randevuları yönetin.</p>
        </div>
        <RandevuEkleModal 
          doktorlar={doktorlar || []} 
          hizmetler={hizmetler || []} 
        />
      </div>

      <div className="bg-surface rounded-xl border border-border shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Hasta Adı</TableHead>
              <TableHead>Telefon</TableHead>
              <TableHead>Doktor</TableHead>
              <TableHead>Hizmet</TableHead>
              <TableHead>Tarih & Saat</TableHead>
              <TableHead>Tip</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead>SMS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {randevular?.length ? (
              randevular.map((r: any) => (
                <TableRow key={r.id} className="cursor-pointer group">
                  <TableCell className="font-medium">
                    {r.randevu_kisi?.isim} {r.randevu_kisi?.soyisim}
                  </TableCell>
                  <TableCell className="font-mono text-xs">{r.randevu_kisi?.telefon}</TableCell>
                  <TableCell>Dr. {r.doktor?.ad} {r.doktor?.soyad}</TableCell>
                  <TableCell>{r.hizmetler?.hizmet_adi}</TableCell>
                  <TableCell>{formatDate(r.randevu_tarihi)}</TableCell>
                  <TableCell>{r.randevu_tipi}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(r.durum)}>
                      {r.durum}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-muted">{r.sms}</span>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted">
                  Randevu kaydı bulunamadı.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
