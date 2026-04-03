import { createClient } from "@/lib/supabase/server";
import { Badge, type BadgeVariant } from "@/components/badge";
import { formatDate, formatDuration, formatCurrency } from "@/lib/utils";
import { StatCard } from "@/components/stat-card";
import { AramalarClient } from "@/components/aramalar-client";

export default async function AdminAramalarPage() {
  const supabase = await createClient();

  const { data: aramalar } = await supabase
    .from("arama_kayit")
    .select("*")
    .order("kayit_tarihi", { ascending: false });

  // Toplam İstatistikler
  const toplamSaniye = aramalar?.reduce((acc: number, curr: any) => acc + (curr.cagri_suresi || 0), 0) || 0;
  const toplamMaliyet = aramalar?.reduce((acc: number, curr: any) => acc + (curr.maliyet || 0), 0) || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-text">Çağrı Kayıtları</h1>
          <p className="text-muted text-sm mt-1">Sesli çağrı otomasyonu sistem kayıtlarını görüntüleyin.</p>
        </div>
        
        <form action={async () => {
            "use server";
            const { revalidatePath } = await import("next/cache");
            revalidatePath("/dashboard/admin/aramalar");
          }}>
          <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md shadow-sm transition-colors flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><polyline points="3 3 3 8 8 8"></polyline></svg>
            Yenile
          </button>
        </form>
      </div>

      {/* İstatistikler artık daha geri planda, belki alta eklenebilir veya gizlenebilir. Şimdilik kaldırıyoruz ve tamamen tasarıma odaklanıyoruz. */}
      
      <AramalarClient aramalar={aramalar || []} />
    </div>
  );
}
