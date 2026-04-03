import { createClient } from "@/lib/supabase/server";
import { Badge, type BadgeVariant } from "@/components/badge";
import { formatDate } from "@/lib/utils";
import { autoUpdatePastAppointments } from "@/lib/services/randevu-service";
import { RandevuEkleModal } from "@/components/randevu-ekle-modal";
import { revalidatePath } from "next/cache";
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

export default async function DoktorRandevularPage() {
  const supabase = await createClient();

  // Tarihi geçen randevuların durumlarını otomatik güncelle
  await autoUpdatePastAppointments(supabase);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: doktorData } = await supabase
    .from("doktor")
    .select("id, uzmanlik_id")
    .eq("email", user.email)
    .single();

  const doktorId = doktorData?.id;

  // Doktorun uzmanlığına göre hizmetleri çek (uzmanlık yoksa tüm aktifleri çek)
  let hizmetlerSorgusu = supabase
    .from("hizmetler")
    .select("id, hizmet_adi, uzmanliklar(ad)")
    .eq("aktif", true)
    .order("hizmet_adi");
    
  if (doktorData?.uzmanlik_id) {
    hizmetlerSorgusu = hizmetlerSorgusu.eq("uzmanlik_id", doktorData.uzmanlik_id);
  }
  const { data: hizmetler } = await hizmetlerSorgusu;

  let randevular: any[] = [];
  if (doktorId) {
    const { data } = await supabase
      .from("randevu")
      .select(`
        id,
        randevu_tarihi,
        randevu_tipi,
        durum,
        randevu_kisi (isim, soyisim, telefon),
        hizmetler (hizmet_adi)
      `)
      .eq("doktor_id", doktorId)
      .order("randevu_tarihi", { ascending: false });
    
    if (data) randevular = data;
  }

  // Server Action to update status
  const updateRandevuStatus = async (formData: FormData) => {
    "use server";
    
    const id = formData.get("id") as string;
    const newStatus = formData.get("status") as string;
    
    const supabaseServer = await createClient();
    await supabaseServer
      .from("randevu")
      .update({ 
        durum: newStatus,
        guncellenme_tarihi: new Date().toISOString()
      })
      .eq("id", id);
      
    revalidatePath("/dashboard/doktor/randevular");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-text">Tüm Randevularım</h1>
          <p className="text-muted text-sm mt-1">Size atanan geçmiş ve gelecek tüm randevular.</p>
        </div>
        <RandevuEkleModal 
          doktorlar={[]} 
          hizmetler={hizmetler || []} 
          defaultDoktorId={doktorId}
        />
      </div>

      <div className="bg-surface rounded-xl border border-border shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tarih & Saat</TableHead>
              <TableHead>Hasta Adı</TableHead>
              <TableHead>Telefon</TableHead>
              <TableHead>Hizmet</TableHead>
              <TableHead>Tip</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead className="text-right">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {randevular?.length ? (
              randevular.map((r: any) => (
                <TableRow key={r.id}>
                  <TableCell>{formatDate(r.randevu_tarihi)}</TableCell>
                  <TableCell className="font-medium">
                    {r.randevu_kisi?.isim} {r.randevu_kisi?.soyisim}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted">
                    {r.randevu_kisi?.telefon}
                  </TableCell>
                  <TableCell>{r.hizmetler?.hizmet_adi}</TableCell>
                  <TableCell>{r.randevu_tipi}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(r.durum)}>
                      {r.durum}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {r.durum === "beklemede" ? (
                      <div className="flex justify-end gap-2">
                        <form action={updateRandevuStatus}>
                          <input type="hidden" name="id" value={r.id} />
                          <input type="hidden" name="status" value="onaylandi" />
                          <button 
                            type="submit" 
                            className="px-2.5 py-1 text-xs font-medium bg-success/10 text-success rounded hover:bg-success/20 transition-colors"
                          >
                            Onayla
                          </button>
                        </form>
                        <form action={updateRandevuStatus}>
                          <input type="hidden" name="id" value={r.id} />
                          <input type="hidden" name="status" value="reddedildi" />
                          <button 
                            type="submit" 
                            className="px-2.5 py-1 text-xs font-medium bg-danger/10 text-danger rounded hover:bg-danger/20 transition-colors"
                          >
                            Reddet
                          </button>
                        </form>
                      </div>
                    ) : (
                      <span className="text-xs text-muted">-</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted">
                  Size ait randevu kaydı bulunamadı.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
