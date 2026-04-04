"use client";

import { useState } from "react";
import { addMusaitlik, deleteMusaitlik } from "./actions";
import { formatDate } from "@/lib/utils";

// Custom SVGs since lucide-react is not available
const CalendarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
);

const ListIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
);

const ChevronLeft = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
);

const ChevronRight = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
);

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
);

// Helpers
const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year: number, month: number) => {
  const day = new Date(year, month, 1).getDay();
  // Adjust so Monday is 0, Sunday is 6
  return day === 0 ? 6 : day - 1;
};

const formatToYYYYMMDD = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const monthNames = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", 
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
];

const dayNames = ["Pt", "Sa", "Ça", "Pe", "Cu", "Ct", "Pz"];

export default function TakvimClient({ takvimGecmisi, doktorId }: { takvimGecmisi: any[]; doktorId: string }) {
  const [view, setView] = useState<"takvim" | "liste">("takvim");
  
  const today = new Date();
  const [currentMonthDate, setCurrentMonthDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDateStr, setSelectedDateStr] = useState<string>(formatToYYYYMMDD(today));

  // Calendar logic
  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDayIndex = getFirstDayOfMonth(year, month);

  const prevMonth = () => setCurrentMonthDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonthDate(new Date(year, month + 1, 1));

  // Derived data
  const selectedDateObj = new Date(selectedDateStr);
  const formattedSelectedDate = `${selectedDateObj.getDate()} ${monthNames[selectedDateObj.getMonth()]} ${selectedDateObj.getFullYear()}`;

  const slotsForSelectedDate = takvimGecmisi.filter((slot) => slot.tarih === selectedDateStr);

  const handleAddSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    // Form is submitted via standard HTML action, but to make it smoother without reload
    // we let server action handle it, but we don't prevent default so revalidatePath works easily,
    // or we can use startTransition/action. For simplicity, we just use the `action` attribute on form natively with Server Actions.
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button 
          onClick={() => setView("takvim")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${view === "takvim" ? "bg-gray-900 text-white shadow-sm" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"}`}
        >
          <CalendarIcon />
          Takvim Görünümü
        </button>
        <button 
          onClick={() => setView("liste")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${view === "liste" ? "bg-gray-900 text-white shadow-sm" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"}`}
        >
          <ListIcon />
          Liste Görünümü
        </button>
      </div>

      {view === "takvim" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel: Calendar Grid */}
          <div className="lg:col-span-2">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-800">Takvim</h2>
                <div className="flex items-center gap-4">
                  <button onClick={prevMonth} className="p-1 hover:bg-gray-100 rounded-md transition-colors"><ChevronLeft /></button>
                  <span className="text-sm font-medium w-24 text-center">{monthNames[month]} {year}</span>
                  <button onClick={nextMonth} className="p-1 hover:bg-gray-100 rounded-md transition-colors"><ChevronRight /></button>
                </div>
              </div>
              
              <div className="grid grid-cols-7 gap-y-4 gap-x-2 text-center">
                {dayNames.map((d) => (
                  <div key={d} className="text-xs font-semibold text-gray-500 py-2 uppercase">{d}</div>
                ))}
                
                {/* Empty leading days */}
                {Array.from({ length: firstDayIndex }).map((_, i) => (
                  <div key={`empty-${i}`} className="p-2"></div>
                ))}

                {/* Days */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const d = i + 1;
                  const dateStr = formatToYYYYMMDD(new Date(year, month, d));
                  const isSelected = selectedDateStr === dateStr;
                  const hasSlots = takvimGecmisi.some(s => s.tarih === dateStr);
                  const hasMusait = takvimGecmisi.some(s => s.tarih === dateStr && s.musait);
                  const hasDolu = takvimGecmisi.some(s => s.tarih === dateStr && !s.musait);

                  return (
                    <div key={d} className="flex flex-col items-center justify-start h-12">
                      <button 
                        onClick={() => setSelectedDateStr(dateStr)}
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${isSelected ? "bg-blue-600 text-white" : "hover:bg-gray-100 text-gray-700"}`}
                      >
                        {d}
                      </button>
                      {/* Dots indicator */}
                      <div className="flex gap-1 mt-1">
                        {hasSlots && hasMusait && <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>}
                        {hasSlots && hasDolu && <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>}
                        {hasSlots && !hasMusait && !hasDolu && <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Panel: Form & Details */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <h2 className="text-md font-semibold text-gray-800 mb-4 border-b pb-3">Müsaitlik Ekle</h2>
              <form action={addMusaitlik} className="space-y-4">
                <input type="hidden" name="doktor_id" value={doktorId} />
                <input type="hidden" name="tarih" value={selectedDateStr} />
                
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Tarih</label>
                  <div className="text-sm font-medium text-gray-900 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                    {formattedSelectedDate}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Başlangıç</label>
                    <input 
                      type="time" 
                      name="baslangic" 
                      required 
                      className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Bitiş</label>
                    <input 
                      type="time" 
                      name="bitis" 
                      required 
                      className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Durum</label>
                  <select name="durum" className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50">
                    <option value="musait">Müsait</option>
                    <option value="dolu">Dolu</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Not (İsteğe bağlı)</label>
                  <input 
                    type="text" 
                    name="not" 
                    placeholder="Örn. Öğle Arası"
                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm mt-2"
                >
                  Kaydet
                </button>
              </form>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <h2 className="text-md font-semibold text-gray-800 mb-4 border-b pb-3">{formattedSelectedDate} - Planlanmış Saatler</h2>
              
              {slotsForSelectedDate.length > 0 ? (
                <div className="space-y-3">
                  {slotsForSelectedDate.map(slot => (
                    <div key={slot.id} className="flex items-start justify-between p-3 rounded-lg border border-gray-100 bg-gray-50">
                      <div>
                        <div className="text-sm font-semibold text-gray-900 mb-1">
                          {slot.baslangic_saat.substring(0, 5)} - {slot.bitis_saat.substring(0, 5)}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${slot.musait ? "bg-blue-500" : "bg-red-500"}`}></span>
                          <span className="text-xs font-medium text-gray-700">{slot.musait ? "Müsait" : "Dolu"}</span>
                          {slot.not_bilgi && (
                            <>
                              <span className="text-gray-300">-</span>
                              <span className="text-xs text-gray-500">{slot.not_bilgi}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <form action={deleteMusaitlik}>
                          <input type="hidden" name="id" value={slot.id} />
                          <button type="submit" className="p-1.5 text-red-500 hover:bg-red-100 rounded-md transition-colors" title="Sil">
                            <TrashIcon />
                          </button>
                        </form>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-500 py-4 text-center">Bu tarihte planlanmış saat bulunmuyor.</div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Liste Görünümü (Original style grid) */
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm min-h-[160px] flex flex-col justify-center">
          {takvimGecmisi?.length ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 w-full">
              {takvimGecmisi.map((slot: any) => (
                <div 
                  key={slot.id} 
                  className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow"
                >
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${slot.musait ? "bg-blue-600" : "bg-red-500"}`} />
                  <div className="pl-3">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-sm font-medium text-gray-700">{formatDate(slot.tarih).split(' ')[0]}</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${slot.musait ? "bg-blue-50 text-blue-700" : "bg-red-100 text-red-700"}`}>
                          {slot.musait ? "Müsait" : "Dolu"}
                        </span>
                        <form action={deleteMusaitlik}>
                          <input type="hidden" name="id" value={slot.id} />
                          <button 
                            type="submit" 
                            className="text-red-500 hover:bg-red-50 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all"
                            title="Sil"
                          >
                            <TrashIcon />
                          </button>
                        </form>
                      </div>
                    </div>
                    <div className="text-lg font-semibold text-gray-900 my-1">
                      {slot.baslangic_saat.substring(0, 5)} - {slot.bitis_saat.substring(0, 5)}
                    </div>
                    {slot.not_bilgi && (
                      <p className="text-xs text-gray-500 truncate mt-2 border-t border-gray-100 pt-2">
                        {slot.not_bilgi}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500 text-sm">
              Henüz takviminize müsaitlik eklemediniz.
            </div>
          )}
        </div>
      )}
    </div>
  );
}