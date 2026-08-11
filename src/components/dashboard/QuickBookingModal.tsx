"use client";
import React, { useState, useEffect, useRef, useMemo } from "react";
import { X, User, Phone, Clock, Check, ChevronDown, Search, Calendar } from "lucide-react";

export default function QuickBookingModal({ isOpen, onClose, selectedDate, masters = [], services = [], onSave, currentMasterId }: any) {
  const [formData, setFormData] = useState({
    client_name: "",
    client_phone: "+7 ",
    service_ids: [] as string[], // Изменили строку на массив ID
    specialist_id: "",
    date: "", // Разделили дату
    time: "", // Разделили время
  });

  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [serviceSearch, setServiceSearch] = useState("");
  const [isServiceOpen, setIsServiceOpen] = useState(false);

  const serviceRef = useRef<HTMLDivElement>(null);
  const phoneRef = useRef<HTMLDivElement>(null);

  const groupedServices = useMemo(() => {
    const groups: { [key: string]: any[] } = {};
    services.forEach((s: any) => {
      const cat = s.categoryName || s.category_name || "Прочее";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(s);
    });
    return groups;
  }, [services]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (serviceRef.current && !serviceRef.current.contains(event.target as Node)) {
        setIsServiceOpen(false);
      }
      if (phoneRef.current && !phoneRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const cleanPhone = formData.client_phone.replace(/\D/g, "");
    if (cleanPhone.length >= 4) {
      const timer = setTimeout(async () => {
        try {
          const res = await fetch(`https://api.wopp.ru/api/booking/search-clients?q=${cleanPhone}`, {
            headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
          });
          const data = await res.json();
          setSearchResults(data);
          setShowResults(data.length > 0);
        } catch (e) { console.error("Search error:", e); }
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setShowResults(false);
    }
  }, [formData.client_phone]);

  // УМНЫЙ ИНИЦИАЛИЗИРУЮЩИЙ EFFECT
  useEffect(() => {
    if (isOpen) {
      let initialDate = "";
      let initialTime = "";

      if (selectedDate) {
        let dateObj: Date | null = null;
        if (selectedDate.startStr) {
          dateObj = new Date(selectedDate.startStr);
        } else if (typeof selectedDate === "string") {
          dateObj = new Date(selectedDate);
        } else if (selectedDate instanceof Date) {
          dateObj = selectedDate;
        }

        if (dateObj && !isNaN(dateObj.getTime())) {
          const pad = (n: number) => n.toString().padStart(2, '0');
          initialDate = `${dateObj.getFullYear()}-${pad(dateObj.getMonth() + 1)}-${pad(dateObj.getDate())}`;
          initialTime = `${pad(dateObj.getHours())}:${pad(dateObj.getMinutes())}`;
        }
      }

      const fallbackMasterId = currentMasterId
        ? currentMasterId.toString()
        : (masters?.[0]?.id?.toString() || "");

      setFormData({
        client_name: "",
        client_phone: "+7 ",
        service_ids: [], // По умолчанию пустой массив, админ выберет кликами
        specialist_id: fallbackMasterId,
        date: initialDate,
        time: initialTime
      });
      setServiceSearch("");
      setIsServiceOpen(false);
    }
  }, [isOpen, selectedDate, services, masters, currentMasterId]);

  const formatPhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, "");
    if (!digits) return "+7 ";
    const mainDigits = (digits.startsWith("7") || digits.startsWith("8")) ? digits.slice(1) : digits;
    let result = "+7 ";
    if (mainDigits.length > 0) result += "(" + mainDigits.substring(0, 3);
    if (mainDigits.length >= 4) result += ") " + mainDigits.substring(3, 6);
    if (mainDigits.length >= 7) result += "-" + mainDigits.substring(6, 8);
    if (mainDigits.length >= 9) result += "-" + mainDigits.substring(8, 10);
    return result;
  };

  // Переключение выбора услуги (добавить/удалить из массива)
  const toggleService = (id: string) => {
    setFormData(prev => {
      const exists = prev.service_ids.includes(id);
      const newIds = exists
        ? prev.service_ids.filter(sid => sid !== id)
        : [...prev.service_ids, id];
      return { ...prev, service_ids: newIds };
    });
  };

  // Получаем массив объектов выбранных услуг
  const selectedServicesObjects = useMemo(() => {
    return services.filter(s => formData.service_ids.includes(s.id.toString()));
  }, [formData.service_ids, services]);

  // Подсчет общей стоимости и общей длительности
  const totals = useMemo(() => {
    return selectedServicesObjects.reduce((acc, s) => {
      // Ищем длительность в минутах (проверяем разные возможные наименования полей бэкенда)
      const duration = s.duration_minutes || s.duration || 0;
      return {
        price: acc.price + Math.round(s.price),
        duration: acc.duration + duration
      };
    }, { price: 0, duration: 0 });
  }, [selectedServicesObjects]);

  // Форматирование минут в человекочитаемый вид (например, "1 ч 30 мин" или "45 мин")
  const formatDuration = (totalMinutes: number) => {
    if (!totalMinutes) return "0 мин";
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return hours > 0 ? `${hours} ч ${mins > 0 ? `${mins} мин` : ""}` : `${mins} мин`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 text-slate-900">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl animate-in zoom-in duration-200 flex flex-col max-h-[95vh]">

        <div className="p-8 flex justify-between items-center border-b border-slate-50">
          <h3 className="text-2xl font-bold  tracking-tight">Новая запись</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={24} /></button>
        </div>

        <form
          className="p-8 space-y-5 overflow-y-auto custom-scrollbar flex-1"
          onSubmit={(e) => {
            e.preventDefault();
            // Собираем обратно в ISO формат YYYY-MM-DDTHH:mm для совместимости с твоим onSave
            const start_time = `${formData.date}T${formData.time}`;
            onSave({
              client_name: formData.client_name,
              client_phone: formData.client_phone,
              services_ids: formData.service_ids.map(id => parseInt(id, 10)), // Передаем массив выбранных ID
              specialist_id: formData.specialist_id,
              start_time: start_time
            });
          }}
        >
          <div className="space-y-4">
            <div className="space-y-1 relative" ref={phoneRef}>
              <label className="text-xs text-slate-400 ml-1">Телефон</label>
              <div className="relative">
                <Phone className="absolute left-4 top-4 text-slate-400" size={18} />
                <input
                  required type="tel"
                  className="w-full bg-slate-50 border-none rounded-2xl py-4 pl-12 focus:ring-2 focus:ring-blue-500 font-bold text-lg"
                  value={formData.client_phone}
                  onChange={(e) => setFormData({ ...formData, client_phone: formatPhoneNumber(e.target.value) })}
                  autoComplete="off"
                />
              </div>

              {showResults && (
                <div className="absolute z-[110] w-full mt-2 bg-white border border-slate-100 shadow-2xl rounded-2xl overflow-hidden max-h-48 overflow-y-auto">
                  {searchResults.map((client: any) => (
                    <div
                      key={client.id}
                      onClick={() => {
                        setFormData({ ...formData, client_name: client.name, client_phone: formatPhoneNumber(client.phone) });
                        setShowResults(false);
                      }}
                      className="p-4 hover:bg-blue-50 cursor-pointer flex justify-between items-center border-b border-slate-50 last:border-none"
                    >
                      <div>
                        <div className="font-black text-slate-800">{client.name}</div>
                        <div className="text-xs text-slate-400 font-bold">{formatPhoneNumber(client.phone)}</div>
                      </div>
                      <Check className="text-blue-600" size={18} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-400 ml-1">Имя клиента</label>
              <div className="relative">
                <User className="absolute left-4 top-4 text-slate-400" size={18} />
                <input
                  required placeholder="Иван"
                  className="w-full bg-slate-50 border-none rounded-2xl py-4 pl-12 focus:ring-2 focus:ring-blue-500 font-bold"
                  value={formData.client_name}
                  onChange={e => setFormData({ ...formData, client_name: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* МАСТЕР С ФОТО */}
          <div className="space-y-2">
            <label className="text-xs text-slate-400 ml-1">Мастер</label>
            <div className="flex flex-wrap gap-2">
              {masters.map((m: any) => {
                const isSelected = formData.specialist_id === m.id.toString();
                return (
                  <button
                    key={m.id} type="button"
                    onClick={() => setFormData({ ...formData, specialist_id: m.id.toString() })}
                    className={`flex items-center gap-3 px-3 py-2 rounded-2xl border-2 transition-all ${isSelected ? "border-blue-600 bg-blue-50 text-blue-700 shadow-sm" : "border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200"
                      }`}
                  >
                    <div className="relative">
                      {m.avatar_url ? (
                        <img
                          src={m.avatar_url}
                          alt={m.display_name}
                          className="w-8 h-8 rounded-full object-cover border border-white shadow-sm"
                        />
                      ) : (
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${isSelected ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-400"}`}>
                          {(m.display_name || m.name).substring(0, 1).toUpperCase()}
                        </div>
                      )}
                      {isSelected && (
                        <div className="absolute -right-1 -bottom-1 bg-blue-600 text-white rounded-full p-0.5 border-2 border-blue-50">
                          <Check size={8} strokeWidth={4} />
                        </div>
                      )}
                    </div>
                    <span className="font-bold text-xs pr-1">{m.display_name || m.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* МУЛЬТИВЫБОР УСЛУГ */}
          <div className="space-y-1 relative" ref={serviceRef}>
            <label className="text-xs text-slate-400 ml-1">Услуги</label>
            <button
              type="button"
              onClick={() => setIsServiceOpen(!isServiceOpen)}
              className={`w-full flex items-center justify-between bg-slate-50 border-2 transition-all rounded-2xl py-4 px-5 font-bold ${isServiceOpen ? "border-blue-500 ring-4 ring-blue-50" : "border-transparent"
                }`}
            >
              <div className="flex flex-col items-start overflow-hidden w-11/12 text-left">
                <span className={`truncate w-full ${formData.service_ids.length > 0 ? "text-slate-900" : "text-slate-400"}`}>
                  {formData.service_ids.length > 0
                    ? `Выбрано услуг: ${formData.service_ids.length}`
                    : "Выберите услуги"}
                </span>
                {formData.service_ids.length > 0 && (
                  <span className="text-[10px] text-blue-600 font-black flex gap-2 mt-0.5">
                    <span>Итого: {totals.price} ₽</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-slate-500">Время: {formatDuration(totals.duration)}</span>
                  </span>
                )}
              </div>
              <ChevronDown size={20} className={`text-slate-400 transition-transform ${isServiceOpen ? "rotate-180" : ""}`} />
            </button>

            {/* Блок выбранных тегов услуг (выводим снаружи для наглядности) */}
            {selectedServicesObjects.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-2">
                {selectedServicesObjects.map(s => (
                  <div key={s.id} className="flex items-center gap-1 bg-slate-100 text-slate-700 font-bold text-[11px] px-2.5 py-1 rounded-xl border border-slate-200">
                    <span className="truncate max-w-[120px]">{s.name}</span>
                    <span className="text-slate-400 text-[10px]">({formatDuration(s.duration_minutes || s.duration)})</span>
                    <button
                      type="button"
                      onClick={() => toggleService(s.id.toString())}
                      className="text-slate-400 hover:text-rose-500 ml-0.5 transition-colors"
                    >
                      <X size={12} strokeWidth={3} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {isServiceOpen && (
              <div className="absolute bottom-full mb-2 z-[120] w-full bg-white border border-slate-100 shadow-2xl rounded-[1.5rem] overflow-hidden animate-in fade-in slide-in-from-bottom-2">
                <div className="p-3 border-b border-slate-50 bg-slate-50/50 flex items-center gap-2">
                  <Search size={14} className="text-slate-400" />
                  <input
                    autoFocus type="text" placeholder="Поиск услуги..."
                    className="w-full bg-transparent border-none p-0 text-sm font-bold focus:ring-0"
                    value={serviceSearch}
                    onChange={(e) => setServiceSearch(e.target.value)}
                  />
                </div>
                <div className="max-h-60 overflow-y-auto custom-scrollbar p-2">
                  {Object.keys(groupedServices).map((category) => {
                    const filtered = groupedServices[category].filter(s => s.name.toLowerCase().includes(serviceSearch.toLowerCase()));
                    if (filtered.length === 0) return null;
                    return (
                      <div key={category} className="mb-3">
                        <div className="px-3 py-1 mb-1"><span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{category}</span></div>
                        {filtered.map((s: any) => {
                          const isChecked = formData.service_ids.includes(s.id.toString());
                          const servDuration = s.duration_minutes || s.duration || 0;
                          return (
                            <div
                              key={s.id}
                              onClick={() => toggleService(s.id.toString())}
                              className={`flex items-center justify-between p-3 rounded-xl cursor-pointer border transition-all mb-1 ${isChecked
                                  ? "bg-blue-50 border-blue-200 text-blue-900 font-bold"
                                  : "hover:bg-slate-50 border-transparent text-slate-700"
                                }`}
                            >
                              <div className="flex items-center gap-2 truncate pr-2">
                                <div className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${isChecked ? "bg-blue-600 border-blue-600 text-white" : "border-slate-300"}`}>
                                  {isChecked && <Check size={12} strokeWidth={4} />}
                                </div>
                                <span className="text-sm font-bold truncate">{s.name}</span>
                              </div>
                              <div className="text-right flex flex-col min-w-[65px]">
                                <span className={`text-xs ${isChecked ? "text-blue-700 font-black" : "text-slate-900 font-bold"}`}>{Math.round(s.price)} ₽</span>
                                <span className="text-[10px] text-slate-400 font-medium">{formatDuration(servDuration)}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* КРАСИВЫЙ РАЗДЕЛЬНЫЙ ВЫБОР ДАТЫ И ВРЕМЕНИ */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-slate-400 ml-1">Дата</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-4 text-slate-400 pointer-events-none" size={18} />
                <input
                  type="date" required
                  className="w-full bg-slate-50 border-none rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-blue-500 font-bold text-sm text-slate-800"
                  value={formData.date}
                  onChange={e => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-400 ml-1">Время</label>
              <div className="relative">
                <Clock className="absolute left-4 top-4 text-slate-400 pointer-events-none" size={18} />
                <input
                  type="time" required
                  className="w-full bg-slate-50 border-none rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-blue-500 font-bold text-sm text-slate-800"
                  value={formData.time}
                  onChange={e => setFormData({ ...formData, time: e.target.value })}
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={formData.service_ids.length === 0}
            className="w-full py-5 bg-blue-600 text-white rounded-[1.5rem] font-black text-lg shadow-xl hover:bg-blue-700 transition-all active:scale-95 shadow-blue-100 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none disabled:pointer-events-none"
          >
            Создать запись
          </button>
        </form>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        /* Красивый сброс стандартных иконок календарей у браузеров, так как мы используем Lucide-иконки слева */
        input[-webkit-calendar-picker-indicator] {
          background: transparent;
          bottom: 0;
          color: transparent;
          cursor: pointer;
          height: auto;
          left: 0;
          position: absolute;
          right: 0;
          top: 0;
          width: auto;
        }
      `}</style>
    </div>
  );
}