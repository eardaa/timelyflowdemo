"use client";

import { useState } from "react";
import { Badge } from "@/components/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/data-table";

interface Kullanici {
  id: string;
  user_id: string;
  role: string;
  email?: string | null;
  ad?: string | null;
  soyad?: string | null;
  telefon?: string | null;
  adSoyad?: string | null;
}

interface Props {
  kullanicilar: Kullanici[];
  availableDoctors: { id: string; ad: string | null; soyad: string | null; email: string | null }[];
  updateAction: (formData: FormData) => Promise<{ success: boolean; message: string }>;
  addAction: (formData: FormData) => Promise<{ success: boolean; message: string }>;
  deleteAction: (formData: FormData) => Promise<{ success: boolean; message: string }>;
}

export function KullanicilarClient({ kullanicilar, availableDoctors, updateAction, addAction, deleteAction }: Props) {
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [isCreatingMode, setIsCreatingMode] = useState(false);
  const [isPending, setIsPending] = useState(false);
  
  // Yeni kullanıcı senaryosu için state'ler
  const [newRole, setNewRole] = useState<"doktor" | "admin">("doktor");
  const [newEmail, setNewEmail] = useState("");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-text">Kullanıcı Yönetimi</h1>
          <p className="text-muted text-sm mt-1">Sisteme kayıtlı kullanıcıların rolleri ve giriş bilgileri.</p>
        </div>
        <button 
          onClick={() => setIsCreatingMode(true)}
          className="px-4 py-2 bg-accent text-white text-sm font-medium rounded-lg hover:bg-accent/90 transition-colors"
        >
          Yeni Kullanıcı Ekle
        </button>
      </div>

      <div className="bg-surface rounded-xl border border-border shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
        <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Rol</TableHead>
            <TableHead>Ad Soyad / Bilgi</TableHead>
            <TableHead>E-posta</TableHead>
            <TableHead className="text-right">İşlemler</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {kullanicilar?.length ? (
            kullanicilar.map((kullanici) => (
              <TableRow key={kullanici.id} className="group hover:bg-bg/50 transition-colors">
                <TableCell>
                  {kullanici.role === "admin" ? (
                    <Badge variant="ai">Admin</Badge>
                  ) : (
                    <Badge variant="success">Doktor</Badge>
                  )}
                </TableCell>
                <TableCell className="font-medium">
                  {kullanici.adSoyad || (kullanici.role === "admin" ? "Sistem Yöneticisi" : "-")}
                </TableCell>
                <TableCell className="text-muted">
                  {kullanici.email || "-"}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button 
                      onClick={() => setEditingUserId(kullanici.user_id)}
                      className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium bg-surface border border-border rounded-md text-text hover:bg-bg transition-colors"
                    >
                      Düzenle
                    </button>
                    {kullanici.role === "doktor" && (
                      <form action={async (formData) => {
                        if (confirm("Bu doktoru sistemden silmek istediğinize emin misiniz? (Geçmiş randevuları korunur, sadece girişi silinir)")) {
                          setIsPending(true);
                          formData.append("user_id", kullanici.user_id);
                          formData.append("role", kullanici.role);
                          const result = await deleteAction(formData);
                          setIsPending(false);
                          if (!result.success) {
                            alert(result.message);
                          }
                        }
                      }}>
                        <button 
                          type="submit"
                          disabled={isPending}
                          className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium bg-danger/10 border border-danger/20 rounded-md text-danger hover:bg-danger/20 transition-colors disabled:opacity-50"
                        >
                          Sil
                        </button>
                      </form>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-8 text-muted">
                Kullanıcı bulunamadı.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      </div>

      {/* Düzenleme Modalı */}
      {editingUserId && (
        <>
          <div 
            className="fixed inset-0 bg-black/60 z-[999]"
            onClick={() => setEditingUserId(null)}
          />
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 pointer-events-none">
            <div 
              className="bg-surface rounded-2xl shadow-xl w-full max-w-md border border-border overflow-hidden pointer-events-auto max-h-[90vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-5 border-b border-border bg-bg/50 shrink-0">
                <h2 className="text-lg font-bold font-display text-text">Kullanıcı Düzenle</h2>
                <button 
                  type="button"
                  onClick={() => setEditingUserId(null)}
                  className="p-1.5 text-muted hover:text-text hover:bg-bg rounded-lg transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </div>
              
              <form 
                action={async (formData) => {
                  setIsPending(true);
                  const result = await updateAction(formData);
                  setIsPending(false);
                  if (result.success) {
                    setEditingUserId(null);
                  } else {
                    alert(result.message);
                  }
                }}
                className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar"
              >
                <input type="hidden" name="user_id" value={editingUserId} />
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-text">E-posta</label>
                  <input 
                    type="email" 
                    name="email" 
                    defaultValue={kullanicilar.find(k => k.user_id === editingUserId)?.email || ""}
                    disabled
                    className="w-full bg-bg border border-border text-muted text-sm rounded-lg block p-2.5 outline-none cursor-not-allowed"
                    title="E-posta güvenlik sebebiyle değiştirilemez."
                  />
                  <input type="hidden" name="email" value={kullanicilar.find(k => k.user_id === editingUserId)?.email || ""} />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-text">Yeni Şifre</label>
                  <input 
                    type="password" 
                    name="password" 
                    minLength={6}
                    className="w-full bg-surface border border-border text-text text-sm rounded-lg focus:ring-accent focus:border-accent block p-2.5 outline-none"
                    placeholder="Değiştirmek istemiyorsanız boş bırakın"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-text">Rol</label>
                  <select 
                    name="role" 
                    defaultValue={kullanicilar.find(k => k.user_id === editingUserId)?.role || "doktor"}
                    className="w-full bg-surface border border-border text-text text-sm rounded-lg focus:ring-accent focus:border-accent block p-2.5 outline-none"
                  >
                    <option value="admin">Admin</option>
                    <option value="doktor">Doktor</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-text">Ad Soyad</label>
                  <input 
                    type="text" 
                    name="adSoyad" 
                    defaultValue={kullanicilar.find(k => k.user_id === editingUserId)?.adSoyad || ""}
                    className="w-full bg-surface border border-border text-text text-sm rounded-lg focus:ring-accent focus:border-accent block p-2.5 outline-none"
                    placeholder="Ad Soyad giriniz"
                  />
                </div>



                <div className="pt-4 mt-4 border-t border-border flex justify-end gap-3 sticky bottom-0 bg-surface">
                  <button 
                    type="button"
                    onClick={() => setEditingUserId(null)}
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

      {/* Yeni Kullanıcı Modalı */}
      {isCreatingMode && (
        <>
          <div 
            className="fixed inset-0 bg-black/60 z-[999]"
            onClick={() => setIsCreatingMode(false)}
          />
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 pointer-events-none">
            <div 
              className="bg-surface rounded-2xl shadow-xl w-full max-w-md border border-border overflow-hidden pointer-events-auto max-h-[90vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-5 border-b border-border bg-bg/50 shrink-0">
                <h2 className="text-lg font-bold font-display text-text">Yeni Kullanıcı Ekle</h2>
                <button 
                  type="button"
                  onClick={() => setIsCreatingMode(false)}
                  className="p-1.5 text-muted hover:text-text hover:bg-bg rounded-lg transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </div>
              
              <form 
                action={async (formData) => {
                  setIsPending(true);
                  const result = await addAction(formData);
                  setIsPending(false);
                  if (result.success) {
                    setIsCreatingMode(false);
                  } else {
                    alert(result.message);
                  }
                }}
                className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar"
              >
                <div className="space-y-2">
                  <label className="text-sm font-medium text-text">Rol <span className="text-red-500">*</span></label>
                  <select 
                    name="role" 
                    value={newRole}
                    onChange={(e) => {
                      setNewRole(e.target.value as "doktor" | "admin");
                      setNewEmail(""); // Rol değişince emaili sıfırla
                    }}
                    className="w-full bg-surface border border-border text-text text-sm rounded-lg focus:ring-accent focus:border-accent block p-2.5 outline-none"
                  >
                    <option value="admin">Admin</option>
                    <option value="doktor">Doktor</option>
                  </select>
                </div>

                {newRole === "doktor" ? (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-text">Doktor Seçimi <span className="text-red-500">*</span></label>
                    {availableDoctors.length > 0 ? (
                      <select 
                        name="doktor_id" 
                        required
                        className="w-full bg-surface border border-border text-text text-sm rounded-lg focus:ring-accent focus:border-accent block p-2.5 outline-none"
                        onChange={(e) => {
                          const doc = availableDoctors.find(d => d.id === e.target.value);
                          if (doc && doc.email) {
                            setNewEmail(doc.email);
                          } else {
                            setNewEmail("");
                          }
                        }}
                      >
                       <option value="">Lütfen seçin...</option>
                       {availableDoctors.map(doc => (
                         <option key={doc.id} value={doc.id}>
                           Dr. {doc.ad} {doc.soyad}
                         </option>
                       ))}
                      </select>
                    ) : (
                      <p className="text-sm text-warning/80 bg-warning/10 p-2 rounded border border-warning/20">
                        Hesap açılmamış aktif hiçbir doktor bulunamadı. Lütfen önce doktor kaydını oluşturun.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-text">Ad Soyad</label>
                    <input 
                      type="text" 
                      name="adSoyad" 
                      className="w-full bg-surface border border-border text-text text-sm rounded-lg focus:ring-accent focus:border-accent block p-2.5 outline-none"
                      placeholder="Örn: Ayşe Yılmaz"
                    />
                  </div>
                )}
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-text">E-posta <span className="text-red-500">*</span></label>
                  <input 
                    type="email" 
                    name="email" 
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    required
                    className="w-full bg-surface border border-border text-text text-sm rounded-lg focus:ring-accent focus:border-accent block p-2.5 outline-none"
                    placeholder="ornek@klinik.com"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-text">Şifre <span className="text-red-500">*</span></label>
                  <input 
                    type="password" 
                    name="password" 
                    required
                    minLength={6}
                    className="w-full bg-surface border border-border text-text text-sm rounded-lg focus:ring-accent focus:border-accent block p-2.5 outline-none"
                    placeholder="En az 6 karakter"
                  />
                </div>
                <div className="pt-4 mt-4 border-t border-border flex justify-end gap-3 sticky bottom-0 bg-surface">
                  <button 
                    type="button"
                    onClick={() => setIsCreatingMode(false)}
                    className="px-4 py-2 bg-surface border border-border text-text rounded-lg text-sm font-medium hover:bg-bg transition-colors"
                  >
                    İptal
                  </button>
                  <button 
                    type="submit"
                    disabled={isPending}
                    className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors disabled:opacity-50"
                  >
                    {isPending ? "Oluşturuluyor..." : "Oluştur"}
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
