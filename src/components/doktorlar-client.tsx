"use client";

import { useState } from "react";
import { Badge } from "@/components/badge";
import { ScheduleModal } from "@/components/schedule-modal";

interface DoktorKarti {
    id: string;
    ad: string;
    soyad: string;
    unvan: string | null;
    telefon: string | null;
    email: string | null;
    aktif: boolean;
    klinik_lokasyon: string | null;
    uzmanliklar: { ad: string } | null;
}

interface DoktorlarClientProps {
    doktorlar: DoktorKarti[];
    toggleAction: (formData: FormData) => Promise<void>;
}

export function DoktorlarClient({ doktorlar, toggleAction }: DoktorlarClientProps) {
    const [modalDoktor, setModalDoktor] = useState<DoktorKarti | null>(null);

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {doktorlar?.map((doktor) => (
                    <div
                        key={doktor.id}
                        className="bg-surface rounded-xl border border-border p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)] flex flex-col h-full"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="font-semibold text-lg text-text">
                                    {doktor.unvan ? `${doktor.unvan} ` : "Dr. "}
                                    {doktor.ad} {doktor.soyad}
                                </h3>
                                <p className="text-accent text-sm font-medium mt-0.5">
                                    {doktor.uzmanliklar?.ad || "Uzmanlık Belirtilmemiş"}
                                </p>
                            </div>
                            <Badge variant={doktor.aktif ? "success" : "muted"}>
                                {doktor.aktif ? "Aktif" : "Pasif"}
                            </Badge>
                        </div>

                        <div className="space-y-2 flex-grow">
                            {doktor.email && (
                                <div className="text-sm text-muted flex items-center gap-2">
                                    <span className="w-16 flex-shrink-0">E-posta:</span>
                                    <span className="text-text truncate">{doktor.email}</span>
                                </div>
                            )}
                            {doktor.telefon && (
                                <div className="text-sm text-muted flex items-center gap-2">
                                    <span className="w-16 flex-shrink-0">Telefon:</span>
                                    <span className="font-mono text-text truncate">
                                        {doktor.telefon}
                                    </span>
                                </div>
                            )}
                            {doktor.klinik_lokasyon && (
                                <div className="text-sm text-muted flex items-center gap-2">
                                    <span className="w-16 flex-shrink-0">Lokasyon:</span>
                                    <span className="text-text truncate">
                                        {doktor.klinik_lokasyon}
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="mt-6 pt-4 border-t border-border space-y-2">
                            {/* Çalışma Programı Butonu */}
                            <button
                                onClick={() => setModalDoktor(doktor)}
                                className="w-full py-2 rounded-lg text-sm font-medium transition-all duration-75 active:scale-95 border border-accent/30 bg-accent/5 text-accent hover:bg-accent/10 flex items-center justify-center gap-2 will-change-transform"
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                    <line x1="16" y1="2" x2="16" y2="6" />
                                    <line x1="8" y1="2" x2="8" y2="6" />
                                    <line x1="3" y1="10" x2="21" y2="10" />
                                </svg>
                                Çalışma Programı
                            </button>

                            {/* Aktif/Pasif Butonu */}
                            <form action={toggleAction}>
                                <input type="hidden" name="id" value={doktor.id} />
                                <input
                                    type="hidden"
                                    name="aktif"
                                    value={String(doktor.aktif)}
                                />
                                <button
                                    type="submit"
                                    className={`w-full py-2 rounded-lg text-sm font-medium transition-all duration-75 active:scale-95 will-change-transform border ${doktor.aktif
                                        ? "border-border text-muted hover:bg-bg hover:text-text"
                                        : "border-success/30 bg-success/5 text-success hover:bg-success/10"
                                        }`}
                                >
                                    {doktor.aktif ? "Pasife Al" : "Aktifleştir"}
                                </button>
                            </form>
                        </div>
                    </div>
                ))}

                {(!doktorlar || doktorlar.length === 0) && (
                    <div className="col-span-full bg-surface border border-border rounded-xl p-8 text-center">
                        <p className="text-muted">
                            Sistemde henüz kayıtlı doktor bulunmuyor.
                        </p>
                    </div>
                )}
            </div>

            {/* Schedule Modal */}
            {modalDoktor && (
                <ScheduleModal
                    doktorId={modalDoktor.id}
                    doktorAd={`${modalDoktor.unvan || "Dr."} ${modalDoktor.ad} ${modalDoktor.soyad}`}
                    isOpen={!!modalDoktor}
                    onClose={() => setModalDoktor(null)}
                />
            )}
        </>
    );
}
