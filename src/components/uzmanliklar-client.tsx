"use client";

import { useState } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/data-table";

interface Uzmanlik {
  id: number;
  ad: string;
  aciklama: string | null;
}

interface Props {
  uzmanliklar: Uzmanlik[];
  updateAction: (formData: FormData) => Promise<void>;
}

export function UzmanliklarClient({ uzmanliklar, updateAction }: Props) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isPending, setIsPending] = useState(false);

  return (
    <div className="bg-surface rounded-xl border border-border shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Uzmanlık Adı</TableHead>
            <TableHead>Açıklama</TableHead>
            <TableHead className="text-right">İşlemler</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {uzmanliklar?.length ? (
            uzmanliklar.map((uzmanlik) => (
              <TableRow key={uzmanlik.id} className="group hover:bg-bg/50 transition-colors">
                <TableCell className="font-medium">
                  {uzmanlik.ad}
                </TableCell>
                <TableCell className="text-muted">
                  {uzmanlik.aciklama || "-"}
                </TableCell>
                <TableCell className="text-right">
                  <button 
                    onClick={() => setEditingId(uzmanlik.id)}
                    className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium bg-surface border border-border rounded-md text-text hover:bg-bg transition-colors"
                  >
                    Düzenle
                  </button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={3} className="text-center py-8 text-muted">
                Uzmanlık alanı bulunamadı.
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
                <h2 className="text-lg font-bold font-display text-text">Uzmanlık Alanı Düzenle</h2>
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
                  <label className="text-sm font-medium text-text">Uzmanlık Adı</label>
                  <input 
                    type="text" 
                    name="ad" 
                    defaultValue={uzmanliklar.find(u => u.id === editingId)?.ad || ""}
                    required
                    className="w-full bg-surface border border-border text-text text-sm rounded-lg focus:ring-accent focus:border-accent block p-2.5 outline-none"
                    placeholder="Uzmanlık Adı"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-text">Açıklama</label>
                  <textarea 
                    name="aciklama" 
                    defaultValue={uzmanliklar.find(u => u.id === editingId)?.aciklama || ""}
                    rows={3}
                    className="w-full bg-surface border border-border text-text text-sm rounded-lg focus:ring-accent focus:border-accent block p-2.5 outline-none resize-none custom-scrollbar"
                    placeholder="Açıklama giriniz..."
                  />
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
