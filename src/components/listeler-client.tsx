"use client";

import { useState, useRef, useEffect } from "react";
import { Badge, type BadgeVariant } from "@/components/badge";
import { formatDate, formatDuration, formatCurrency } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import Papa from "papaparse";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/data-table";

interface ListelerClientProps {
  listeler: any[];
}

function formatAramaDurumu(durum: any): string {
  if (durum === true || String(durum).toLowerCase() === "true") return "Arandı";
  if (durum === false || String(durum).toLowerCase() === "false") return "Bekliyor";
  if (!durum) return "Bekliyor";
  
  const d = String(durum);
  return d.charAt(0).toUpperCase() + d.slice(1);
}

function getAramaDurumuBadge(durum: any): BadgeVariant {
  if (durum === true || String(durum).toLowerCase() === "true") return "success";
  if (durum === false || String(durum).toLowerCase() === "false") return "default";

  switch (String(durum).toLowerCase()) {
    case "basarili": return "success";
    case "aramada": return "warning";
    case "bekliyor": return "default";
    case "mesgul": return "danger";
    case "arandı": return "success";
    default: return "muted";
  }
}

export function ListelerClient({ listeler }: ListelerClientProps) {
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [localListeler, setLocalListeler] = useState<any[]>(listeler || []);

  const [selectedListe, setSelectedListe] = useState<any | null>(null);
  const [listeKisileri, setListeKisileri] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedKisi, setSelectedKisi] = useState<any | null>(null);

  // Filtreleme State'i
  const [filterDurum, setFilterDurum] = useState<string>("Tümü");

  // CSV Yükleme State'i
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<{ type: "success" | "error", text: string } | null>(null);

  // Ekleme Menüsü State'i
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);

  // Manuel Ekleme State'i
  const [isManualAddOpen, setIsManualAddOpen] = useState(false);
  const [manualKisi, setManualKisi] = useState({ isim: "", soyisim: "", telefon: "" });
  const [isManualAdding, setIsManualAdding] = useState(false);

  // Randevudan Ekleme State'i
  const [isRandevuAddOpen, setIsRandevuAddOpen] = useState(false);
  const [randevuKisiler, setRandevuKisiler] = useState<any[]>([]);
  const [selectedRandevuIds, setSelectedRandevuIds] = useState<string[]>([]);
  const [isLoadingRandevuKisiler, setIsLoadingRandevuKisiler] = useState(false);
  const [isAddingFromRandevu, setIsAddingFromRandevu] = useState(false);
  const [randevuArama, setRandevuArama] = useState("");

  // Silme State'i
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // Yeni Liste State'i
  const [isNewListModalOpen, setIsNewListModalOpen] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [newAssistantMessage, setNewAssistantMessage] = useState("");
  const [isCreatingList, setIsCreatingList] = useState(false);

  // Düzenleme State'leri
  const [isEditListModalOpen, setIsEditListModalOpen] = useState(false);
  const [editingList, setEditingList] = useState<any>(null);

  const [isEditKisiOpen, setIsEditKisiOpen] = useState(false);
  const [editingKisi, setEditingKisi] = useState<any>(null);
  const [isKisiUpdating, setIsKisiUpdating] = useState(false);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);

  useEffect(() => {
    // Liste tablosundaki güncellemeleri dinle
    const listeChannel = supabase.channel('public:liste')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'liste' }, (payload) => {
        const updatedListe = payload.new;
        setLocalListeler(prev => prev.map(l => l.id === updatedListe.id ? { ...l, ...updatedListe } : l));
        setSelectedListe((prev: any) => prev && prev.id === updatedListe.id ? { ...prev, ...updatedListe } : prev);
      })
      .subscribe();

    // Liste_kisi tablosundaki güncellemeleri dinle
    const listeKisiChannel = supabase.channel('public:liste_kisi')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'liste_kisi' }, (payload) => {
        const updatedKisi = payload.new;
        setListeKisileri(prev => prev.map(k => k.id === updatedKisi.id ? { ...k, ...updatedKisi } : k));
        setSelectedKisi((prev: any) => prev && prev.id === updatedKisi.id ? { ...prev, ...updatedKisi } : prev);
      })
      .subscribe();

    // Arama kayıtları tablosuna yeni eklenen kayıtları dinle
    const aramaKayitChannel = supabase.channel('public:arama_kayit')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'arama_kayit' }, (payload) => {
        const yeniKayit = payload.new;
        setListeKisileri(prev => prev.map(k => {
          if (k.id === yeniKayit.liste_kisi_id) {
            const currentKayitlar = k.arama_kayit || [];
            // Eğer aynı kayıt henüz eklenmemişse ekle
            if (!currentKayitlar.find((ak: any) => ak.id === yeniKayit.id)) {
              return { ...k, arama_kayit: [yeniKayit, ...currentKayitlar] };
            }
          }
          return k;
        }));
        setSelectedKisi((prev: any) => {
          if (prev && prev.id === yeniKayit.liste_kisi_id) {
            const currentKayitlar = prev.arama_kayit || [];
            if (!currentKayitlar.find((ak: any) => ak.id === yeniKayit.id)) {
              return { ...prev, arama_kayit: [yeniKayit, ...currentKayitlar] };
            }
          }
          return prev;
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(listeChannel);
      supabase.removeChannel(listeKisiChannel);
      supabase.removeChannel(aramaKayitChannel);
    }
  }, [supabase]);

  const handleCreateListe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) return;

    setIsCreatingList(true);
    try {
      const { data, error } = await supabase
        .from("liste")
        .insert([{ 
          liste_ismi: newListName.trim(),
          aranma_durumu: false,
          toplam_kisi: 0,
          tamamlanan: 0,
          asistan_mesaji: newAssistantMessage.trim() || null
        }])
        .select()
        .single();

      if (error) throw error;

      setLocalListeler(prev => [data, ...prev]);
      setIsNewListModalOpen(false);
      setNewListName("");
      setNewAssistantMessage("");
    } catch (err: any) {
      console.error("Liste oluşturulurken hata:", err);
      alert("Liste oluşturulurken bir hata oluştu: " + err.message);
    } finally {
      setIsCreatingList(false);
    }
  };

  const handleEditListeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingList?.liste_ismi.trim()) return;

    setIsCreatingList(true);
    try {
      const { error } = await supabase
        .from("liste")
        .update({ 
          liste_ismi: editingList.liste_ismi.trim(),
          asistan_mesaji: editingList.asistan_mesaji?.trim() || null
        })
        .eq("id", editingList.id);

      if (error) throw error;

      setLocalListeler(prev => prev.map(l => l.id === editingList.id ? { ...l, liste_ismi: editingList.liste_ismi, asistan_mesaji: editingList.asistan_mesaji } : l));
      if (selectedListe?.id === editingList.id) {
        setSelectedListe({ ...selectedListe, liste_ismi: editingList.liste_ismi, asistan_mesaji: editingList.asistan_mesaji });
      }
      setIsEditListModalOpen(false);
    } catch (err: any) {
      console.error("Liste güncellenirken hata:", err);
      alert("Liste güncellenirken bir hata oluştu: " + err.message);
    } finally {
      setIsCreatingList(false);
    }
  };

  const toggleAramaDurumu = async (liste: any) => {
    setIsTogglingStatus(true);
    try {
      const newStatus = !liste.aranma_durumu;
      const { error } = await supabase
        .from("liste")
        .update({ aranma_durumu: newStatus })
        .eq("id", liste.id);

      if (error) throw error;

      // "Aramayı Başlat" durumunda webhook'u tetikle
      if (newStatus === true) {
        try {
          await fetch("https://eapehlivanlihot.app.n8n.cloud/webhook/a5742bdb-a4c9-4a21-ad23-8e4dd42869a1", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              liste_id: liste.id,
              liste_ismi: liste.liste_ismi,
              asistan_mesaji: liste.asistan_mesaji,
              olusturulma_tarihi: liste.olusturulma_tarihi,
              action: "start_campaign"
            }),
          });
        } catch (webhookErr) {
          console.error("Webhook tetiklenirken hata:", webhookErr);
        }
      }

      setLocalListeler(prev => prev.map(l => l.id === liste.id ? { ...l, aranma_durumu: newStatus } : l));
      if (selectedListe?.id === liste.id) {
        setSelectedListe({ ...selectedListe, aranma_durumu: newStatus });
      }
    } catch (err: any) {
      console.error("Durum güncellenirken hata:", err);
      alert("Durum güncellenirken bir hata oluştu: " + err.message);
    } finally {
      setIsTogglingStatus(false);
    }
  };

  const handleDeleteKisi = async (kisiId: string) => {
    if (!window.confirm("Bu kişiyi listeden silmek istediğinize emin misiniz?")) return;
    
    try {
      await supabase.from("arama_kayit").delete().eq("liste_kisi_id", kisiId);
      const { error } = await supabase.from("liste_kisi").delete().eq("id", kisiId);
      
      if (error) throw error;
      
      setListeKisileri(prev => prev.filter(k => k.id !== kisiId));
      
      const yeniToplam = selectedListe.toplam_kisi - 1;
      await supabase.from("liste").update({ toplam_kisi: yeniToplam }).eq("id", selectedListe.id);
      
      setLocalListeler(prev => prev.map(l => l.id === selectedListe.id ? { ...l, toplam_kisi: yeniToplam } : l));
      setSelectedListe((prev: any) => prev ? { ...prev, toplam_kisi: yeniToplam } : null);
      
      if (selectedKisi?.id === kisiId) setSelectedKisi(null);
    } catch (err: any) {
      console.error("Kişi silinirken hata:", err);
      alert("Kişi silinirken bir hata oluştu: " + err.message);
    }
  };

  const handleEditKisiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingKisi?.isim.trim() || !editingKisi?.telefon.trim()) return;

    setIsKisiUpdating(true);
    try {
      const guncelKisi = {
        isim: editingKisi.isim.trim(),
        soyisim: editingKisi.soyisim?.trim() || "",
        telefon: editingKisi.telefon.trim().replace(/[^0-9+]/g, '')
      };

      const { error } = await supabase
        .from("liste_kisi")
        .update(guncelKisi)
        .eq("id", editingKisi.id);

      if (error) throw error;

      setListeKisileri(prev => prev.map(k => k.id === editingKisi.id ? { ...k, ...guncelKisi } : k));
      if (selectedKisi?.id === editingKisi.id) {
        setSelectedKisi({ ...selectedKisi, ...guncelKisi });
      }
      setIsEditKisiOpen(false);
    } catch (err: any) {
      console.error("Kişi güncellenirken hata:", err);
      alert("Kişi güncellenirken bir hata oluştu: " + err.message);
    } finally {
      setIsKisiUpdating(false);
    }
  };

  const handleDeleteListe = async (e: React.MouseEvent, listeId: string) => {
    e.stopPropagation();
    
    if (!window.confirm("Bu listeyi silmek istediğinize emin misiniz? Bu işlem geri alınamaz ve listeye ait tüm kişiler ile arama kayıtları da silinebilir.")) {
      return;
    }

    setIsDeleting(listeId);
    try {
      // 1. Önce listeye ait liste_kisi kayıtlarını bul
      const { data: kisiler } = await supabase
        .from("liste_kisi")
        .select("id")
        .eq("liste_id", listeId);

      // 2. Eğer kişi varsa, onların arama kayıtlarını ve kendilerini sil
      if (kisiler && kisiler.length > 0) {
        const kisiIds = kisiler.map(k => k.id);
        
        // Arama kayıtlarını sil (liste_kisi_id üzerinden)
        await supabase
          .from("arama_kayit")
          .delete()
          .in("liste_kisi_id", kisiIds);

        // Kişileri sil
        await supabase
          .from("liste_kisi")
          .delete()
          .eq("liste_id", listeId);
      }

      // 3. Listeyi sil
      const { error } = await supabase
        .from("liste")
        .delete()
        .eq("id", listeId);

      if (error) throw error;

      // State'i güncelle
      setLocalListeler(prev => prev.filter(l => l.id !== listeId));
      if (selectedListe?.id === listeId) {
        closeListeDetay();
      }

    } catch (err: any) {
      console.error("Liste silinirken hata:", err);
      alert("Liste silinirken bir hata oluştu: " + err.message);
    } finally {
      setIsDeleting(null);
    }
  };

  const openListeDetay = async (liste: any) => {
    setSelectedListe(liste);
    setLoading(true);
    setUploadMessage(null); // Detaylar açıldığında eski mesajları temizle
    
    try {
      const { data } = await supabase
        .from("liste_kisi")
        .select(`
          *,
          arama_kayit (*)
        `)
        .eq("liste_id", liste.id);
        
      setListeKisileri(data || []);
    } catch (err) {
      console.error("Kişiler yüklenirken hata:", err);
    } finally {
      setLoading(false);
    }
  };

  const closeListeDetay = () => {
    setSelectedListe(null);
    setListeKisileri([]);
    setSelectedKisi(null);
    setIsAddMenuOpen(false);
    setUploadMessage(null); // Kapanırken de mesajı temizle
  };

  const handleManualAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualKisi.isim.trim() || !manualKisi.telefon.trim()) return;

    setIsManualAdding(true);
    try {
      const yeniKisi = {
        liste_id: selectedListe.id,
        isim: manualKisi.isim.trim(),
        soyisim: manualKisi.soyisim.trim(),
        telefon: manualKisi.telefon.trim().replace(/[^0-9+]/g, ''),
        arama_durumu: "bekliyor"
      };

      const { data, error } = await supabase
        .from("liste_kisi")
        .insert([yeniKisi])
        .select()
        .single();

      if (error) throw error;

      // Toplamı güncelle
      const yeniToplam = selectedListe.toplam_kisi + 1;
      await supabase.from("liste").update({ toplam_kisi: yeniToplam }).eq("id", selectedListe.id);

      setUploadMessage({ type: "success", text: "Kişi başarıyla eklendi!" });
      setLocalListeler(prev => prev.map(l => l.id === selectedListe.id ? { ...l, toplam_kisi: yeniToplam } : l));
      setSelectedListe((prev: any) => prev ? { ...prev, toplam_kisi: yeniToplam } : null);
      
      setListeKisileri(prev => [data, ...prev]);
      setIsManualAddOpen(false);
      setManualKisi({ isim: "", soyisim: "", telefon: "" });
    } catch (err: any) {
      setUploadMessage({ type: "error", text: err.message || "Kişi eklenirken hata oluştu." });
    } finally {
      setIsManualAdding(false);
    }
  };

  const openRandevuAddModal = async () => {
    setIsRandevuAddOpen(true);
    setIsLoadingRandevuKisiler(true);
    setSelectedRandevuIds([]);
    try {
      // Randevuları, ilgili hasta (randevu_kisi), doktor, uzmanlık ve hizmet bilgileriyle çek
      const { data, error } = await supabase
        .from("randevu")
        .select(`
          id,
          randevu_tarihi,
          randevu_kisi (id, isim, soyisim, telefon),
          doktor (ad, soyad, uzmanliklar (ad)),
          hizmetler (hizmet_adi)
        `)
        .order("randevu_tarihi", { ascending: false });

      if (error) throw error;

      // Unique randevuları filtreleyerek alalım (bazen aynı kişi birden fazla randevuya sahip olabilir, 
      // her randevu ayrı gösterilecek ancak aynı randevu listelenmeyecek)
      setRandevuKisiler(data || []);
    } catch (err) {
      console.error("Randevular çekilirken hata:", err);
    } finally {
      setIsLoadingRandevuKisiler(false);
    }
  };

  const handleAddFromRandevu = async () => {
    if (selectedRandevuIds.length === 0) return;

    setIsAddingFromRandevu(true);
    try {
      // Seçilen randevulardaki kişileri çıkart (aynı kişiden birden fazla seçilmişse tekilleştir)
      const secilenRandevular = randevuKisiler.filter(r => selectedRandevuIds.includes(r.id));
      const ekleneceklerMap = new Map();

      secilenRandevular.forEach(r => {
        const kisi = r.randevu_kisi;
        if (kisi && kisi.telefon) {
          ekleneceklerMap.set(kisi.telefon, {
            liste_id: selectedListe.id,
            isim: kisi.isim,
            soyisim: kisi.soyisim || "",
            telefon: kisi.telefon.replace(/[^0-9+]/g, ''),
            arama_durumu: "bekliyor"
          });
        }
      });

      const eklenecekler = Array.from(ekleneceklerMap.values());

      if (eklenecekler.length === 0) {
        setIsAddingFromRandevu(false);
        return;
      }

      const { data, error } = await supabase
        .from("liste_kisi")
        .insert(eklenecekler)
        .select();

      if (error) throw error;

      // Toplamı güncelle
      const yeniToplam = selectedListe.toplam_kisi + eklenecekler.length;
      await supabase.from("liste").update({ toplam_kisi: yeniToplam }).eq("id", selectedListe.id);

      setUploadMessage({ type: "success", text: `${eklenecekler.length} kişi başarıyla eklendi!` });
      setLocalListeler(prev => prev.map(l => l.id === selectedListe.id ? { ...l, toplam_kisi: yeniToplam } : l));
      setSelectedListe((prev: any) => prev ? { ...prev, toplam_kisi: yeniToplam } : null);
      
      setListeKisileri(prev => [...(data || []), ...prev]);
      setIsRandevuAddOpen(false);
      setSelectedRandevuIds([]);
    } catch (err: any) {
      setUploadMessage({ type: "error", text: err.message || "Kişiler eklenirken hata oluştu." });
    } finally {
      setIsAddingFromRandevu(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedListe) return;

    setIsUploading(true);
    setUploadMessage(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const rows = results.data as any[];
          
          // İsimleri bulmaya çalış (farklı excel başlık ihtimallerini handle etmek için)
          const formatliKisiler = rows.map((row) => {
            const isim = row["isim"] || row["İsim"] || row["Ad"] || row["ad"] || "";
            const soyisim = row["soyisim"] || row["Soyisim"] || row["Soyad"] || row["soyad"] || "";
            const telefon = row["telefon"] || row["Telefon"] || row["Tel"] || row["tel"] || row["numara"] || "";
            
            return {
              liste_id: selectedListe.id,
              isim: String(isim).trim(),
              soyisim: String(soyisim).trim(),
              telefon: String(telefon).trim().replace(/[^0-9+]/g, ''), // sadece rakam ve + 
              arama_durumu: "bekliyor"
            };
          }).filter(k => k.isim || k.telefon); // En azından isim veya telefonu olanları filtrele

          if (formatliKisiler.length === 0) {
            throw new Error("Geçerli kişi bulunamadı. Lütfen CSV dosyasında 'isim', 'soyisim', 'telefon' sütunları olduğundan emin olun.");
          }

          // Veritabanına toplu ekleme
          const { error } = await supabase
            .from("liste_kisi")
            .insert(formatliKisiler);

          if (error) throw error;

          // Toplam kişi sayısını list tablosunda güncelle
          const yeniToplam = selectedListe.toplam_kisi + formatliKisiler.length;
          await supabase
            .from("liste")
            .update({ toplam_kisi: yeniToplam })
            .eq("id", selectedListe.id);

          setUploadMessage({
            type: "success",
            text: `${formatliKisiler.length} kişi başarıyla eklendi!`
          });

          // Arayüzü Güncelle
          setLocalListeler((prev: any[]) => prev.map((l: any) => l.id === selectedListe.id ? { ...l, toplam_kisi: yeniToplam } : l));
          setSelectedListe((prev: any) => prev ? { ...prev, toplam_kisi: yeniToplam } : null);
          
          // Kişileri yeniden yükle
          openListeDetay({ ...selectedListe, toplam_kisi: yeniToplam });

        } catch (err: any) {
          setUploadMessage({
            type: "error",
            text: err.message || "CSV yüklenirken bir hata oluştu."
          });
        } finally {
          setIsUploading(false);
          if (fileInputRef.current) fileInputRef.current.value = "";
        }
      },
      error: (error) => {
        setUploadMessage({ type: "error", text: "Dosya okunamadı: " + error.message });
        setIsUploading(false);
      }
    });
  };

  const filteredKisiler = listeKisileri.filter(kisi => 
    filterDurum === "Tümü" ? true : kisi.arama_durumu === filterDurum
  );

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold font-display text-text">Arama Listeleri</h1>
        <button 
          onClick={() => setIsNewListModalOpen(true)}
          className="bg-accent hover:bg-accent/90 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 active:scale-95 will-change-transform shadow-sm"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          Yeni Liste
        </button>
      </div>

      {localListeler?.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {localListeler.map((liste: any) => {
            const progress = liste.toplam_kisi > 0 
              ? Math.round((liste.tamamlanan / liste.toplam_kisi) * 100) 
              : 0;

            return (
              <div key={liste.id} className="bg-surface rounded-xl border border-border p-6 shadow-sm flex flex-col h-full space-y-4 hover:border-accent/30 transition-colors group">
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-lg text-text truncate pr-2" title={liste.liste_ismi}>
                    {liste.liste_ismi}
                  </h3>
                  <Badge variant={liste.aranma_durumu ? "success" : "muted"}>
                    {liste.aranma_durumu ? "Arandı" : "Bekliyor"}
                  </Badge>
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between text-sm text-muted">
                    <span>İlerleme</span>
                    <span className="font-medium text-text">{liste.tamamlanan} / {liste.toplam_kisi}</span>
                  </div>
                  <div className="w-full bg-border rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-accent h-2 rounded-full transition-all duration-500" 
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                <div className="text-xs text-muted pt-4 border-t border-border mt-auto flex justify-between items-center">
                  <span>{formatDate(liste.olusturulma_tarihi)}</span>
                  <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-all duration-150">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setEditingList(liste); setIsEditListModalOpen(true); }}
                      className="text-text font-medium hover:text-accent flex items-center gap-1 active:scale-95 will-change-transform"
                      title="Düzenle"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    </button>
                    <button 
                      onClick={(e) => handleDeleteListe(e, liste.id)}
                      disabled={isDeleting === liste.id}
                      className="text-danger font-medium hover:text-danger/80 flex items-center gap-1 active:scale-95 will-change-transform disabled:opacity-50"
                      title="Sil"
                    >
                      {isDeleting === liste.id ? (
                        <div className="w-3 h-3 border-2 border-danger/30 border-t-danger rounded-full animate-spin" />
                      ) : (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                      )}
                    </button>
                    <button 
                      onClick={() => openListeDetay(liste)}
                      className="text-accent font-medium hover:underline flex items-center gap-1 active:scale-95 will-change-transform"
                    >
                      Detaylar
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-surface border border-border rounded-xl min-h-[400px]">
          <div className="w-16 h-16 bg-bg rounded-full flex items-center justify-center mb-4 text-muted border border-border">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
          </div>
          <h2 className="text-xl font-semibold text-text mb-2">Henüz liste yok</h2>
          <p className="text-muted text-sm mb-6 text-center max-w-sm">İlk arama listenizi oluşturun</p>
          <button 
            onClick={() => setIsNewListModalOpen(true)}
            className="bg-accent hover:bg-accent/90 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm active:scale-95 will-change-transform"
          >
            Liste Oluştur
          </button>
        </div>
      )}

      {/* Yeni Liste Ekleme Modalı */}
      {isNewListModalOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/60 z-50 transition-opacity"
            onClick={() => !isCreatingList && setIsNewListModalOpen(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0 pointer-events-none">
            <div 
              className="bg-surface rounded-2xl shadow-xl w-full max-w-[450px] overflow-hidden pointer-events-auto animate-in fade-in zoom-in-95 duration-200"
              onClick={e => e.stopPropagation()}
            >
              <form onSubmit={handleCreateListe} className="p-8">
                <h3 className="font-semibold text-lg text-text mb-6">Yeni Liste Oluştur</h3>
                
                <div className="space-y-5">
                  <div>
                    <label htmlFor="listName" className="block text-sm font-medium text-text mb-2">
                      Liste İsmi
                    </label>
                    <input
                      id="listName"
                      type="text"
                      required
                      value={newListName}
                      onChange={(e) => setNewListName(e.target.value)}
                      placeholder="Örn: Ocak Ayı Hastaları"
                      disabled={isCreatingList}
                      className="w-full px-4 py-3 bg-surface border border-border/80 rounded-xl text-sm text-text placeholder:text-muted/70 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent disabled:opacity-50 transition-all shadow-sm"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label htmlFor="assistantMessage" className="block text-sm font-medium text-text mb-2">
                      Asistan Mesajı (Opsiyonel)
                    </label>
                    <textarea
                      id="assistantMessage"
                      value={newAssistantMessage}
                      onChange={(e) => setNewAssistantMessage(e.target.value)}
                      placeholder="Asistanın arama sırasında söyleyeceği mesaj..."
                      disabled={isCreatingList}
                      rows={4}
                      className="w-full px-4 py-3 bg-surface border border-border/80 rounded-xl text-sm text-text placeholder:text-muted/70 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent disabled:opacity-50 transition-all shadow-sm resize-none"
                    />
                  </div>
                </div>

                <div className="mt-8 flex gap-3">
                  <button
                    type="submit"
                    disabled={isCreatingList || !newListName.trim()}
                    className="flex-1 py-3 text-sm font-medium text-white bg-accent rounded-xl hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 will-change-transform flex items-center justify-center gap-2 shadow-sm"
                  >
                    {isCreatingList ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      "Oluştur"
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsNewListModalOpen(false)}
                    disabled={isCreatingList}
                    className="flex-1 py-3 text-sm font-medium text-text bg-bg border border-border rounded-xl hover:bg-bg/80 transition-colors disabled:opacity-50 active:scale-95 will-change-transform shadow-sm"
                  >
                    İptal
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}

      {/* Liste Düzenleme Modalı */}
      {isEditListModalOpen && editingList && (
        <>
          <div 
            className="fixed inset-0 bg-black/60 z-50 transition-opacity"
            onClick={() => !isCreatingList && setIsEditListModalOpen(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0 pointer-events-none">
            <div 
              className="bg-surface rounded-2xl shadow-xl w-full max-w-[450px] overflow-hidden pointer-events-auto animate-in fade-in zoom-in-95 duration-200"
              onClick={e => e.stopPropagation()}
            >
              <form onSubmit={handleEditListeSubmit} className="p-8">
                <h3 className="font-semibold text-lg text-text mb-6">Listeyi Düzenle</h3>
                
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-text mb-2">
                      Liste İsmi
                    </label>
                    <input
                      type="text"
                      required
                      value={editingList.liste_ismi}
                      onChange={(e) => setEditingList({...editingList, liste_ismi: e.target.value})}
                      disabled={isCreatingList}
                      className="w-full px-4 py-3 bg-surface border border-border/80 rounded-xl text-sm text-text placeholder:text-muted/70 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent disabled:opacity-50 transition-all shadow-sm"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text mb-2">
                      Asistan Mesajı (Opsiyonel)
                    </label>
                    <textarea
                      value={editingList.asistan_mesaji || ""}
                      onChange={(e) => setEditingList({...editingList, asistan_mesaji: e.target.value})}
                      placeholder="Asistanın arama sırasında söyleyeceği mesaj..."
                      disabled={isCreatingList}
                      rows={4}
                      className="w-full px-4 py-3 bg-surface border border-border/80 rounded-xl text-sm text-text placeholder:text-muted/70 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent disabled:opacity-50 transition-all shadow-sm resize-none"
                    />
                  </div>
                </div>

                <div className="mt-8 flex gap-3">
                  <button
                    type="submit"
                    disabled={isCreatingList || !editingList.liste_ismi.trim()}
                    className="flex-1 py-3 text-sm font-medium text-white bg-accent rounded-xl hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 will-change-transform flex items-center justify-center gap-2 shadow-sm"
                  >
                    {isCreatingList ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      "Güncelle"
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditListModalOpen(false)}
                    disabled={isCreatingList}
                    className="flex-1 py-3 text-sm font-medium text-text bg-bg border border-border rounded-xl hover:bg-bg/80 transition-colors disabled:opacity-50 active:scale-95 will-change-transform shadow-sm"
                  >
                    İptal
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}

      {/* Liste Kişileri Modalı */}
      {selectedListe && (
        <>
          <style>{`
            @keyframes slideIn {
              from { opacity: 0; transform: translateX(20px) translateZ(0); }
              to { opacity: 1; transform: translateX(0) translateZ(0); }
            }
            .animate-slide-in { 
              animation: slideIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards; 
              will-change: transform, opacity;
            }
          `}</style>
          
          <div 
            className="fixed inset-0 bg-black/60 z-40 transition-opacity duration-150"
            onClick={closeListeDetay}
            style={{ opacity: 1, willChange: 'opacity' }}
          />

          <div 
            className="fixed inset-y-0 right-0 z-50 w-full max-w-4xl bg-surface shadow-2xl border-l border-border flex flex-col animate-slide-in transform-gpu"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-border bg-bg/50">
              <div>
                <h2 className="text-xl font-bold font-display text-text flex items-center gap-3">
                  {selectedListe.liste_ismi}
                  <Badge variant={selectedListe.aranma_durumu ? "success" : "muted"}>
                    {selectedListe.aranma_durumu ? "Arandı" : "Bekliyor"}
                  </Badge>
                </h2>
                <div className="flex items-center gap-4 text-xs text-muted mt-2">
                  <button 
                    onClick={() => toggleAramaDurumu(selectedListe)}
                    disabled={isTogglingStatus}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded border text-[10px] font-medium transition-colors ${
                      selectedListe.aranma_durumu 
                        ? "bg-danger/10 border-danger/30 text-danger hover:bg-danger/20" 
                        : "bg-success/10 border-success/30 text-success hover:bg-success/20"
                    }`}
                  >
                    {isTogglingStatus ? (
                      <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : selectedListe.aranma_durumu ? (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" stroke="none"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
                    ) : (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                    )}
                    {selectedListe.aranma_durumu ? "Aramayı Durdur" : "Aramayı Başlat"}
                  </button>
                  <span className="flex items-center gap-1">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                    Toplam: {selectedListe.toplam_kisi}
                  </span>
                  <span className="flex items-center gap-1">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    Tamamlanan: {selectedListe.tamamlanan}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                
                {/* Ekleme Menüsü */}
                <div className="relative">
                  <button 
                    onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
                    disabled={isUploading || loading}
                    className="px-3 py-1.5 bg-surface border border-border text-text rounded-md text-xs font-medium hover:bg-bg transition-colors duration-75 active:scale-95 will-change-transform flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUploading ? (
                      <div className="w-3 h-3 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    )}
                    Kişi Ekle
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-200 ${isAddMenuOpen ? 'rotate-180' : ''}`}><polyline points="6 9 12 15 18 9"></polyline></svg>
                  </button>

                  {isAddMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsAddMenuOpen(false)}></div>
                      <div className="absolute right-0 mt-2 w-48 bg-surface border border-border rounded-lg shadow-lg overflow-hidden z-50 animate-in slide-in-from-top-2 duration-150">
                        <button 
                          onClick={() => { setIsManualAddOpen(true); setIsAddMenuOpen(false); }}
                          className="w-full text-left px-4 py-2.5 text-sm text-text hover:bg-bg transition-colors flex items-center gap-2 border-b border-border/50"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>
                          Manuel Ekle
                        </button>
                        <button 
                          onClick={() => { openRandevuAddModal(); setIsAddMenuOpen(false); }}
                          className="w-full text-left px-4 py-2.5 text-sm text-text hover:bg-bg transition-colors flex items-center gap-2 border-b border-border/50"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                          Randevulardan Ekle
                        </button>
                        <button 
                          onClick={() => { fileInputRef.current?.click(); setIsAddMenuOpen(false); }}
                          className="w-full text-left px-4 py-2.5 text-sm text-text hover:bg-bg transition-colors flex items-center gap-2"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                          CSV Yükle
                        </button>
                      </div>
                    </>
                  )}
                </div>
                
                {/* CSV Gizli Input */}
                <input 
                  type="file" 
                  accept=".csv" 
                  className="hidden" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                />

                <button 
                  onClick={closeListeDetay}
                  className="p-2 text-muted hover:text-text hover:bg-bg rounded-lg transition-all duration-75 active:scale-90 will-change-transform"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 bg-surface">
              
              {/* CSV Upload Message */}
              {uploadMessage && (
                <div className={`mb-4 p-3 rounded-lg text-sm flex items-center gap-2 border ${
                  uploadMessage.type === "success" 
                    ? "bg-success/10 text-success border-success/20" 
                    : "bg-danger/10 text-danger border-danger/20"
                }`}>
                  <div className={`w-2 h-2 rounded-full ${uploadMessage.type === "success" ? "bg-success" : "bg-danger"}`} />
                  {uploadMessage.text}
                </div>
              )}

              {loading ? (
                <div className="flex justify-center items-center py-20">
                  <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin"></div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Asistan Mesajı Özeti */}
                  {selectedListe.asistan_mesaji && (
                    <div className="bg-bg/50 border border-border rounded-xl p-4">
                      <div className="text-xs font-semibold text-text mb-2 flex items-center gap-2">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                        Asistan Mesajı (Prompt)
                      </div>
                      <p className="text-sm text-muted">{selectedListe.asistan_mesaji}</p>
                    </div>
                  )}

                  {/* Filtreleme Seçenekleri */}
                  <div className="flex items-center gap-2 pb-2 overflow-x-auto custom-scrollbar">
                    {["Tümü", "bekliyor", "aramada", "basarili", "mesgul"].map((durum) => {
                      const count = durum === "Tümü" 
                        ? listeKisileri.length 
                        : listeKisileri.filter(k => k.arama_durumu === durum).length;

                      const isSelected = filterDurum === durum;
                      
                      return (
                        <button
                          key={durum}
                          onClick={() => setFilterDurum(durum)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors duration-150 border flex items-center gap-1.5 ${
                            isSelected 
                              ? "bg-text text-surface border-transparent" 
                              : "bg-surface border-border text-muted hover:text-text hover:bg-bg"
                          }`}
                        >
                          {durum === "Tümü" ? "Tümü" : durum.charAt(0).toUpperCase() + durum.slice(1)}
                          <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                            isSelected ? "bg-surface/20 text-surface" : "bg-bg text-muted"
                          }`}>
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Kişi Düzenleme Modalı */}
                  {isEditKisiOpen && editingKisi && (
                    <>
                      <div className="fixed inset-0 bg-black/50 z-[60]" onClick={() => !isKisiUpdating && setIsEditKisiOpen(false)}></div>
                      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[70] bg-surface rounded-xl shadow-2xl w-full max-w-sm border border-border p-6 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-5">
                          <h3 className="font-semibold text-lg text-text">Kişi Düzenle</h3>
                          <button onClick={() => setIsEditKisiOpen(false)} className="text-muted hover:text-text" disabled={isKisiUpdating}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                          </button>
                        </div>
                        <form onSubmit={handleEditKisiSubmit} className="space-y-4">
                          <div>
                            <label className="block text-sm text-text mb-1">Ad <span className="text-danger">*</span></label>
                            <input type="text" required value={editingKisi.isim} onChange={e => setEditingKisi({...editingKisi, isim: e.target.value})} disabled={isKisiUpdating} className="w-full px-3 py-2 bg-bg border border-border rounded-lg text-sm" placeholder="Ad girin" autoFocus />
                          </div>
                          <div>
                            <label className="block text-sm text-text mb-1">Soyad</label>
                            <input type="text" value={editingKisi.soyisim || ""} onChange={e => setEditingKisi({...editingKisi, soyisim: e.target.value})} disabled={isKisiUpdating} className="w-full px-3 py-2 bg-bg border border-border rounded-lg text-sm" placeholder="Soyad girin" />
                          </div>
                          <div>
                            <label className="block text-sm text-text mb-1">Telefon <span className="text-danger">*</span></label>
                            <input type="tel" required value={editingKisi.telefon} onChange={e => setEditingKisi({...editingKisi, telefon: e.target.value})} disabled={isKisiUpdating} className="w-full px-3 py-2 bg-bg border border-border rounded-lg text-sm font-mono" placeholder="05XX XXX XX XX" />
                          </div>
                          <div className="pt-2 flex justify-end gap-2">
                            <button type="button" onClick={() => setIsEditKisiOpen(false)} disabled={isKisiUpdating} className="px-4 py-2 text-sm bg-bg border border-border rounded-lg text-text hover:bg-bg/80 transition-colors">İptal</button>
                            <button type="submit" disabled={isKisiUpdating || !editingKisi.isim || !editingKisi.telefon} className="px-4 py-2 text-sm bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors flex items-center gap-2">
                              {isKisiUpdating && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
                              Güncelle
                            </button>
                          </div>
                        </form>
                      </div>
                    </>
                  )}

                  {/* Manuel Kişi Ekleme Modalı */}
                  {isManualAddOpen && (
                    <>
                      <div className="fixed inset-0 bg-black/50 z-[60]" onClick={() => !isManualAdding && setIsManualAddOpen(false)}></div>
                      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[70] bg-surface rounded-xl shadow-2xl w-full max-w-sm border border-border p-6 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-5">
                          <h3 className="font-semibold text-lg text-text">Manuel Kişi Ekle</h3>
                          <button onClick={() => setIsManualAddOpen(false)} className="text-muted hover:text-text" disabled={isManualAdding}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                          </button>
                        </div>
                        <form onSubmit={handleManualAddSubmit} className="space-y-4">
                          <div>
                            <label className="block text-sm text-text mb-1">Ad <span className="text-danger">*</span></label>
                            <input type="text" required value={manualKisi.isim} onChange={e => setManualKisi({...manualKisi, isim: e.target.value})} disabled={isManualAdding} className="w-full px-3 py-2 bg-bg border border-border rounded-lg text-sm" placeholder="Ad girin" autoFocus />
                          </div>
                          <div>
                            <label className="block text-sm text-text mb-1">Soyad</label>
                            <input type="text" value={manualKisi.soyisim} onChange={e => setManualKisi({...manualKisi, soyisim: e.target.value})} disabled={isManualAdding} className="w-full px-3 py-2 bg-bg border border-border rounded-lg text-sm" placeholder="Soyad girin" />
                          </div>
                          <div>
                            <label className="block text-sm text-text mb-1">Telefon <span className="text-danger">*</span></label>
                            <input type="tel" required value={manualKisi.telefon} onChange={e => setManualKisi({...manualKisi, telefon: e.target.value})} disabled={isManualAdding} className="w-full px-3 py-2 bg-bg border border-border rounded-lg text-sm font-mono" placeholder="05XX XXX XX XX" />
                          </div>
                          <div className="pt-2 flex justify-end gap-2">
                            <button type="button" onClick={() => setIsManualAddOpen(false)} disabled={isManualAdding} className="px-4 py-2 text-sm bg-bg border border-border rounded-lg text-text hover:bg-bg/80 transition-colors">İptal</button>
                            <button type="submit" disabled={isManualAdding || !manualKisi.isim || !manualKisi.telefon} className="px-4 py-2 text-sm bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors flex items-center gap-2">
                              {isManualAdding && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
                              Ekle
                            </button>
                          </div>
                        </form>
                      </div>
                    </>
                  )}

                  {/* Randevulardan Seçme Modalı */}
                  {isRandevuAddOpen && (
                    <>
                      <div className="fixed inset-0 bg-black/50 z-[60]" onClick={() => !isAddingFromRandevu && setIsRandevuAddOpen(false)}></div>
                      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[70] bg-surface rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col border border-border animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center p-5 border-b border-border">
                          <div>
                            <h3 className="font-semibold text-lg text-text">Randevulu Hastalardan Seç</h3>
                            <p className="text-xs text-muted mt-0.5">Sistemde kayıtlı olan hastaları listeye ekleyin.</p>
                          </div>
                          <button onClick={() => setIsRandevuAddOpen(false)} className="text-muted hover:text-text" disabled={isAddingFromRandevu}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                          </button>
                        </div>
                        
                        <div className="p-4 border-b border-border bg-bg/50">
                          <div className="relative">
                            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                            <input 
                              type="text" 
                              value={randevuArama}
                              onChange={e => setRandevuArama(e.target.value)}
                              placeholder="İsim veya telefona göre ara..." 
                              className="w-full pl-9 pr-4 py-2 bg-surface border border-border rounded-lg text-sm"
                            />
                          </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-0">
                          {isLoadingRandevuKisiler ? (
                            <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin"></div></div>
                          ) : (
                            <div className="divide-y divide-border">
                              {randevuKisiler.filter(r => {
                                const adSoyad = `${r.randevu_kisi?.isim || ""} ${r.randevu_kisi?.soyisim || ""}`.toLowerCase();
                                const tel = r.randevu_kisi?.telefon || "";
                                const doktorAd = `${r.doktor?.ad || ""} ${r.doktor?.soyad || ""}`.toLowerCase();
                                const hizmet = r.hizmetler?.hizmet_adi?.toLowerCase() || "";
                                const uzmanlik = r.doktor?.uzmanliklar?.ad?.toLowerCase() || "";
                                
                                const arama = randevuArama.toLowerCase();
                                return adSoyad.includes(arama) || tel.includes(arama) || doktorAd.includes(arama) || hizmet.includes(arama) || uzmanlik.includes(arama);
                              }).length === 0 ? (
                                <div className="p-8 text-center text-muted text-sm">Arama kriterlerine uygun randevu bulunamadı.</div>
                              ) : (
                                randevuKisiler.filter(r => {
                                  const adSoyad = `${r.randevu_kisi?.isim || ""} ${r.randevu_kisi?.soyisim || ""}`.toLowerCase();
                                  const tel = r.randevu_kisi?.telefon || "";
                                  const doktorAd = `${r.doktor?.ad || ""} ${r.doktor?.soyad || ""}`.toLowerCase();
                                  const hizmet = r.hizmetler?.hizmet_adi?.toLowerCase() || "";
                                  const uzmanlik = r.doktor?.uzmanliklar?.ad?.toLowerCase() || "";
                                  
                                  const arama = randevuArama.toLowerCase();
                                  return adSoyad.includes(arama) || tel.includes(arama) || doktorAd.includes(arama) || hizmet.includes(arama) || uzmanlik.includes(arama);
                                }).map(randevu => (
                                  <label key={randevu.id} className="flex items-start gap-3 p-4 hover:bg-bg/50 cursor-pointer transition-colors group">
                                    <input 
                                      type="checkbox" 
                                      checked={selectedRandevuIds.includes(randevu.id)}
                                      onChange={(e) => {
                                        if (e.target.checked) setSelectedRandevuIds([...selectedRandevuIds, randevu.id]);
                                        else setSelectedRandevuIds(selectedRandevuIds.filter(id => id !== randevu.id));
                                      }}
                                      className="w-4 h-4 mt-1 rounded border-border text-accent focus:ring-accent/20"
                                    />
                                    <div className="flex-1 min-w-0">
                                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 sm:gap-4 mb-1.5">
                                        <div>
                                          <div className="text-sm font-medium text-text group-hover:text-accent transition-colors">
                                            {randevu.randevu_kisi?.isim} {randevu.randevu_kisi?.soyisim}
                                          </div>
                                          <div className="text-xs text-muted font-mono">{randevu.randevu_kisi?.telefon}</div>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs text-muted whitespace-nowrap bg-bg/50 px-2 py-1 rounded-md border border-border/50">
                                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                                          {formatDate(randevu.randevu_tarihi)}
                                        </div>
                                      </div>
                                      
                                      <div className="flex flex-wrap gap-2 mt-2">
                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-accent/10 text-accent text-[10px] font-medium">
                                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>
                                          {randevu.hizmetler?.hizmet_adi || 'Hizmet Yok'}
                                        </span>
                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-surface border border-border text-muted text-[10px] font-medium">
                                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg>
                                          {randevu.doktor?.uzmanliklar?.ad || 'Uzmanlık Yok'}
                                        </span>
                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-surface border border-border text-muted text-[10px] font-medium">
                                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                                          Dr. {randevu.doktor?.ad} {randevu.doktor?.soyad}
                                        </span>
                                      </div>
                                    </div>
                                  </label>
                                ))
                              )}
                            </div>
                          )}
                        </div>

                        <div className="p-4 border-t border-border bg-bg/50 flex justify-between items-center">
                          <div className="text-sm text-muted">
                            <span className="font-medium text-text">{selectedRandevuIds.length}</span> randevu seçildi
                          </div>
                          <div className="flex gap-2">
                            <button type="button" onClick={() => setIsRandevuAddOpen(false)} disabled={isAddingFromRandevu} className="px-4 py-2 text-sm bg-surface border border-border rounded-lg text-text hover:bg-bg transition-colors">İptal</button>
                            <button 
                              onClick={handleAddFromRandevu} 
                              disabled={isAddingFromRandevu || selectedRandevuIds.length === 0} 
                              className="px-4 py-2 text-sm bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors flex items-center gap-2 disabled:opacity-50"
                            >
                              {isAddingFromRandevu && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
                              Seçilenleri Ekle
                            </button>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Kişiler Tablosu */}
                  <div className="border border-border rounded-xl overflow-hidden shadow-sm">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-bg/50">
                          <TableHead>Ad Soyad</TableHead>
                          <TableHead>Telefon</TableHead>
                          <TableHead>Durum</TableHead>
                          <TableHead className="text-right">İşlemler</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredKisiler.length > 0 ? (
                          filteredKisiler.map((kisi) => (
                            <TableRow key={kisi.id} className="hover:bg-bg/30">
                              <TableCell className="font-medium text-text">
                                {kisi.isim} {kisi.soyisim}
                              </TableCell>
                              <TableCell className="font-mono text-xs text-muted">
                                {kisi.telefon}
                              </TableCell>
                              <TableCell>
                                <Badge variant={getAramaDurumuBadge(kisi.arama_durumu)}>
                                  {formatAramaDurumu(kisi.arama_durumu)}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => { setEditingKisi(kisi); setIsEditKisiOpen(true); }}
                                    className="p-1.5 text-muted hover:text-accent rounded-md hover:bg-bg transition-colors"
                                    title="Düzenle"
                                  >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                  </button>
                                  <button
                                    onClick={() => handleDeleteKisi(kisi.id)}
                                    className="p-1.5 text-muted hover:text-danger rounded-md hover:bg-danger/10 transition-colors"
                                    title="Sil"
                                  >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                                  </button>
                                  <button
                                    onClick={() => setSelectedKisi(selectedKisi?.id === kisi.id ? null : kisi)}
                                    className={`inline-flex items-center justify-center px-3 py-1.5 ml-1 text-xs font-medium border rounded-md transition-colors duration-75 active:scale-95 will-change-transform ${
                                      selectedKisi?.id === kisi.id 
                                        ? "bg-accent/10 border-accent/30 text-accent" 
                                        : "bg-surface border-border text-text hover:bg-bg"
                                    }`}
                                  >
                                    {selectedKisi?.id === kisi.id ? "Gizle" : "Detay"}
                                  </button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-8 text-muted">
                              {filterDurum !== "Tümü" ? "Bu filtrede gösterilecek kişi bulunamadı." : "Bu listeye henüz kişi eklenmemiş."}
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  
                  {/* Seçili Kişi Arama Detayı (Hemen Altında Belirir) */}
                  {selectedKisi && (
                    <div className="bg-bg/50 border border-border rounded-xl p-5 shadow-sm animate-modal-content transform-gpu mt-4">
                      <div className="flex justify-between items-center mb-4 pb-3 border-b border-border">
                        <h3 className="font-semibold text-text flex items-center gap-2">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                          {selectedKisi.isim} {selectedKisi.soyisim} - Arama Sonucu
                        </h3>
                      </div>
                      
                      {selectedKisi.arama_kayit && selectedKisi.arama_kayit.length > 0 ? (
                        <div className="space-y-4">
                          {selectedKisi.arama_kayit.map((kayit: any, idx: number) => (
                            <div key={kayit.id} className="bg-surface border border-border/60 rounded-lg p-4 space-y-4 shadow-sm">
                              <div className="flex flex-wrap gap-4 text-xs bg-bg/50 p-2 rounded-md border border-border/30">
                                <span className="text-muted">Tarih: {formatDate(kayit.kayit_tarihi)}</span>
                                <span className="text-muted">Süre: {formatDuration(kayit.cagri_suresi)}</span>
                                <span className="text-muted">Maliyet: {formatCurrency(kayit.maliyet)}</span>
                              </div>
                              
                              {kayit.ozet && (
                                <div>
                                  <div className="text-xs font-semibold text-text mb-1">Çağrı Özeti</div>
                                  <div className="text-sm text-muted bg-bg/30 p-3 rounded-lg leading-relaxed">{kayit.ozet}</div>
                                </div>
                              )}

                              {kayit.transkript && (
                                <div>
                                  <div className="text-xs font-semibold text-text mb-1">Transkript</div>
                                  <div className="text-sm text-muted bg-bg/30 p-3 rounded-lg max-h-32 overflow-y-auto custom-scrollbar whitespace-pre-wrap leading-relaxed border border-border/30">{kayit.transkript}</div>
                                </div>
                              )}

                              {kayit.kayit_url && (
                                <div>
                                  <div className="text-xs font-semibold text-text mb-1">Ses Kaydı</div>
                                  <div className="flex items-center gap-3 bg-bg/30 p-2 rounded-lg border border-border/30">
                                    <audio controls className="h-8 flex-1" src={kayit.kayit_url}>Tarayıcı desteklenmiyor.</audio>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6 text-muted bg-surface rounded-lg border border-dashed border-border">
                          <p className="text-sm">Bu kişi için henüz bir arama kaydı bulunmuyor.</p>
                          <p className="text-xs mt-1">Sistem tarafından arama yapıldığında sonuçlar burada görünecektir.</p>
                        </div>
                      )}
                    </div>
                  )}
                  
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
