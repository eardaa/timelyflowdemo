"use client";

import { useState } from "react";
import { Badge } from "@/components/badge";
import { formatDate, formatDuration, formatCurrency } from "@/lib/utils";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/data-table";

interface FormlarClientProps {
  formlar: any[];
}

export function FormlarClient({ formlar }: FormlarClientProps) {
  const [selectedForm, setSelectedForm] = useState<any | null>(null);

  return (
    <>
      <div className="bg-surface rounded-xl border border-border shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ad Soyad</TableHead>
              <TableHead>İletişim</TableHead>
              <TableHead className="w-[30%]">Mesaj</TableHead>
              <TableHead>Tarih</TableHead>
              <TableHead>Arama Tetiklendi</TableHead>
              <TableHead className="text-right">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {formlar?.length ? (
              formlar.map((form: any) => (
                <TableRow key={form.id} className="group hover:bg-bg/50 transition-colors">
                  <TableCell className="font-medium">
                    {form.isim} {form.soyisim}
                  </TableCell>
                  <TableCell>
                    <div className="text-xs text-muted font-mono">{form.telefon}</div>
                    <div className="text-xs text-muted">{form.eposta}</div>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate" title={form.mesaj}>
                    {form.mesaj || "-"}
                  </TableCell>
                  <TableCell>{formatDate(form.olusturulma_tarihi)}</TableCell>
                  <TableCell>
                    {form.arama_tetiklendi ? (
                      <Badge variant="success">Evet</Badge>
                    ) : (
                      <Badge variant="muted">Hayır</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <button
                      onClick={() => setSelectedForm(form)}
                      className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium bg-surface border border-border rounded-md text-text hover:bg-bg transition-colors duration-75 active:scale-95 will-change-transform"
                    >
                      {form.arama_kayit && form.arama_kayit.length > 0 ? "Kayıtları Gör" : "Detay"}
                    </button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted">
                  Form kaydı bulunamadı.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Form Detay & Arama Kayıtları Modalı */}
      {selectedForm && (
        <>
          <style>{`
            @keyframes modalFadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes modalScaleIn {
              from { opacity: 0; transform: scale(0.98) translateY(4px) translateZ(0); }
              to { opacity: 1; transform: scale(1) translateY(0) translateZ(0); }
            }
            .animate-modal-overlay { 
              animation: modalFadeIn 0.1s ease-out forwards; 
              will-change: opacity;
            }
            .animate-modal-content { 
              animation: modalScaleIn 0.15s ease-out forwards; 
              will-change: transform, opacity;
            }
          `}</style>
          
          {/* Overlay */}
          <div 
            className="fixed inset-0 bg-black/60 z-40 animate-modal-overlay"
            onClick={() => setSelectedForm(null)}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div 
              className="bg-surface rounded-2xl shadow-xl w-full max-w-2xl border border-border overflow-hidden flex flex-col max-h-[90vh] animate-modal-content transform-gpu"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-6 border-b border-border bg-bg/50">
                <div>
                  <h2 className="text-lg font-bold font-display text-text flex items-center gap-2">
                    Form Detayı
                    {selectedForm.arama_tetiklendi ? (
                      <Badge variant="success">Arama Tetiklendi</Badge>
                    ) : (
                      <Badge variant="muted">Bekliyor</Badge>
                    )}
                  </h2>
                  <p className="text-xs text-muted mt-1">
                    {selectedForm.isim} {selectedForm.soyisim} - {formatDate(selectedForm.olusturulma_tarihi)}
                  </p>
                </div>
                <button 
                  onClick={() => setSelectedForm(null)}
                  className="p-2 text-muted hover:text-text hover:bg-bg rounded-lg transition-all duration-75 active:scale-90 will-change-transform"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
                
                {/* Form Bilgileri */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-bg/50 p-4 rounded-xl border border-border/50">
                  <div>
                    <div className="text-xs text-muted mb-1">Telefon</div>
                    <div className="font-mono text-sm font-medium">{selectedForm.telefon || "-"}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted mb-1">E-Posta</div>
                    <div className="text-sm font-medium">{selectedForm.eposta || "-"}</div>
                  </div>
                  <div className="sm:col-span-2">
                    <div className="text-xs text-muted mb-1">Müşteri Mesajı</div>
                    <p className="text-sm bg-surface p-3 rounded-lg border border-border">
                      {selectedForm.mesaj || "Mesaj bırakılmamış."}
                    </p>
                  </div>
                </div>

                {/* Bağlı Arama Kayıtları */}
                {selectedForm.arama_kayit && selectedForm.arama_kayit.length > 0 ? (
                  <div>
                    <h3 className="text-sm font-bold text-text mb-3 border-b border-border pb-1 flex items-center gap-2">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                      </svg>
                      Yapay Zeka Arama Kayıtları
                    </h3>
                    <div className="space-y-4">
                      {selectedForm.arama_kayit.map((kayit: any, idx: number) => (
                        <div key={kayit.id} className="bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
                          <div className="bg-bg/80 px-4 py-2 border-b border-border flex flex-wrap gap-4 text-xs">
                            <span className="font-medium">Arama {idx + 1}</span>
                            <span className="text-muted">Tarih: {formatDate(kayit.kayit_tarihi)}</span>
                            <span className="text-muted">Süre: {formatDuration(kayit.cagri_suresi)}</span>
                            <span className="text-muted">Maliyet: {formatCurrency(kayit.maliyet)}</span>
                          </div>
                          
                          <div className="p-4 space-y-4">
                            {kayit.ozet && (
                              <div>
                                <div className="text-xs font-semibold text-text mb-1">Özet</div>
                                <div className="text-sm text-muted bg-bg/50 p-3 rounded-lg leading-relaxed">{kayit.ozet}</div>
                              </div>
                            )}

                            {kayit.transkript && (
                              <div>
                                <div className="text-xs font-semibold text-text mb-1">Transkript</div>
                                <div className="text-sm text-muted bg-bg/50 p-3 rounded-lg max-h-40 overflow-y-auto custom-scrollbar whitespace-pre-wrap leading-relaxed">{kayit.transkript}</div>
                              </div>
                            )}

                            {kayit.kayit_url && (
                              <div>
                                <div className="text-xs font-semibold text-text mb-1">Ses Kaydı</div>
                                <div className="bg-bg/50 p-3 rounded-lg flex flex-wrap items-center gap-3">
                                  <audio controls className="h-8 max-w-[300px] flex-1" src={kayit.kayit_url}>Tarayıcı desteklenmiyor.</audio>
                                  <a href={kayit.kayit_url} target="_blank" rel="noreferrer" className="text-xs text-accent hover:underline">Yeni sekmede aç</a>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : selectedForm.arama_tetiklendi ? (
                  <div className="bg-warning/10 text-warning text-sm p-4 rounded-xl border border-warning/20 flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full border-2 border-warning border-t-transparent animate-spin" />
                    Arama tetiklenmiş ancak henüz sonuç/kayıt sisteme yansımamış olabilir.
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted border border-dashed border-border rounded-xl bg-bg/30">
                    <p className="text-sm">Bu form için henüz arama tetiklenmemiş.</p>
                  </div>
                )}

              </div>
              
              <div className="p-4 border-t border-border bg-bg/50 flex justify-end">
                <button 
                  onClick={() => setSelectedForm(null)}
                  className="px-5 py-2.5 bg-surface border border-border text-text rounded-lg text-sm font-medium hover:bg-bg transition-colors duration-75 active:scale-95 will-change-transform"
                >
                  Kapat
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}