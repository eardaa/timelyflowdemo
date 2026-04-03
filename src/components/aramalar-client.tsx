"use client";

import { useState, useMemo } from "react";
import { Badge, type BadgeVariant } from "@/components/badge";
import { formatDate, formatDuration, formatCurrency } from "@/lib/utils";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/data-table";

type TabType = "gelen" | "form" | "liste";

function getAramaTipiBadge(tip: string): BadgeVariant {
  switch (tip) {
    case "gelen": return "success";
    case "form": return "warning";
    case "liste": return "accent" as any; // Type workaround for accent variant
    default: return "default";
  }
}

interface AramalarClientProps {
  aramalar: any[];
}

export function AramalarClient({ aramalar }: AramalarClientProps) {
  const [selectedArama, setSelectedArama] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("gelen");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("Tüm Durumlar");

  const closeModal = () => setSelectedArama(null);

  // Filter Data
  const filteredData = useMemo(() => {
    return aramalar.filter(arama => {
      // 1. Tab filtresi
      if (arama.arama_tipi !== activeTab) return false;

      // 2. Arama çubuğu filtresi (telefon veya özet)
      const searchLower = searchQuery.toLowerCase();
      if (searchQuery && 
          !(arama.numara?.toLowerCase().includes(searchLower)) && 
          !(arama.ozet?.toLowerCase().includes(searchLower))
         ) {
        return false;
      }

      // 3. Durum filtresi (Şu anki tabloda statik olarak Tüm Durumlar diyelim, eğer farklı durumlar varsa buraya eklenebilir)
      // if (statusFilter !== "Tüm Durumlar" && arama.durum !== statusFilter) return false;
      
      return true;
    });
  }, [aramalar, activeTab, searchQuery, statusFilter]);

  const tabDescriptions = {
    gelen: "Dışarıdan gelen çağrı kayıtları",
    form: "Web formu üzerinden tetiklenen çağrı kayıtları",
    liste: "Toplu arama listelerinden tetiklenen çağrı kayıtları",
  };

  const getTabLabel = (type: TabType) => {
    switch(type) {
      case "gelen": return "Gelen Aramalar";
      case "form": return "Form Aramaları";
      case "liste": return "Liste Aramaları";
    }
  };

  return (
    <>
      <div className="space-y-4">
        
        {/* 1. Tabs */}
      <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="flex w-full divide-x divide-border border-b border-border">
          {(["gelen", "form", "liste"] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 px-4 text-sm font-medium transition-all duration-150 flex items-center justify-center gap-2 relative ${
                activeTab === tab 
                  ? "text-blue-600 bg-blue-50/30" 
                  : "text-muted hover:text-text hover:bg-bg/50"
              }`}
            >
              {tab === "gelen" && (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path><polyline points="14 7 14 2 19 2"></polyline><line x1="22" y1="9" x2="15" y2="4"></line></svg>
              )}
              {tab === "form" && (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
              )}
              {tab === "liste" && (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
              )}
              {getTabLabel(tab)}
              
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600" />
              )}
            </button>
          ))}
        </div>
        
        {/* Tab Açıklaması */}
        <div className="px-5 py-3 bg-[#F8FAFC] border-b border-border flex items-center gap-2 text-sm text-blue-800 font-medium">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path><polyline points="14 7 14 2 19 2"></polyline><line x1="22" y1="9" x2="15" y2="4"></line></svg>
          {tabDescriptions[activeTab]}
        </div>

        {/* Arama ve Filtre */}
        <div className="p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </div>
            <input 
              type="text" 
              placeholder={`${getTabLabel(activeTab).toLowerCase()} içinde ara...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full text-sm border border-border rounded-md px-3 py-2 bg-surface text-text focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-shadow"
            />
          </div>
          <div className="w-full sm:w-48 shrink-0">
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full text-sm border border-border rounded-md px-3 py-2 bg-surface text-text focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 appearance-none cursor-pointer"
            >
              <option value="Tüm Durumlar">Tüm Durumlar</option>
              <option value="Başarılı">Başarılı</option>
              <option value="Cevapsız">Cevapsız</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. Content / Tablo */}
      <div className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden flex flex-col">
        {filteredData.length > 0 ? (
          <>
            <Table>
              <TableHeader className="bg-[#F8FAFC]">
                <TableRow>
                  <TableHead>Tarih</TableHead>
                  <TableHead>Numara</TableHead>
                  <TableHead>Süre</TableHead>
                  <TableHead>Maliyet</TableHead>
                  <TableHead className="w-[30%]">Özet</TableHead>
                  <TableHead className="text-right">İşlem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((arama: any) => (
                  <TableRow 
                    key={arama.id} 
                    className="group hover:bg-blue-50/30 transition-colors"
                  >
                    <TableCell className="text-sm">{formatDate(arama.kayit_tarihi)}</TableCell>
                    <TableCell className="font-mono text-sm">{arama.numara || "-"}</TableCell>
                    <TableCell className="font-mono text-sm">{formatDuration(arama.cagri_suresi)}</TableCell>
                    <TableCell className="font-mono text-sm">{formatCurrency(arama.maliyet)}</TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm" title={arama.ozet}>
                      {arama.ozet || "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <button
                        onClick={() => setSelectedArama(arama)}
                        className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium bg-surface border border-border rounded-md text-text hover:bg-bg transition-colors"
                      >
                        Detay
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="p-4 border-t border-border text-xs text-muted">
              Toplam {filteredData.length} kayıt gösteriliyor
            </div>
          </>
        ) : (
          /* Empty State (Görsele Benzer) */
          <div className="py-20 flex flex-col items-center justify-center text-center">
            <svg className="w-16 h-16 text-muted mb-4 opacity-50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
            </svg>
            <h3 className="text-lg font-bold text-text mb-1">Çağrı kaydı bulunamadı</h3>
            <p className="text-sm text-muted">Henüz hiç {getTabLabel(activeTab)?.toLowerCase()} kaydı bulunmuyor.</p>
          </div>
        )}
      </div>
      </div>

      {/* Arama Detay Modal */}
      {selectedArama && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-surface rounded-2xl shadow-xl w-full max-w-2xl border border-border overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-xl font-bold font-display text-text flex items-center gap-3">
                Arama Detayı
                <Badge variant={getAramaTipiBadge(selectedArama.arama_tipi)}>
                  {selectedArama.arama_tipi.charAt(0).toUpperCase() + selectedArama.arama_tipi.slice(1)}
                </Badge>
              </h2>
              <button 
                onClick={closeModal}
                className="text-muted hover:text-text transition-colors p-2 rounded-lg hover:bg-bg"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <div className="text-xs text-muted mb-1">Numara</div>
                  <div className="font-mono text-sm font-medium">{selectedArama.numara || "-"}</div>
                </div>
                <div>
                  <div className="text-xs text-muted mb-1">Tarih</div>
                  <div className="text-sm font-medium">{formatDate(selectedArama.kayit_tarihi)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted mb-1">Süre</div>
                  <div className="font-mono text-sm font-medium">{formatDuration(selectedArama.cagri_suresi)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted mb-1">Maliyet</div>
                  <div className="font-mono text-sm font-medium text-danger">{formatCurrency(selectedArama.maliyet)}</div>
                </div>
              </div>

              {selectedArama.ozet && (
                <div>
                  <h3 className="text-sm font-bold text-text mb-2 border-b border-border pb-1">Özet</h3>
                  <p className="text-sm text-muted bg-bg/50 p-4 rounded-lg leading-relaxed">
                    {selectedArama.ozet}
                  </p>
                </div>
              )}

              {selectedArama.transkript && (
                <div>
                  <h3 className="text-sm font-bold text-text mb-2 border-b border-border pb-1">Transkript</h3>
                  <div className="text-sm text-muted bg-bg/50 p-4 rounded-lg max-h-64 overflow-y-auto custom-scrollbar whitespace-pre-wrap leading-relaxed">
                    {selectedArama.transkript}
                  </div>
                </div>
              )}

              {selectedArama.kayit_url && (
                <div>
                  <h3 className="text-sm font-bold text-text mb-2 border-b border-border pb-1">Ses Kaydı</h3>
                  <div className="bg-bg/50 p-4 rounded-lg flex items-center gap-4">
                    <audio 
                      controls 
                      className="w-full max-w-md h-10" 
                      src={selectedArama.kayit_url}
                    >
                      Tarayıcınız ses elemanını desteklemiyor.
                    </audio>
                    <a 
                      href={selectedArama.kayit_url} 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-xs text-primary hover:underline whitespace-nowrap"
                    >
                      Yeni sekmede aç
                    </a>
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-border bg-bg/50 flex justify-end">
              <button 
                onClick={closeModal}
                className="px-4 py-2 bg-surface border border-border text-text rounded-lg text-sm font-medium hover:bg-bg transition-colors"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
