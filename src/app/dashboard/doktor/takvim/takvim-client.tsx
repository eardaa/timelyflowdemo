"use client";

import { useState } from "react";
import { addMusaitlik, deleteMusaitlik } from "./actions";
import { formatDate } from "@/lib/utils";

// SVGs
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
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
);

const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
);

const XIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);

const monthNames = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", 
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
];

const dayNames = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

// Hours 08:00 to 19:00
const hours = Array.from({ length: 12 }, (_, i) => i + 8);
const HOUR_HEIGHT = 60;

function getMonday(d: Date) {
  const date = new Date(d);
  const day = date.getDay() || 7; // Get current day number, converting Sun. to 7
  if (day !== 1) date.setHours(-24 * (day - 1)); // Only manipulate the date if it isn't Mon.
  return date;
}

const formatToYYYYMMDD = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

export default function TakvimClient({ takvimGecmisi, doktorId }: { takvimGecmisi: any[]; doktorId: string }) {
  const [view, setView] = useState<"takvim" | "liste">("takvim");
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(getMonday(new Date()));
  const [isModalOpen, setIsModalOpen] = useState(false);

  const prevWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentWeekStart(newDate);
  };

  const nextWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentWeekStart(newDate);
  };

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(currentWeekStart);
    date.setDate(date.getDate() + i);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return {
      dateObj: date,
      dateString: `${y}-${m}-${d}`,
      dayNum: date.getDate(),
      monthName: monthNames[date.getMonth()],
      year: date.getFullYear(),
      name: dayNames[i]
    };
  });

  const weekRangeText = `${weekDays[0].dayNum} - ${weekDays[6].dayNum} ${weekDays[6].monthName} ${weekDays[6].year}`;

  const renderEvent = (slot: any, dayIndex: number) => {
    // baslangic_saat format: "09:00:00"
    const startHourStr = slot.baslangic_saat.split(":")[0];
    const startMinStr = slot.baslangic_saat.split(":")[1];
    const endHourStr = slot.bitis_saat.split(":")[0];
    const endMinStr = slot.bitis_saat.split(":")[1];
    
    const startHour = parseInt(startHourStr) + parseInt(startMinStr)/60;
    const endHour = parseInt(endHourStr) + parseInt(endMinStr)/60;

    // Boundary check, skip if completely outside 8-19
    if (endHour <= 8 || startHour >= 19) return null;

    const visibleStart = Math.max(8, startHour);
    const visibleEnd = Math.min(19, endHour);

    const top = (visibleStart - 8) * HOUR_HEIGHT;
    const height = (visibleEnd - visibleStart) * HOUR_HEIGHT;
    const left = `calc(12.5% + ${dayIndex * 12.5}%)`;

    return (
      <div 
        key={slot.id}
        className="absolute p-1 group z-10"
        style={{ top: `${top}px`, height: `${height}px`, left, width: '12.5%' }}
      >
        <div className={`w-full h-full rounded-lg px-2 py-1 text-xs overflow-hidden relative border shadow-sm transition-shadow hover:shadow-md ${slot.musait ? "bg-blue-50 border-blue-200 text-blue-800" : "bg-red-50 border-red-200 text-red-800"}`}>
          <div className="font-semibold mb-0.5 truncate">{slot.baslangic_saat.substring(0, 5)} - {slot.bitis_saat.substring(0, 5)}</div>
          <div className="truncate">{slot.not_bilgi || (slot.musait ? "Poliklinik" : "Dolu")}</div>
          
          <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 rounded">
            <form action={deleteMusaitlik}>
              <input type="hidden" name="id" value={slot.id} />
              <button type="submit" className="p-1 text-red-600 hover:text-red-800" title="Sil">
                <TrashIcon />
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Tabs */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => setView("takvim")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${view === "takvim" ? "bg-gray-900 text-white shadow-sm" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"}`}
          >
            <CalendarIcon />
            Haftalık Program
          </button>
          <button 
            onClick={() => setView("liste")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${view === "liste" ? "bg-gray-900 text-white shadow-sm" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"}`}
          >
            <ListIcon />
            İzin Yönetimi
          </button>
        </div>
        
        {view === "takvim" && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
          >
            <PlusIcon />
            Yeni Müsaitlik Ekle
          </button>
        )}
      </div>

      {view === "takvim" ? (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          {/* Header Controls */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-4">
              <button onClick={prevWeek} className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600"><ChevronLeft /></button>
              <span className="text-sm font-semibold text-gray-800 min-w-[140px] text-center">{weekRangeText}</span>
              <button onClick={nextWeek} className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600"><ChevronRight /></button>
            </div>
            <button 
              onClick={() => setCurrentWeekStart(getMonday(new Date()))}
              className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
            >
              Bu Hafta
            </button>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[800px] w-full">
              {/* Days Header Row */}
              <div className="flex border-b border-gray-200 bg-gray-50/50">
                <div className="w-[12.5%] flex-shrink-0 border-r border-gray-200 p-3"></div>
                {weekDays.map((day, i) => {
                  const isToday = day.dateString === formatToYYYYMMDD(new Date());
                  return (
                    <div key={i} className={`w-[12.5%] flex-shrink-0 border-r border-gray-200 p-3 text-center ${isToday ? "bg-blue-50/50" : ""}`}>
                      <div className={`text-xs font-medium mb-1 ${isToday ? "text-blue-600" : "text-gray-500"}`}>{day.name}</div>
                      <div className={`text-lg font-bold ${isToday ? "text-blue-700" : "text-gray-900"}`}>{day.dayNum}</div>
                    </div>
                  );
                })}
              </div>

              {/* Grid Body */}
              <div className="relative bg-white" style={{ height: `${(hours.length - 1) * HOUR_HEIGHT}px` }}>
                
                {/* Horizontal Time Lines */}
                {hours.map((hour, i) => {
                  if (i === hours.length - 1) return null; // Don't draw row for 19:00, just end of 18:00
                  return (
                    <div key={hour} className="absolute w-full flex border-b border-gray-100" style={{ top: `${i * HOUR_HEIGHT}px`, height: `${HOUR_HEIGHT}px` }}>
                      <div className="w-[12.5%] flex-shrink-0 border-r border-gray-200 p-2 text-center">
                        <span className="text-xs font-medium text-gray-500 relative -top-3 bg-white px-1">{hour.toString().padStart(2, '0')}:00</span>
                      </div>
                      {weekDays.map((_, j) => (
                        <div key={j} className="w-[12.5%] flex-shrink-0 border-r border-gray-100"></div>
                      ))}
                    </div>
                  );
                })}

                {/* Events */}
                {weekDays.map((day, dayIndex) => {
                  const dailySlots = takvimGecmisi.filter(s => s.tarih === day.dateString);
                  return dailySlots.map(slot => renderEvent(slot, dayIndex));
                })}

              </div>
            </div>
          </div>
        </div>
      ) : (
        /* İzin Yönetimi (Liste / Tablo Görünümü) */
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm mt-6">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">İzinler</h2>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
            >
              <PlusIcon />
              İzin Ekle
            </button>
          </div>
          
          <div className="overflow-x-auto">
            {takvimGecmisi?.length ? (
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50/50 text-xs text-gray-500 uppercase border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Tarih</th>
                    <th className="px-6 py-4 font-semibold">Açıklama</th>
                    <th className="px-6 py-4 font-semibold">Durum</th>
                    <th className="px-6 py-4 font-semibold text-right">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {takvimGecmisi.map((slot: any) => {
                    const dateObj = new Date(slot.tarih);
                    const formattedDate = `${dateObj.getDate()} ${monthNames[dateObj.getMonth()]} ${dateObj.getFullYear()}`;
                    
                    return (
                      <tr key={slot.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                          {formattedDate}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-gray-900 font-medium">{slot.not_bilgi || (slot.musait ? "Poliklinik" : "İzin")}</span>
                            <span className="text-xs text-gray-500 mt-0.5">{slot.baslangic_saat.substring(0, 5)} - {slot.bitis_saat.substring(0, 5)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${slot.musait ? "bg-blue-50 text-blue-700 border border-blue-100" : "bg-red-50 text-red-700 border border-red-100"}`}>
                            {slot.musait ? "Müsait" : "Dolu (İzin)"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <form action={deleteMusaitlik} className="inline-block">
                            <input type="hidden" name="id" value={slot.id} />
                            <button 
                              type="submit" 
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                              title="Sil"
                            >
                              <TrashIcon />
                            </button>
                          </form>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-gray-500 text-sm">
                <CalendarIcon />
                <span className="mt-3">Henüz izin / müsaitlik kaydınız bulunmuyor.</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal for Adding Availability */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800">Yeni Müsaitlik Ekle</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-full transition-colors"
              >
                <XIcon />
              </button>
            </div>
            
            <form 
              action={(formData) => {
                addMusaitlik(formData);
                setIsModalOpen(false);
              }} 
              className="p-6 space-y-5"
            >
              <input type="hidden" name="doktor_id" value={doktorId} />
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Tarih</label>
                <input 
                  type="date" 
                  name="tarih"
                  required
                  defaultValue={formatToYYYYMMDD(new Date())}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3.5 py-2.5 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Başlangıç (SS:DD)</label>
                  <input 
                    type="time" 
                    name="baslangic" 
                    required 
                    defaultValue="09:00"
                    className="w-full text-sm border border-gray-300 rounded-lg px-3.5 py-2.5 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Bitiş (SS:DD)</label>
                  <input 
                    type="time" 
                    name="bitis" 
                    required 
                    defaultValue="17:00"
                    className="w-full text-sm border border-gray-300 rounded-lg px-3.5 py-2.5 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Durum</label>
                <select name="durum" className="w-full text-sm border border-gray-300 rounded-lg px-3.5 py-2.5 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50">
                  <option value="musait">Müsait (Poliklinik, vs.)</option>
                  <option value="dolu">Dolu (İzin, Öğle Arası, vs.)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Not (İsteğe bağlı)</label>
                <input 
                  type="text" 
                  name="not" 
                  placeholder="Örn. Öğle Arası veya Poliklinik"
                  className="w-full text-sm border border-gray-300 rounded-lg px-3.5 py-2.5 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm"
                >
                  İptal
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
                >
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}