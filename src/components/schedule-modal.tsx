"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { DoktorCalismaProgrami, DoktorIzin, IzinTuru } from "@/lib/types";

const GUN_ISIMLERI = [
    "Pazartesi",
    "Salı",
    "Çarşamba",
    "Perşembe",
    "Cuma",
    "Cumartesi",
    "Pazar",
];

const IZIN_TURLERI: { value: IzinTuru; label: string }[] = [
    { value: "yillik_izin", label: "Yıllık İzin" },
    { value: "hastalik", label: "Hastalık İzni" },
    { value: "diger", label: "Diğer" },
];

interface SaatAraligi {
    id?: string;
    baslangic_saat: string;
    bitis_saat: string;
}

interface GunProgrami {
    gun: number;
    aktif: boolean;
    saatler: SaatAraligi[];
}

interface ScheduleModalProps {
    doktorId: string;
    doktorAd: string;
    isOpen: boolean;
    onClose: () => void;
}

export function ScheduleModal({
    doktorId,
    doktorAd,
    isOpen,
    onClose,
}: ScheduleModalProps) {
    const supabase = createClient();
    const [tab, setTab] = useState<"program" | "izin">("program");
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [successMsg, setSuccessMsg] = useState("");

    // Program state
    const [gunProgram, setGunProgram] = useState<GunProgrami[]>(
        GUN_ISIMLERI.map((_, i) => ({
            gun: i,
            aktif: false,
            saatler: [{ baslangic_saat: "09:00", bitis_saat: "17:00" }],
        }))
    );

    // İzin state
    const [izinler, setIzinler] = useState<DoktorIzin[]>([]);
    const [yeniIzin, setYeniIzin] = useState({
        baslangic_tarihi: "",
        bitis_tarihi: "",
        izin_turu: "yillik_izin" as IzinTuru,
        not_bilgi: "",
    });

    // Verileri yükle
    useEffect(() => {
        if (isOpen) {
            loadData();
        }
    }, [isOpen, doktorId]);

    const loadData = async () => {
        setLoading(true);
        try {
            // Çalışma programını yükle
            const { data: programData } = await supabase
                .from("doktor_calisma_programi")
                .select("*")
                .eq("doktor_id", doktorId)
                .order("gun", { ascending: true })
                .order("baslangic_saat", { ascending: true });

            if (programData && programData.length > 0) {
                const yeniProgram: GunProgrami[] = GUN_ISIMLERI.map((_, i) => {
                    const gunKayitlari = programData.filter(
                        (k: DoktorCalismaProgrami) => k.gun === i
                    );
                    if (gunKayitlari.length > 0) {
                        return {
                            gun: i,
                            aktif: gunKayitlari.some((k: DoktorCalismaProgrami) => k.aktif),
                            saatler: gunKayitlari.map((k: DoktorCalismaProgrami) => ({
                                id: k.id,
                                baslangic_saat: k.baslangic_saat.substring(0, 5),
                                bitis_saat: k.bitis_saat.substring(0, 5),
                            })),
                        };
                    }
                    return {
                        gun: i,
                        aktif: false,
                        saatler: [{ baslangic_saat: "09:00", bitis_saat: "17:00" }],
                    };
                });
                setGunProgram(yeniProgram);
            }

            // İzinleri yükle
            const { data: izinData } = await supabase
                .from("doktor_izin")
                .select("*")
                .eq("doktor_id", doktorId)
                .order("baslangic_tarihi", { ascending: true });

            if (izinData) {
                setIzinler(izinData);
            }
        } catch (err) {
            console.error("Veri yükleme hatası:", err);
        }
        setLoading(false);
    };

    // --- PROGRAM FONKSİYONLARI ---

    const toggleGun = (gunIndex: number) => {
        setGunProgram((prev) =>
            prev.map((g) => (g.gun === gunIndex ? { ...g, aktif: !g.aktif } : g))
        );
    };

    const updateSaat = (
        gunIndex: number,
        saatIndex: number,
        field: "baslangic_saat" | "bitis_saat",
        value: string
    ) => {
        setGunProgram((prev) =>
            prev.map((g) =>
                g.gun === gunIndex
                    ? {
                        ...g,
                        saatler: g.saatler.map((s, si) =>
                            si === saatIndex ? { ...s, [field]: value } : s
                        ),
                    }
                    : g
            )
        );
    };

    const addSaatAraligi = (gunIndex: number) => {
        setGunProgram((prev) =>
            prev.map((g) =>
                g.gun === gunIndex
                    ? {
                        ...g,
                        saatler: [
                            ...g.saatler,
                            { baslangic_saat: "13:00", bitis_saat: "17:00" },
                        ],
                    }
                    : g
            )
        );
    };

    const removeSaatAraligi = (gunIndex: number, saatIndex: number) => {
        setGunProgram((prev) =>
            prev.map((g) =>
                g.gun === gunIndex && g.saatler.length > 1
                    ? {
                        ...g,
                        saatler: g.saatler.filter((_, si) => si !== saatIndex),
                    }
                    : g
            )
        );
    };

    const saveProgram = async () => {
        setSaving(true);
        try {
            // Mevcut kayıtları sil
            await supabase
                .from("doktor_calisma_programi")
                .delete()
                .eq("doktor_id", doktorId);

            // Yeni kayıtları ekle
            const kayitlar: Omit<DoktorCalismaProgrami, "id" | "olusturulma_tarihi">[] = [];
            gunProgram.forEach((g) => {
                g.saatler.forEach((s) => {
                    kayitlar.push({
                        doktor_id: doktorId,
                        gun: g.gun,
                        baslangic_saat: s.baslangic_saat + ":00",
                        bitis_saat: s.bitis_saat + ":00",
                        aktif: g.aktif,
                    });
                });
            });

            if (kayitlar.length > 0) {
                await supabase.from("doktor_calisma_programi").insert(kayitlar);
            }

            setSuccessMsg("Çalışma programı kaydedildi!");
            setTimeout(() => setSuccessMsg(""), 3000);
        } catch (err) {
            console.error("Kaydetme hatası:", err);
        }
        setSaving(false);
    };

    // --- İZİN FONKSİYONLARI ---

    const addIzin = async () => {
        if (!yeniIzin.baslangic_tarihi || !yeniIzin.bitis_tarihi) return;

        setSaving(true);
        try {
            const { data, error } = await supabase
                .from("doktor_izin")
                .insert({
                    doktor_id: doktorId,
                    baslangic_tarihi: yeniIzin.baslangic_tarihi,
                    bitis_tarihi: yeniIzin.bitis_tarihi,
                    izin_turu: yeniIzin.izin_turu,
                    not_bilgi: yeniIzin.not_bilgi || null,
                })
                .select()
                .single();

            if (data) {
                setIzinler((prev) => [...prev, data]);
                setYeniIzin({
                    baslangic_tarihi: "",
                    bitis_tarihi: "",
                    izin_turu: "yillik_izin",
                    not_bilgi: "",
                });
                setSuccessMsg("İzin kaydedildi!");
                setTimeout(() => setSuccessMsg(""), 3000);
            }
            if (error) console.error("İzin ekleme hatası:", error);
        } catch (err) {
            console.error("İzin ekleme hatası:", err);
        }
        setSaving(false);
    };

    const deleteIzin = async (izinId: string) => {
        try {
            await supabase.from("doktor_izin").delete().eq("id", izinId);
            setIzinler((prev) => prev.filter((i) => i.id !== izinId));
        } catch (err) {
            console.error("İzin silme hatası:", err);
        }
    };

    const formatIzinTuru = (turu: IzinTuru) => {
        return IZIN_TURLERI.find((t) => t.value === turu)?.label || turu;
    };

    if (!isOpen) return null;

    return (
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
                onClick={onClose}
            />

            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div
                    className="bg-surface rounded-2xl border border-border shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-modal-content transform-gpu"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-bg/50">
                        <div>
                            <h2 className="text-lg font-bold font-display text-text">
                                {doktorAd} - Çalışma Programı
                            </h2>
                            <p className="text-xs text-muted mt-0.5">
                                Haftalık program ve izin yönetimi
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-muted hover:text-text hover:bg-bg rounded-lg transition-all duration-75 active:scale-90 will-change-transform"
                        >
                            <svg
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-border px-6">
                        <button
                            onClick={() => setTab("program")}
                            className={`px-4 py-3 text-sm font-medium border-b-2 transition-all duration-75 active:scale-95 will-change-transform ${tab === "program"
                                ? "border-accent text-accent"
                                : "border-transparent text-muted hover:text-text"
                                }`}
                        >
                            <span className="flex items-center gap-2">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                    <line x1="16" y1="2" x2="16" y2="6" />
                                    <line x1="8" y1="2" x2="8" y2="6" />
                                    <line x1="3" y1="10" x2="21" y2="10" />
                                </svg>
                                Haftalık Program
                            </span>
                        </button>
                        <button
                            onClick={() => setTab("izin")}
                            className={`px-4 py-3 text-sm font-medium border-b-2 transition-all duration-75 active:scale-95 will-change-transform ${tab === "izin"
                                ? "border-accent text-accent"
                                : "border-transparent text-muted hover:text-text"
                                }`}
                        >
                            <span className="flex items-center gap-2">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M17 18a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2" />
                                    <rect x="3" y="4" width="18" height="18" rx="2" />
                                    <circle cx="12" cy="10" r="2" />
                                    <line x1="8" y1="2" x2="8" y2="4" />
                                    <line x1="16" y1="2" x2="16" y2="4" />
                                </svg>
                                İzin Yönetimi
                            </span>
                        </button>
                    </div>

                    {/* Success Message */}
                    {successMsg && (
                        <div className="mx-6 mt-4 px-4 py-2.5 bg-success/10 text-success text-sm font-medium rounded-lg border border-success/20 flex items-center gap-2">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                            {successMsg}
                        </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
                            </div>
                        ) : tab === "program" ? (
                            /* ============ HAFTALIK PROGRAM SEKMESİ ============ */
                            <div className="space-y-3">
                                {gunProgram.map((g) => (
                                    <div
                                        key={g.gun}
                                        className={`rounded-xl border transition-all ${g.aktif
                                            ? "border-accent/30 bg-accent/[0.03]"
                                            : "border-border bg-bg/50"
                                            }`}
                                    >
                                        {/* Gün header */}
                                        <div className="flex items-center justify-between px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                {/* Toggle */}
                                                <button
                                                    onClick={() => toggleGun(g.gun)}
                                                    className={`relative w-11 h-6 rounded-full transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-accent/40 focus:ring-offset-1 active:scale-95 will-change-transform ${g.aktif ? "bg-accent shadow-inner" : "bg-border"
                                                        }`}
                                                >
                                                    <span
                                                        className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-150 ease-in-out will-change-transform ${g.aktif ? "translate-x-[20px]" : "translate-x-0"
                                                            } left-0.5`}
                                                    />
                                                </button>
                                                <span
                                                    className={`text-sm font-semibold ${g.aktif ? "text-text" : "text-muted"
                                                        }`}
                                                >
                                                    {GUN_ISIMLERI[g.gun]}
                                                </span>
                                            </div>

                                            {g.aktif && (
                                                <button
                                                    onClick={() => addSaatAraligi(g.gun)}
                                                    className="text-xs text-accent hover:text-accent/80 font-medium flex items-center gap-1 transition-all duration-75 active:scale-90 will-change-transform px-2 py-1 rounded hover:bg-accent/5"
                                                >
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <line x1="12" y1="5" x2="12" y2="19" />
                                                        <line x1="5" y1="12" x2="19" y2="12" />
                                                    </svg>
                                                    Saat Ekle
                                                </button>
                                            )}
                                        </div>

                                        {/* Saat aralıkları */}
                                        {g.aktif && (
                                            <div className="px-4 pb-3 space-y-2">
                                                {g.saatler.map((s, si) => (
                                                    <div
                                                        key={si}
                                                        className="flex items-center gap-2 bg-surface rounded-lg border border-border px-3 py-2"
                                                    >
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted flex-shrink-0">
                                                            <circle cx="12" cy="12" r="10" />
                                                            <polyline points="12 6 12 12 16 14" />
                                                        </svg>
                                                        <input
                                                            type="time"
                                                            value={s.baslangic_saat}
                                                            onChange={(e) =>
                                                                updateSaat(
                                                                    g.gun,
                                                                    si,
                                                                    "baslangic_saat",
                                                                    e.target.value
                                                                )
                                                            }
                                                            className="text-sm bg-transparent text-text focus:outline-none w-24"
                                                        />
                                                        <span className="text-muted text-xs">—</span>
                                                        <input
                                                            type="time"
                                                            value={s.bitis_saat}
                                                            onChange={(e) =>
                                                                updateSaat(
                                                                    g.gun,
                                                                    si,
                                                                    "bitis_saat",
                                                                    e.target.value
                                                                )
                                                            }
                                                            className="text-sm bg-transparent text-text focus:outline-none w-24"
                                                        />

                                                        {g.saatler.length > 1 && (
                                                            <button
                                                                onClick={() => removeSaatAraligi(g.gun, si)}
                                                                className="ml-auto p-1.5 text-muted hover:text-danger bg-transparent hover:bg-danger/10 transition-all duration-75 active:scale-75 will-change-transform rounded-md"
                                                                title="Saat aralığını sil"
                                                            >
                                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                    <polyline points="3 6 5 6 21 6" />
                                                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                                                </svg>
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            /* ============ İZİN YÖNETİMİ SEKMESİ ============ */
                            <div className="space-y-6">
                                {/* İzin Ekleme Formu */}
                                <div className="bg-bg/80 rounded-xl border border-border p-5">
                                    <h3 className="text-sm font-semibold text-text mb-4 flex items-center gap-2">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <line x1="12" y1="5" x2="12" y2="19" />
                                            <line x1="5" y1="12" x2="19" y2="12" />
                                        </svg>
                                        Yeni İzin Ekle
                                    </h3>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-medium text-muted mb-1">
                                                Başlangıç Tarihi *
                                            </label>
                                            <input
                                                type="date"
                                                value={yeniIzin.baslangic_tarihi}
                                                onChange={(e) =>
                                                    setYeniIzin((p) => ({
                                                        ...p,
                                                        baslangic_tarihi: e.target.value,
                                                    }))
                                                }
                                                className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-surface text-text focus:outline-none focus:ring-2 focus:ring-accent/50"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-muted mb-1">
                                                Bitiş Tarihi *
                                            </label>
                                            <input
                                                type="date"
                                                value={yeniIzin.bitis_tarihi}
                                                onChange={(e) =>
                                                    setYeniIzin((p) => ({
                                                        ...p,
                                                        bitis_tarihi: e.target.value,
                                                    }))
                                                }
                                                className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-surface text-text focus:outline-none focus:ring-2 focus:ring-accent/50"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-muted mb-1">
                                                İzin Türü
                                            </label>
                                            <select
                                                value={yeniIzin.izin_turu}
                                                onChange={(e) =>
                                                    setYeniIzin((p) => ({
                                                        ...p,
                                                        izin_turu: e.target.value as IzinTuru,
                                                    }))
                                                }
                                                className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-surface text-text focus:outline-none focus:ring-2 focus:ring-accent/50"
                                            >
                                                {IZIN_TURLERI.map((t) => (
                                                    <option key={t.value} value={t.value}>
                                                        {t.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-muted mb-1">
                                                Not (İsteğe Bağlı)
                                            </label>
                                            <input
                                                type="text"
                                                value={yeniIzin.not_bilgi}
                                                onChange={(e) =>
                                                    setYeniIzin((p) => ({
                                                        ...p,
                                                        not_bilgi: e.target.value,
                                                    }))
                                                }
                                                placeholder="Örn: Tatil, ameliyat sonrası..."
                                                className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-surface text-text focus:outline-none focus:ring-2 focus:ring-accent/50 placeholder:text-muted/50"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        onClick={addIzin}
                                        disabled={
                                            saving ||
                                            !yeniIzin.baslangic_tarihi ||
                                            !yeniIzin.bitis_tarihi
                                        }
                                        className="mt-4 px-5 py-2.5 bg-accent text-white text-sm font-medium rounded-lg hover:bg-accent/90 transition-all duration-75 active:scale-95 will-change-transform disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {saving ? (
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <line x1="12" y1="5" x2="12" y2="19" />
                                                <line x1="5" y1="12" x2="19" y2="12" />
                                            </svg>
                                        )}
                                        İzin Ekle
                                    </button>
                                </div>

                                {/* İzin Listesi */}
                                <div>
                                    <h3 className="text-sm font-semibold text-text mb-3">
                                        Mevcut İzinler
                                    </h3>

                                    {izinler.length === 0 ? (
                                        <div className="text-center py-8 text-muted bg-bg/50 border border-border rounded-xl">
                                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-2 text-muted/50">
                                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                                <line x1="16" y1="2" x2="16" y2="6" />
                                                <line x1="8" y1="2" x2="8" y2="6" />
                                                <line x1="3" y1="10" x2="21" y2="10" />
                                            </svg>
                                            <p className="text-sm">
                                                Henüz kayıtlı izin bulunmuyor.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {izinler.map((izin) => (
                                                <div
                                                    key={izin.id}
                                                    className="flex items-center justify-between bg-surface border border-border rounded-lg px-4 py-3 group hover:border-accent/20 transition-colors"
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div
                                                            className={`w-2 h-2 rounded-full flex-shrink-0 ${izin.izin_turu === "yillik_izin"
                                                                ? "bg-accent"
                                                                : izin.izin_turu === "hastalik"
                                                                    ? "bg-warning"
                                                                    : "bg-muted"
                                                                }`}
                                                        />
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-sm font-medium text-text">
                                                                    {new Date(
                                                                        izin.baslangic_tarihi
                                                                    ).toLocaleDateString("tr-TR", {
                                                                        day: "numeric",
                                                                        month: "short",
                                                                        year: "numeric",
                                                                    })}
                                                                </span>
                                                                <span className="text-muted text-xs">→</span>
                                                                <span className="text-sm font-medium text-text">
                                                                    {new Date(
                                                                        izin.bitis_tarihi
                                                                    ).toLocaleDateString("tr-TR", {
                                                                        day: "numeric",
                                                                        month: "short",
                                                                        year: "numeric",
                                                                    })}
                                                                </span>
                                                                <span
                                                                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${izin.izin_turu === "yillik_izin"
                                                                        ? "bg-accent/10 text-accent"
                                                                        : izin.izin_turu === "hastalik"
                                                                            ? "bg-warning/10 text-warning"
                                                                            : "bg-bg text-muted"
                                                                        }`}
                                                                >
                                                                    {formatIzinTuru(izin.izin_turu)}
                                                                </span>
                                                            </div>
                                                            {izin.not_bilgi && (
                                                                <p className="text-xs text-muted mt-0.5">
                                                                    {izin.not_bilgi}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <button
                                                        onClick={() => deleteIzin(izin.id)}
                                                        className="opacity-0 group-hover:opacity-100 p-1.5 text-muted hover:text-danger hover:bg-danger/10 rounded-lg transition-all duration-75 active:scale-75 will-change-transform"
                                                        title="İzni sil"
                                                    >
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <polyline points="3 6 5 6 21 6" />
                                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer - Sadece program sekmesinde kaydet butonu */}
                    {tab === "program" && (
                        <div className="px-6 py-4 border-t border-border bg-bg/50 flex items-center justify-between">
                            <p className="text-xs text-muted">
                                Değişiklikler kaydedilene kadar geçerli olmaz.
                            </p>
                            <button
                                onClick={saveProgram}
                                disabled={saving}
                                className="px-5 py-2.5 bg-accent text-white text-sm font-medium rounded-lg hover:bg-accent/90 transition-all duration-75 active:scale-95 will-change-transform disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {saving ? (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                )}
                                Programı Kaydet
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
