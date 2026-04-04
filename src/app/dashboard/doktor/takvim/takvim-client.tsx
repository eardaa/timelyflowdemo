"use client";

import { useState } from "react";
import { addMusaitlik, deleteMusaitlik, saveWeeklyProgram } from "./actions";
import { formatDate } from "@/lib/utils";

// SVGs
const CalendarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
);

const ListIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
);

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
);

const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
);

const PlusIconLarge = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
);

const XIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);

const ClockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
);

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
);

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

const daysOrder = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];

type TimeSlot = { id: string; start: string; end: string };
type DaySchedule = { name: string; active: boolean; slots: TimeSlot[] };

export default function TakvimClient({ takvimGecmisi, doktorId }: { takvimGecmisi: any[]; doktorId: string }) {
  const [view, setView] = useState<"takvim" | "liste">("takvim");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Sadece istisnai tarihler İzin Yönetiminde görünecek
  const isDateString = (str: string) => !daysOrder.includes(str);
  const izinler = takvimGecmisi.filter(s => isDateString(s.tarih));

  // Haftalık şablon verisini state'e al
  const [schedule, setSchedule] = useState<DaySchedule[]>(() => {
    return daysOrder.map(dayName => {
      const dbSlots = takvimGecmisi.filter(s => s.tarih === dayName);
      const slots: TimeSlot[] = dbSlots.map(s => ({
        id: s.id || Math.random().toString(36).substring(2, 9),
        start: s.baslangic_saat.substring(0, 5),
        end: s.bitis_saat.substring(0, 5)
      }));

      const active = slots.length > 0;
      
      return {
        name: dayName,
        active,
        slots: active ? slots : [{ id: Math.random().toString(36).substring(2, 9), start: "09:00", end: "17:00" }]
      };
    });
  });

  const toggleDay = (dayIndex: number, active: boolean) => {
    const newSchedule = [...schedule];
    newSchedule[dayIndex].active = active;
    setSchedule(newSchedule);
  };

  const addSlot = (dayIndex: number) => {
    const newSchedule = [...schedule];
    newSchedule[dayIndex].slots.push({
      id: Math.random().toString(36).substring(2, 9),
      start: "09:00",
      end: "17:00"
    });
    setSchedule(newSchedule);
  };

  const removeSlot = (dayIndex: number, slotIndex: number) => {
    const newSchedule = [...schedule];
    newSchedule[dayIndex].slots.splice(slotIndex, 1);
    setSchedule(newSchedule);
  };

  const updateSlot = (dayIndex: number, slotIndex: number, field: 'start' | 'end', value: string) => {
    const newSchedule = [...schedule];
    newSchedule[dayIndex].slots[slotIndex][field] = value;
    setSchedule(newSchedule);
  };

  const handleSaveProgram = async () => {
    setIsSaving(true);
    try {
      const dataToSave: any[] = [];
      
      schedule.forEach(day => {
        if (day.active) {
          day.slots.forEach(slot => {
            dataToSave.push({
              doktor_id: doktorId,
              tarih: day.name,
              baslangic_saat: slot.start.length === 5 ? `${slot.start}:00` : slot.start,
              bitis_saat: slot.end.length === 5 ? `${slot.end}:00` : slot.end,
              musait: true,
              not_bilgi: "Şablon"
            });
          });
        }
      });

      await saveWeeklyProgram(doktorId, dataToSave);
      alert("Haftalık program başarıyla kaydedildi.");
    } catch (error) {
      console.error(error);
      alert("Program kaydedilirken bir hata oluştu.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Tabs */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200 pb-2">
        <div className="flex gap-6">
          <button 
            onClick={() => setView("takvim")}
            className={`flex items-center gap-2 pb-3 text-sm font-medium transition-colors border-b-2 ${view === "takvim" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
          >
            <CalendarIcon />
            Haftalık Program
          </button>
          <button 
            onClick={() => setView("liste")}
            className={`flex items-center gap-2 pb-3 text-sm font-medium transition-colors border-b-2 ${view === "liste" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
          >
            <ListIcon />
            İzin Yönetimi
          </button>
        </div>
      </div>

      {view === "takvim" ? (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 max-w-4xl mx-auto">
          <div className="space-y-4">
            {schedule.map((day, dayIndex) => (
              <div key={day.name} className={`border rounded-xl transition-colors duration-200 ${day.active ? 'border-blue-200 bg-blue-50/10' : 'border-gray-200 bg-gray-50/30'}`}>
                {/* Day Header */}
                <div className="flex items-center justify-between px-5 py-4">
                  <div className="flex items-center gap-4">
                    {/* Toggle Switch */}
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={day.active} 
                        onChange={(e) => toggleDay(dayIndex, e.target.checked)} 
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                    <span className="text-[15px] font-medium text-gray-800">{day.name}</span>
                  </div>
                  
                  {day.active && (
                    <button onClick={() => addSlot(dayIndex)} className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1.5 transition-colors">
                      <PlusIcon /> Saat Ekle
                    </button>
                  )}
                </div>

                {/* Day Slots */}
                {day.active && (
                  <div className="px-5 pb-5 space-y-3">
                    {day.slots.map((slot, slotIndex) => (
                      <div key={slot.id} className="flex items-center gap-3">
                        <div className="flex-1 flex items-center gap-4 p-2.5 border border-gray-200 rounded-lg bg-white shadow-sm">
                           <div className="flex items-center gap-2 flex-1">
                             <ClockIcon />
                             <input 
                               type="time" 
                               value={slot.start} 
                               onChange={(e) => updateSlot(dayIndex, slotIndex, 'start', e.target.value)} 
                               className="text-sm text-gray-700 outline-none flex-1 bg-transparent cursor-pointer" 
                             />
                           </div>
                           <span className="text-gray-300 font-light">—</span>
                           <div className="flex items-center gap-2 flex-1">
                             <ClockIcon />
                             <input 
                               type="time" 
                               value={slot.end} 
                               onChange={(e) => updateSlot(dayIndex, slotIndex, 'end', e.target.value)} 
                               className="text-sm text-gray-700 outline-none flex-1 bg-transparent cursor-pointer" 
                             />
                           </div>
                        </div>
                        
                        {day.slots.length > 1 && (
                          <button onClick={() => removeSlot(dayIndex, slotIndex)} className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Sil">
                             <TrashIcon />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between pt-6 mt-8 border-t border-gray-100 gap-4">
            <span className="text-sm text-gray-500 font-medium">Değişiklikler kaydedilene kadar geçerli olmaz.</span>
            <button 
              onClick={handleSaveProgram}
              disabled={isSaving}
              className="flex items-center justify-center gap-2 w-full sm:w-auto bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-70"
            >
              <CheckIcon />
              {isSaving ? "Kaydediliyor..." : "Programı Kaydet"}
            </button>
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
              <PlusIconLarge />
              İzin Ekle
            </button>
          </div>
          
          <div className="overflow-x-auto">
            {izinler.length ? (
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
                  {izinler.map((slot: any) => {
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
                <span className="mt-3">Henüz izin / istisna kaydınız bulunmuyor.</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal for Adding Availability / Leave */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800">Yeni İzin / İstisna Ekle</h2>
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
                <select name="durum" defaultValue="dolu" className="w-full text-sm border border-gray-300 rounded-lg px-3.5 py-2.5 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50">
                  <option value="dolu">Dolu (İzin, Öğle Arası, vs.)</option>
                  <option value="musait">Müsait (Poliklinik, vs.)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Not (İsteğe bağlı)</label>
                <input 
                  type="text" 
                  name="not" 
                  placeholder="Örn. Yıllık İzin"
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