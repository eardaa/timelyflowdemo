"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface Uzmanlik {
  id: number;
  ad: string;
}

interface DoktorEkleModalProps {
  uzmanliklar: Uzmanlik[];
}

export function DoktorEkleModal({ uzmanliklar }: DoktorEkleModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const [formData, setFormData] = useState({
    ad: "",
    soyad: "",
    unvan: "",
    telefon: "",
    email: "",
    klinik_lokasyon: "",
    uzmanlik_id: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: insertError } = await supabase
        .from("doktor")
        .insert({
          ad: formData.ad,
          soyad: formData.soyad,
          unvan: formData.unvan || null,
          telefon: formData.telefon || null,
          email: formData.email || null,
          klinik_lokasyon: formData.klinik_lokasyon || null,
          uzmanlik_id: formData.uzmanlik_id ? parseInt(formData.uzmanlik_id) : null,
          aktif: true,
          olusturulma_tarihi: new Date().toISOString(),
        });

      if (insertError) throw new Error("Doktor eklenirken hata: " + insertError.message);

      setIsOpen(false);
      setFormData({
        ad: "",
        soyad: "",
        unvan: "",
        telefon: "",
        email: "",
        klinik_lokasyon: "",
        uzmanlik_id: "",
      });
      router.refresh();

    } catch (err: any) {
      setError(err.message || "Bilinmeyen bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-accent text-white text-sm font-medium rounded-lg hover:bg-accent/90 transition-colors flex items-center gap-2 shadow-sm"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
        Yeni Doktor Ekle
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/60 z-[999]"
            onClick={() => setIsOpen(false)}
          />
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6 pointer-events-none">
            <div 
              className="bg-surface rounded-2xl shadow-xl w-full max-w-2xl border border-border overflow-hidden pointer-events-auto flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-5 border-b border-border bg-bg/50 shrink-0">
                <div>
                  <h2 className="text-lg font-bold font-display text-text">Yeni Doktor Ekle</h2>
                  <p className="text-xs text-muted mt-1">Sisteme yeni bir doktor kaydedin.</p>
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
                <div className="p-5 space-y-4">
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted uppercase tracking-wider">Ad <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        name="ad"
                        required
                        value={formData.ad}
                        onChange={handleChange}
                        className="w-full bg-bg border border-border text-text text-sm rounded-lg focus:ring-accent focus:border-accent block p-2.5 outline-none"
                        placeholder="Örn: Ahmet"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted uppercase tracking-wider">Soyad <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        name="soyad"
                        required
                        value={formData.soyad}
                        onChange={handleChange}
                        className="w-full bg-bg border border-border text-text text-sm rounded-lg focus:ring-accent focus:border-accent block p-2.5 outline-none"
                        placeholder="Örn: Yılmaz"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted uppercase tracking-wider">Unvan</label>
                      <input
                        type="text"
                        name="unvan"
                        value={formData.unvan}
                        onChange={handleChange}
                        className="w-full bg-bg border border-border text-text text-sm rounded-lg focus:ring-accent focus:border-accent block p-2.5 outline-none"
                        placeholder="Örn: Prof. Dr."
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted uppercase tracking-wider">Uzmanlık</label>
                      <select
                        name="uzmanlik_id"
                        value={formData.uzmanlik_id}
                        onChange={handleChange}
                        className="w-full bg-bg border border-border text-text text-sm rounded-lg focus:ring-accent focus:border-accent block p-2.5 outline-none"
                      >
                        <option value="">Uzmanlık Seçin</option>
                        {uzmanliklar.map(u => (
                          <option key={u.id} value={u.id}>{u.ad}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted uppercase tracking-wider">Telefon</label>
                      <input
                        type="tel"
                        name="telefon"
                        value={formData.telefon}
                        onChange={handleChange}
                        placeholder="Örn: 555 123 4567"
                        className="w-full bg-bg border border-border text-text text-sm rounded-lg focus:ring-accent focus:border-accent block p-2.5 outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted uppercase tracking-wider">E-posta</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Örn: ahmet@klinik.com"
                        className="w-full bg-bg border border-border text-text text-sm rounded-lg focus:ring-accent focus:border-accent block p-2.5 outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted uppercase tracking-wider">Klinik / Lokasyon</label>
                    <input
                      type="text"
                      name="klinik_lokasyon"
                      value={formData.klinik_lokasyon}
                      onChange={handleChange}
                      placeholder="Örn: 3. Kat, Oda 305"
                      className="w-full bg-bg border border-border text-text text-sm rounded-lg focus:ring-accent focus:border-accent block p-2.5 outline-none"
                    />
                  </div>
                  
                  {error && (
                    <div className="p-3 bg-danger/10 text-danger rounded-lg border border-danger/20 text-sm">
                      {error}
                    </div>
                  )}
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
                      <>Kaydet</>
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