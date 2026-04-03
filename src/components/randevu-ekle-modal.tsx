"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface RandevuEkleModalProps {
  doktorlar: any[];
  hizmetler: any[];
  defaultDoktorId?: string; // Eğer doktor kendi ekranından ekliyorsa pre-fill
}

export function RandevuEkleModal({ doktorlar, hizmetler, defaultDoktorId }: RandevuEkleModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const [formData, setFormData] = useState({
    isim: "",
    soyisim: "",
    telefon: "",
    doktor_id: defaultDoktorId || "",
    hizmet_id: "",
    randevu_tipi: "Klinik", // 'Online' | 'Klinik'
    randevu_tarihi_date: "", // 'YYYY-MM-DD'
    randevu_tarihi_time: "", // 'HH:mm'
    randevu_notu: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: kisiData, error: kisiError } = await supabase
        .from("randevu_kisi")
        .insert({
          isim: formData.isim,
          soyisim: formData.soyisim,
          telefon: formData.telefon,
        })
        .select("id")
        .single();

      if (kisiError) throw new Error("Hasta bilgileri kaydedilirken hata oluştu: " + kisiError.message);
      if (!kisiData) throw new Error("Hasta kaydedilemedi.");

      const randevuKisiId = kisiData.id;

      // Tarih ve saati birleştir
      const tamTarih = `${formData.randevu_tarihi_date}T${formData.randevu_tarihi_time}`;

      const { error: randevuError } = await supabase
        .from("randevu")
        .insert({
          randevu_kisi_id: randevuKisiId,
          doktor_id: formData.doktor_id,
          hizmet_id: formData.hizmet_id,
          randevu_tipi: formData.randevu_tipi,
          randevu_tarihi: tamTarih,
          randevu_notu: formData.randevu_notu,
          durum: "onaylandi",
          olusturulma_tarihi: new Date().toISOString(),
          guncellenme_tarihi: new Date().toISOString(),
        });

      if (randevuError) throw new Error("Randevu oluşturulurken hata: " + randevuError.message);

      setIsOpen(false);
      setFormData({
        isim: "",
        soyisim: "",
        telefon: "",
        doktor_id: defaultDoktorId || "",
        hizmet_id: "",
        randevu_tipi: "Klinik",
        randevu_tarihi_date: "",
        randevu_tarihi_time: "",
        randevu_notu: "",
      });
      router.refresh();

    } catch (err: any) {
      setError(err.message || "Bilinmeyen bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-accent text-white text-sm font-medium rounded-lg hover:bg-accent/90 transition-colors shadow-sm"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
        Yeni Randevu Ekle
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/60 z-[999]"
            onClick={() => setIsOpen(false)}
          />
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6 pointer-events-none">
            <div 
              className="bg-surface rounded-2xl shadow-xl w-full max-w-4xl border border-border overflow-hidden pointer-events-auto flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-5 border-b border-border bg-bg/50 shrink-0">
                <div>
                  <h2 className="text-lg font-bold font-display text-text">Yeni Randevu Oluştur</h2>
                  <p className="text-xs text-muted mt-1">Sisteme yeni bir hasta randevusu kaydedin.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-muted hover:text-text hover:bg-bg rounded-lg transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col">
                <div className="p-5 flex flex-col md:flex-row gap-8">
                  
                  {/* Hasta Bilgileri Sütunu */}
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                      </div>
                      <h3 className="font-semibold text-text">Hasta Bilgileri</h3>
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-muted uppercase tracking-wider">Ad <span className="text-red-500">*</span></label>
                          <input
                            type="text"
                            name="isim"
                            required
                            value={formData.isim}
                            onChange={handleChange}
                            className="w-full bg-bg border border-border text-text text-sm rounded-lg focus:ring-accent focus:border-accent block p-2.5 outline-none"
                            placeholder="Örn: Ahmet"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-muted uppercase tracking-wider">Soyad <span className="text-red-500">*</span></label>
                          <input
                            type="text"
                            name="soyisim"
                            required
                            value={formData.soyisim}
                            onChange={handleChange}
                            className="w-full bg-bg border border-border text-text text-sm rounded-lg focus:ring-accent focus:border-accent block p-2.5 outline-none"
                            placeholder="Örn: Yılmaz"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted uppercase tracking-wider">Telefon <span className="text-red-500">*</span></label>
                        <input
                          type="tel"
                          name="telefon"
                          required
                          value={formData.telefon}
                          onChange={handleChange}
                          placeholder="Örn: 555 123 4567"
                          className="w-full bg-bg border border-border text-text text-sm rounded-lg focus:ring-accent focus:border-accent block p-2.5 outline-none"
                        />
                      </div>
                      
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted uppercase tracking-wider">Not (Opsiyonel)</label>
                        <textarea
                          name="randevu_notu"
                          value={formData.randevu_notu}
                          onChange={handleChange}
                          rows={3}
                          placeholder="Randevu ile ilgili notlar..."
                          className="w-full bg-bg border border-border text-text text-sm rounded-lg focus:ring-accent focus:border-accent block p-2.5 outline-none resize-none"
                        ></textarea>
                      </div>
                    </div>
                  </div>

                  {/* Dikey Ayırıcı (Sadece masaüstü) */}
                  <div className="hidden md:block w-px bg-border"></div>

                  {/* Randevu Detayları Sütunu */}
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                      </div>
                      <h3 className="font-semibold text-text">Randevu Detayları</h3>
                    </div>

                    <div className="space-y-4">
                      {!defaultDoktorId && (
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-muted uppercase tracking-wider">Doktor <span className="text-red-500">*</span></label>
                          <select
                            name="doktor_id"
                            required
                            value={formData.doktor_id}
                            onChange={handleChange}
                            className="w-full bg-bg border border-border text-text text-sm rounded-lg focus:ring-accent focus:border-accent block p-2.5 outline-none"
                          >
                            <option value="">Doktor Seçin</option>
                            {doktorlar.map(d => (
                              <option key={d.id} value={d.id}>Dr. {d.ad} {d.soyad}</option>
                            ))}
                          </select>
                        </div>
                      )}

                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted uppercase tracking-wider">Hizmet <span className="text-red-500">*</span></label>
                        <select
                          name="hizmet_id"
                          required
                          value={formData.hizmet_id}
                          onChange={handleChange}
                          className="w-full bg-bg border border-border text-text text-sm rounded-lg focus:ring-accent focus:border-accent block p-2.5 outline-none"
                        >
                          <option value="">Hizmet Seçin</option>
                          {hizmetler.map(h => (
                            <option key={h.id} value={h.id}>{h.hizmet_adi} ({h.uzmanliklar?.ad || "Genel"})</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted uppercase tracking-wider">Tip <span className="text-red-500">*</span></label>
                        <select
                          name="randevu_tipi"
                          required
                          value={formData.randevu_tipi}
                          onChange={handleChange}
                          className="w-full bg-bg border border-border text-text text-sm rounded-lg focus:ring-accent focus:border-accent block p-2.5 outline-none"
                        >
                          <option value="Klinik">Klinik</option>
                          <option value="Online">Online</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5 relative">
                          <label className="text-xs font-medium text-muted uppercase tracking-wider">Tarih <span className="text-red-500">*</span></label>
                          <div className="relative">
                            <input
                              type="date"
                              name="randevu_tarihi_date"
                              required
                              value={formData.randevu_tarihi_date}
                              onChange={handleChange}
                              className="w-full bg-bg border border-border text-text text-sm rounded-lg focus:ring-accent focus:border-accent block p-2.5 outline-none [&::-webkit-calendar-picker-indicator]:opacity-50 hover:[&::-webkit-calendar-picker-indicator]:opacity-100"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5 relative">
                          <label className="text-xs font-medium text-muted uppercase tracking-wider">Saat <span className="text-red-500">*</span></label>
                          <div className="relative">
                            <input
                              type="time"
                              name="randevu_tarihi_time"
                              required
                              value={formData.randevu_tarihi_time}
                              onChange={handleChange}
                              className="w-full bg-bg border border-border text-text text-sm rounded-lg focus:ring-accent focus:border-accent block p-2.5 outline-none [&::-webkit-calendar-picker-indicator]:opacity-50 hover:[&::-webkit-calendar-picker-indicator]:opacity-100"
                            />
                          </div>
                        </div>
                      </div>
                      
                      {error && (
                        <div className="p-3 mt-4 bg-danger/10 text-danger rounded-lg border border-danger/20 text-sm">
                          {error}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer / Butonlar */}
                <div className="p-5 border-t border-border flex justify-end gap-3 bg-bg/30 mt-auto">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    disabled={loading}
                    className="px-5 py-2.5 bg-surface border border-border text-text rounded-lg text-sm font-medium hover:bg-bg transition-colors"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2.5 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        Kaydediliyor...
                      </>
                    ) : (
                      <>Oluştur</>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </>
  );
}