"use client";

import { useState } from "react";
import { Badge } from "@/components/badge";
import { formatCurrency } from "@/lib/utils";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/data-table";

interface Hizmet {
  id: string;
  hizmet_adi: string;
  fiyat: number | null;
  sure_dakika: number | null;
  aciklama: string | null;
  aktif: boolean;
  uzmanlik_id: number | null;
  uzmanliklar: { ad: string } | null;
}

interface Uzmanlik {
  id: number;
  ad: string;
}

interface Props {
  hizmetler: Hizmet[];
  uzmanliklar: Uzmanlik[];
  updateAction: (formData: FormData) => Promise<void>;
}

export function HizmetlerClient({ hizmetler, uzmanliklar, updateAction }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  return (
    <div className="bg-surface rounded-xl border border-border shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Hizmet Adı</TableHead>
            <TableHead>Uzmanlık Alanı</TableHead>
            <TableHead>Süre (Dk)</TableHead>
            <TableHead>Fiyat</TableHead>
            <TableHead>Durum</TableHead>
            <TableHead className="text-right">İşlemler</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {hizmetler?.length ? (
            hizmetler.map((hizmet) => (
              <TableRow key={hizmet.id} className="group hover:bg-bg/50 transition-colors">
                <TableCell className="font-medium">
                  {hizmet.hizmet_adi}
                </TableCell>
                <TableCell>
                  {hizmet.uzmanliklar?.ad || "-"}
                </TableCell>
                <TableCell className="text-muted">
                  {hizmet.sure_dakika ? `${hizmet.sure_dakika} dk` : "-"}
                </TableCell>
                <TableCell className="font-mono">
                  {hizmet.fiyat ? formatCurrency(hizmet.fiyat) : "-"}
                </TableCell>
                <TableCell>
                  {hizmet.aktif ? (
                    <Badge variant="success">Aktif</Badge>
                  ) : (
                    <Badge variant="muted">Pasif</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <button 
                    onClick={() => setEditingId(hizmet.id)}
                    className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium bg-surface border border-border rounded-md text-text hover:bg-bg transition-colors"
                  >
                    Düzenle
                  </button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-muted">
                Hizmet bulunamadı.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Düzenleme Modalı */}
      {editingId && (
        <>
          <div 
            className="fixed inset-0 bg-black/60 z-[999]"
            onClick={() => setEditingId(null)}
          />
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 pointer-events-none">
            <div 
              className="bg-surface rounded-2xl shadow-xl w-full max-w-md border border-border overflow-hidden pointer-events-auto max-h-[90vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-5 border-b border-border bg-bg/50 shrink-0">
                <h2 className="text-lg font-bold font-display text-text">Hizmet Düzenle</h2>
                <button 
                  type="button"
                  onClick={() => setEditingId(null)}
                  className="p-1.5 text-muted hover:text-text hover:bg-bg rounded-lg transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </div>
              
              <form 
                action={async (formData) => {
                  setIsPending(true);
                  await updateAction(formData);
                  setIsPending(false);
                  setEditingId(null);
                }}
                className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar"
              >
                <input type="hidden" name="id" value={editingId} />
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-text">Hizmet Adı</label>
                  <input 
                    type="text" 
                    name="hizmet_adi" 
                    defaultValue={hizmetler.find(h => h.id === editingId)?.hizmet_adi || ""}
                    required
                    className="w-full bg-surface border border-border text-text text-sm rounded-lg focus:ring-accent focus:border-accent block p-2.5 outline-none"
                    placeholder="Hizmet Adı"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-text">Süre (Dk)</label>
                    <input 
                      type="number" 
                      name="sure_dakika" 
                      defaultValue={hizmetler.find(h => h.id === editingId)?.sure_dakika || ""}
                      className="w-full bg-surface border border-border text-text text-sm rounded-lg focus:ring-accent focus:border-accent block p-2.5 outline-none"
                      placeholder="Örn: 30"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-text">Fiyat (TL)</label>
                    <input 
                      type="number" 
                      step="0.01"
                      name="fiyat" 
                      defaultValue={hizmetler.find(h => h.id === editingId)?.fiyat || ""}
                      className="w-full bg-surface border border-border text-text text-sm rounded-lg focus:ring-accent focus:border-accent block p-2.5 outline-none"
                      placeholder="Örn: 1500"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-text">Uzmanlık Alanı</label>
                  <select 
                    name="uzmanlik_id" 
                    defaultValue={hizmetler.find(h => h.id === editingId)?.uzmanlik_id || ""}
                    className="w-full bg-surface border border-border text-text text-sm rounded-lg focus:ring-accent focus:border-accent block p-2.5 outline-none"
                  >
                    <option value="">Seçiniz...</option>
                    {uzmanliklar.map((u) => (
                      <option key={u.id} value={u.id}>{u.ad}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-text">Açıklama</label>
                  <textarea 
                    name="aciklama" 
                    defaultValue={hizmetler.find(h => h.id === editingId)?.aciklama || ""}
                    rows={2}
                    className="w-full bg-surface border border-border text-text text-sm rounded-lg focus:ring-accent focus:border-accent block p-2.5 outline-none resize-none custom-scrollbar"
                    placeholder="Açıklama giriniz..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-text">Durum</label>
                  <select 
                    name="aktif" 
                    defaultValue={hizmetler.find(h => h.id === editingId)?.aktif ? "true" : "false"}
                    className="w-full bg-surface border border-border text-text text-sm rounded-lg focus:ring-accent focus:border-accent block p-2.5 outline-none"
                  >
                    <option value="true">Aktif</option>
                    <option value="false">Pasif</option>
                  </select>
                </div>

                <div className="pt-4 mt-4 border-t border-border flex justify-end gap-3 sticky bottom-0 bg-surface">
                  <button 
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="px-4 py-2 bg-surface border border-border text-text rounded-lg text-sm font-medium hover:bg-bg transition-colors"
                  >
                    İptal
                  </button>
                  <button 
                    type="submit"
                    disabled={isPending}
                    className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors disabled:opacity-50"
                  >
                    {isPending ? "Kaydediliyor..." : "Kaydet"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
