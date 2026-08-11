"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Calendar from 'react-calendar';
import { Clock, Settings, Loader2, Plus, Trash2, Coffee, Sparkles, Briefcase, CalendarRange, CheckCircle2 } from "lucide-react";
import 'react-calendar/dist/Calendar.css';

const calendarStyles = `
  /* 1. Общие настройки — убираем дефолтную рамку и центрируем */
  .react-calendar {
    width: 100% !important;
    background: transparent !important;
    border: none !important;
    font-family: inherit !important;
  }

  /* 2. Премиальная навигация (Шапка с кнопками месяцев) */
  .react-calendar__navigation {
    display: flex;
    height: 46px !important;
    margin-bottom: 20px !important;
    gap: 6px;
  }

  .react-calendar__navigation button {
    min-width: 44px !important;
    background-color: #f8fafc !important; /* bg-slate-50 */
    border: 1px solid #f1f5f9 !important; /* border-slate-100 */
    border-radius: 12px !important;
    font-weight: 600 !important;
    font-size: 14px !important;
    color: #0f172a !important;
    transition: all 0.2s ease !important;
  }

  .react-calendar__navigation button:enabled:hover,
  .react-calendar__navigation button:enabled:focus {
    background-color: #f1f5f9 !important;
    transform: scale(0.97);
  }

  .react-calendar__navigation button:disabled { 
    background: transparent !important; 
    color: #cbd5e1 !important; 
    cursor: not-allowed; 
  }

  /* Текст текущего месяца в шапке */
  .react-calendar__navigation__label {
    font-size: 13px !important;
    text-transform: uppercase !important;
    letter-spacing: 0.05em !important;
    font-weight: 700 !important;
    color: #475569 !important;
    pointer-events: none !important;
  }

  /* 3. Дни недели (Пн, Вт, Ср...) */
  .react-calendar__month-view__weekdays {
    text-transform: uppercase !important;
    font-size: 10px !important;
    font-weight: 700 !important;
    letter-spacing: 0.05em !important;
    color: #94a3b8 !important;
    margin-bottom: 12px !important;
    text-align: center;
  }

  .react-calendar__month-view__weekdays__weekday abbr {
    text-decoration: none !important;
  }

  /* 4. Базовая плитка дня (Сохраняем паддинги из рабочей версии для стабильности клика) */
  .react-calendar__tile {
    padding: 1.5em 0.5em !important; 
    font-weight: 700 !important;
    font-size: 0.85rem !important;
    border: 2px solid transparent !important; 
    border-radius: 14px !important;
    transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1) !important;
    color: #334155 !important;
  }

  /* Соседние месяцы */
  .react-calendar__month-view__days__day--neighboringMonth {
    color: #cbd5e1 !important;
    opacity: 0.25 !important;
  }

  /* Обычный ховер на день */
  .react-calendar__tile:enabled:hover,
  .react-calendar__tile:enabled:focus {
    background-color: #f1f5f9 !important;
    color: #0f172a !important;
    cursor: pointer;
  }

  /* Сегодняшняя дата (аккуратный контур) */
  .react-calendar__tile--now {
    border: 2px solid #e2e8f0 !important;
    background: #f8fafc !important;
    border-radius: 14px !important;
  }

  /* ======================================================== */
  /* ТВОИ РАБОЧИЕ КЛАССЫ В НОВОЙ ПРЕМИАЛЬНОЙ ПАЛИТРЕ          */
  /* ======================================================== */

  /* Рабочий день */
  .month-tile-working {
    background-color: #ecfdf5 !important; /* Мягкий изумрудный */
    color: #059669 !important;
    border-radius: 14px !important;
    border: 2px solid #d1fae5 !important;
    font-weight: 800 !important;
  }

  /* Выходной день */
  .month-tile-weekend {
    background-color: #f8fafc !important;
    color: #64748b !important;
    border-radius: 14px !important;
    font-weight: 500 !important;
  }

  /* НАВЕДЕНИЕ НА КАСТОМНЫЕ ДНИ */
  .month-tile-working:enabled:hover {
    background-color: #d1fae5 !important;
  }

  /* ======================================================== */
  /* ПОДДСВЕТКА АКТИВНОГО ВЫБРАННОГО ДНЯ                      */
  /* ======================================================== */

  /* Выбранный кликом обычный день (Премиальный синий аутлайн-фокус) */
  .react-calendar__tile--active {
    background-color: #f0f5ff !important;
    border-color: #2563eb !important; 
    color: #1d4ed8 !important;
    font-weight: 800 !important;
    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.08) !important;
  }

  /* Если день И рабочий, И выбран кликом одновременно (Сочный зеленый контур) */
  .react-calendar__tile--active.month-tile-working {
    background-color: #e6fbf1 !important;
    border-color: #10b981 !important; 
    color: #047857 !important;
    font-weight: 800 !important;
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.08) !important;
  }
`;

export default function ScheduleTab({ selectedMaster, scheduleData, setScheduleData, onSave, onBack }: any) {
  const [isSaving, setIsSaving] = useState(false);

  // Храним объект даты, чтобы Calendar жестко контролировал переключение месяцев
  const [activeStartDate, setActiveStartDate] = useState<Date>(new Date());

  // Выбранный конкретный день для настройки окон в левой панели
  const [selectedDateStr, setSelectedDateStr] = useState<string>("");

  // Основной стейт расписания по месяцам
  // Новая структура JSON-схемы time_slots привязана к конкретным датам:
  // { "2026-06": { work_days: ["2026-06-18"], time_slots: { "2026-06-18": [{start_time: "09:00", end_time: "18:00"}] } } }
  const [monthlySchedules, setMonthlySchedules] = useState<Record<string, { work_days: string[], time_slots: Record<string, any[]> }>>({});
  const calendarValue = selectedDateStr ? new Date(selectedDateStr) : null;
  const pad = (n: number) => n.toString().padStart(2, '0');

  const currentMonthStr = useMemo(() => {
    return `${activeStartDate.getFullYear()}-${pad(activeStartDate.getMonth() + 1)}`;
  }, [activeStartDate]);

  const getLocalDateString = (dateObj: Date) => {
    return `${dateObj.getFullYear()}-${pad(dateObj.getMonth() + 1)}-${pad(dateObj.getDate())}`;
  };

  // Инициализация данных
  useEffect(() => {
    // Если monthlySchedules еще не заполнен (самый первый рендер), 
    // тогда задаем начальный месяц и дату
    if (Object.keys(monthlySchedules).length === 0) {
      const now = new Date();
      setActiveStartDate(now);
      setSelectedDateStr(getLocalDateString(now));
    }

    if (scheduleData && typeof scheduleData === 'object' && !Array.isArray(scheduleData)) {
      setMonthlySchedules(scheduleData);
    } else {
      setMonthlySchedules({});
    }
  }, [scheduleData]);

  // Конфигурация для текущего выбранного месяца
  const currentMonthConfig = useMemo(() => {
    return monthlySchedules[currentMonthStr] || { work_days: [], time_slots: {} };
  }, [monthlySchedules, currentMonthStr]);

  // Окна конкретно для выбранного в данный момент дня в левой панели
  const activeDaySlots = useMemo(() => {
    if (!selectedDateStr) return [];
    return currentMonthConfig.time_slots[selectedDateStr] || [];
  }, [currentMonthConfig, selectedDateStr]);

  // Безопасное обновление конфигурации месяца
  const updateMonthConfig = (updates: Partial<{ work_days: string[], time_slots: Record<string, any[]> }>) => {
    const nextConfig = { ...currentMonthConfig, ...updates };
    const nextMonthlySchedules = { ...monthlySchedules, [currentMonthStr]: nextConfig };

    setMonthlySchedules(nextMonthlySchedules);
    setScheduleData(nextMonthlySchedules);
  };

  // Клик по дню: устанавливает день активным для настройки окон + включает/выключает рабочий статус
  const handleDayClick = (date: Date) => {
    const dateStr = getLocalDateString(date);
    setSelectedDateStr(dateStr); // Делаем день активным для левой панели окон

    const isAlreadyWorking = currentMonthConfig.work_days.includes(dateStr);
    let nextWorkDays = [...currentMonthConfig.work_days];
    let nextTimeSlots = { ...currentMonthConfig.time_slots };

    if (isAlreadyWorking) {
      // Если кликнули по рабочему дню — делаем его выходным и стираем его окна
      nextWorkDays = nextWorkDays.filter(d => d !== dateStr);
      delete nextTimeSlots[dateStr];
    } else {
      // Если делаем рабочим — добавляем в список и инициализируем дефолтным окном
      nextWorkDays = [...nextWorkDays, dateStr].sort();
      if (!nextTimeSlots[dateStr]) {
        nextTimeSlots[dateStr] = [{ start_time: "09:00", end_time: "18:00" }];
      }
    }

    updateMonthConfig({ work_days: nextWorkDays, time_slots: nextTimeSlots });
  };

  // --- УПРАВЛЕНИЕ ОКНАМИ ДЛЯ ВЫБРАННОГО ДНЯ ---
  const addTimeSlot = () => {
    if (!selectedDateStr || !currentMonthConfig.work_days.includes(selectedDateStr)) return;

    const nextTimeSlots = { ...currentMonthConfig.time_slots };
    const currentSlots = [...(nextTimeSlots[selectedDateStr] || [])];
    const lastEnd = currentSlots[currentSlots.length - 1]?.end_time || "18:00";

    currentSlots.push({ start_time: lastEnd, end_time: "21:00" });
    nextTimeSlots[selectedDateStr] = currentSlots;

    updateMonthConfig({ time_slots: nextTimeSlots });
  };

  const removeTimeSlot = (index: number) => {
    const nextTimeSlots = { ...currentMonthConfig.time_slots };
    const currentSlots = (nextTimeSlots[selectedDateStr] || []).filter((_, i) => i !== index);

    if (currentSlots.length === 0) {
      // Если удалили последнее окно, логично сделать день выходным
      const nextWorkDays = currentMonthConfig.work_days.filter(d => d !== selectedDateStr);
      delete nextTimeSlots[selectedDateStr];
      updateMonthConfig({ work_days: nextWorkDays, time_slots: nextTimeSlots });
    } else {
      nextTimeSlots[selectedDateStr] = currentSlots;
      updateMonthConfig({ time_slots: nextTimeSlots });
    }
  };

  const updateTimeSlot = (index: number, key: 'start_time' | 'end_time', value: string) => {
    const nextTimeSlots = { ...currentMonthConfig.time_slots };
    const currentSlots = [...(nextTimeSlots[selectedDateStr] || [])];

    currentSlots[index] = { ...currentSlots[index], [key]: value };
    nextTimeSlots[selectedDateStr] = currentSlots;

    updateMonthConfig({ time_slots: nextTimeSlots });
  };

  // --- ПРЕСЕТЫ АВТОЗАПОЛНЕНИЯ С ДЕФОЛТНЫМИ ОКНАМИ ---
  const getDaysInMonth = (dateObj: Date) => {
    const date = new Date(dateObj.getFullYear(), dateObj.getMonth(), 1);
    const days: Date[] = [];
    while (date.getMonth() === dateObj.getMonth()) {
      days.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
    return days;
  };

  const applyPresetStructure = (filterFn: (date: Date, idx: number) => boolean) => {
    const allDays = getDaysInMonth(activeStartDate);
    const nextWorkDays: string[] = [];
    const nextTimeSlots: Record<string, any[]> = {}; // Гарантируем, что здесь будет словарь списков

    allDays.forEach((date, index) => {
      if (filterFn(date, index)) {
        const dateStr = getLocalDateString(date);
        nextWorkDays.push(dateStr);
        // КАЖДОЙ ДАТЕ ПРИСВАИВАЕМ ИМЕННО МАССИВ С ОБЪЕКТОМ ВНУТРИ, А НЕ ПРОСТО ОБЪЕКТ
        nextTimeSlots[dateStr] = [{ start_time: "09:00", end_time: "18:00" }];
      }
    });

    updateMonthConfig({ work_days: nextWorkDays, time_slots: nextTimeSlots });
    if (nextWorkDays.length > 0) setSelectedDateStr(nextWorkDays[0]);
  };

  const applyWeekdaysPreset = () => applyPresetStructure((date) => date.getDay() !== 0 && date.getDay() !== 6);
  const apply2to2Preset = () => applyPresetStructure((_, idx) => (idx % 4) === 0 || (idx % 4) === 1);
  const clearMonthPreset = () => {
    updateMonthConfig({ work_days: [], time_slots: {} });
    setSelectedDateStr("");
  };

  // Стилизация плиток
  const getTileClassName = ({ date, view }: any) => {
    if (view !== 'month') return null;
    const dateStr = getLocalDateString(date);

    // Проверяем, относится ли день к выбранному месяцу
    if (date.getFullYear() !== activeStartDate.getFullYear() || date.getMonth() !== activeStartDate.getMonth()) {
      return 'text-slate-300 opacity-20 pointer-events-none';
    }

    let classes = "";

    // 1. Красим в зеленый, если день рабочий
    if (currentMonthConfig.work_days.includes(dateStr)) {
      classes += ' month-tile-working';
    } else {
      classes += ' month-tile-weekend';
    }

    // 2. Добавляем синюю рамку/фон, если этот день сейчас выбран в левой панели
    if (dateStr === selectedDateStr) {
      classes += ' react-calendar__tile--active';
    }

    return classes;
  };

  const handleSave = async () => {
    setIsSaving(true);

    // Глубокая очистка стейта перед отправкой на бэкенд
    const cleanedSchedules = { ...monthlySchedules };

    Object.keys(cleanedSchedules).forEach(monthKey => {
      const monthData = cleanedSchedules[monthKey];
      if (monthData && monthData.time_slots) {
        const cleanedSlots: Record<string, any[]> = {};

        // Оставляем только те ключи, которые похожи на дату YYYY-MM-DD (длина 10)
        // и у которых значение является массивом
        Object.keys(monthData.time_slots).forEach(dateKey => {
          if (dateKey.length === 10 && Array.isArray(monthData.time_slots[dateKey])) {
            cleanedSlots[dateKey] = monthData.time_slots[dateKey];
          }
        });

        cleanedSchedules[monthKey] = {
          ...monthData,
          time_slots: cleanedSlots
        };
      }
    });

    await onSave(cleanedSchedules);
    setIsSaving(false);
  };

  return (
    <div className="bg-white/80 backdrop-blur-md rounded-[2rem] p-6 md:p-8 border border-slate-100 shadow-xl shadow-slate-100/40 max-w-6xl w-full transition-all duration-300">
      <style>{calendarStyles}</style>

      {/* ШАПКА КОМПОНЕНТА */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-100">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="w-11 h-11 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100 text-slate-500 hover:text-slate-800 hover:bg-slate-100 hover:scale-95 transition-all duration-200"
          >
            <Clock size={18} strokeWidth={2.2} />
          </button>
          <div>
            <h2 className="text-xl md:text-2xl font-semibold tracking-tight text-slate-900">
              {selectedMaster?.display_name || "График мастера"}
            </h2>
            <p className="text-xs text-slate-400 font-medium tracking-tight flex items-center gap-1.5 mt-0.5">
              <CalendarRange size={14} className="text-blue-500" strokeWidth={2.2} />
              Индивидуальная настройка рабочих интервалов по дням
            </p>
          </div>
        </div>

        <div className="self-start sm:self-auto bg-slate-900 text-white font-semibold px-4 py-2.5 rounded-xl text-xs tracking-wide capitalize shadow-md shadow-slate-900/10 border border-slate-800">
          📅 {activeStartDate.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* ЛЕВАЯ ПАНЕЛЬ: УПРАВЛЕНИЕ ОКНАМИ И ШАБЛОНЫ */}
        <div className="lg:col-span-1 space-y-6">

          {/* Блок окон для выбранного дня */}
          <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between px-0.5">
              <div className="flex flex-col">
                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                  <Coffee size={12} className="text-amber-500" strokeWidth={2.5} /> Рабочие окна
                </label>
                <span className="text-xs font-semibold text-blue-600 mt-0.5">
                  {selectedDateStr ? new Date(selectedDateStr).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }) : "Выберите день"}
                </span>
              </div>

              {selectedDateStr && currentMonthConfig.work_days.includes(selectedDateStr) && (
                <button
                  type="button"
                  onClick={addTimeSlot}
                  className="text-xs text-blue-600 font-semibold cursor-pointer flex items-center gap-1 hover:text-blue-700 transition-colors hover:bg-blue-500/20 p-2 rounded-xl"
                >
                  <Plus size={14} strokeWidth={2.5} /> Добавить
                </button>
              )}
            </div>

            <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin">
              {currentMonthConfig.work_days.includes(selectedDateStr) ? (
                activeDaySlots.map((slot: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-slate-100 shadow-sm hover:border-slate-200 transition-all">
                    <input
                      type="time"
                      className="w-full p-1.5 cursor-pointer bg-slate-50/50 hover:bg-slate-50 focus:bg-white rounded-lg font-medium text-xs text-center text-slate-800 border border-transparent focus:border-slate-200 transition-all outline-none"
                      value={slot.start_time}
                      onChange={(e) => updateTimeSlot(idx, 'start_time', e.target.value)}
                    />
                    <span className="text-slate-300 font-medium text-xs">—</span>
                    <input
                      type="time"
                      className="w-full p-1.5 cursor-pointer bg-slate-50/50 hover:bg-slate-50 focus:bg-white rounded-lg font-medium text-xs text-center text-slate-800 border border-transparent focus:border-slate-200 transition-all outline-none"
                      value={slot.end_time}
                      onChange={(e) => updateTimeSlot(idx, 'end_time', e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => removeTimeSlot(idx)}
                      className="p-1.5 text-slate-400 hover:text-rose-500 cursor-pointer hover:bg-rose-50/50 rounded-lg transition-all"
                    >
                      <Trash2 size={14} strokeWidth={2.2} />
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-xs text-slate-400 font-medium bg-white rounded-xl border border-dashed border-slate-200/60">
                  Выбранный день является выходным
                </div>
              )}
            </div>
          </div>

          {/* Быстрые шаблоны автозаполнения */}
          <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100 space-y-3">
            <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
              <Sparkles size={12} className="text-blue-500" strokeWidth={2.2} /> Шаблоны заполнения
            </label>
            <div className="grid grid-cols-1 gap-2">

              <button
                type="button"
                onClick={applyWeekdaysPreset}
                className="group cursor-pointer relative flex flex-col items-start p-4 bg-white border border-slate-200 rounded-2xl text-left hover:border-blue-500 hover:shadow-[0_8px_20px_-6px_rgba(37,99,235,0.08)] active:scale-[0.98] transition-all"
              >
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all mb-3">
                  <CheckCircle2 size={16} strokeWidth={2.5} />
                </div>
                <span className="font-bold text-slate-800 text-xs">Пятидневка</span>
                <span className="text-[10px] text-slate-400 mt-0.5 font-medium">Будни (Пн-Пт)</span>
              </button>
              <button
                type="button"
                onClick={apply2to2Preset}
                className="group relative cursor-pointer flex flex-col items-start p-4 bg-white border border-slate-200 rounded-2xl text-left hover:border-emerald-500 hover:shadow-[0_8px_20px_-6px_rgba(16,185,129,0.08)] active:scale-[0.98] transition-all"
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all mb-3">
                  <Sparkles size={15} strokeWidth={2.5} />
                </div>
                <span className="font-bold text-slate-800 text-xs">Сменный график</span>
                <span className="text-[10px] text-slate-400 mt-0.5 font-medium">По схеме 2 через 2</span>
              </button>
              
              <button
                type="button"
                onClick={clearMonthPreset}
                className="w-full cursor-pointer bg-white border border-rose-100 text-rose-600 hover:bg-rose-50/50 py-2.5 px-3.5 rounded-xl font-medium text-xs transition-all text-left flex items-center justify-between"
              >
                <span className="font-bold text-slate-800 text-xs">Очистить весь месяц</span>
                <Trash2 size={13} className="opacity-60" />
              </button>
            </div>
          </div>
          <div className="space-y-2 pt-2">
            {/* Главная кнопка действия */}
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="w-full bg-blue-600 cursor-pointer text-white py-3.5 rounded-xl font-semibold text-sm shadow-lg shadow-blue-600/15 hover:bg-blue-700 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
            >
              {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Settings size={16} />}
              {isSaving ? "Сохранение..." : "Сохранить график"}
            </button>
            <button
              type="button"
              onClick={onBack} // Вызываем тот же колбэк возврата, но без сохранения
              disabled={isSaving}
              className="w-full bg-slate-200 cursor-pointer text-slate-400 hover:text-slate-600 hover:bg-slate-300 py-3 rounded-xl font-medium text-xs transition-all duration-200 flex items-center justify-center gap-1.5 disabled:opacity-30"
            >
              Отменить и вернуться к мастерам
            </button>
          </div>
        </div>

        {/* ПРАВАЯ ПАНЕЛЬ: ИНТЕРАКТИВНЫЙ КАЛЕНДАРЬ */}
        <div className="lg:col-span-2">
          <div className="border border-slate-100 rounded-2xl p-4 md:p-6 h-full flex flex-col justify-between bg-white shadow-sm">
            <div>
              <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
                <div>
                  <h4 className="font-semibold text-slate-900 text-xs uppercase tracking-wider">Интерактивный календарь</h4>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">Клик по дню открывает настройку его окон слева</p>
                </div>
                <div className="flex gap-4">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Рабочий</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-100 border border-slate-200" />
                    <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Выходной</span>
                  </div>
                </div>
              </div>

              {/* Контейнер календаря */}
              <div className="inline-calendar-wrapper">
                <Calendar
                  locale="ru-RU"
                  onClickDay={handleDayClick}
                  value={calendarValue}
                  tileClassName={getTileClassName}
                  activeStartDate={activeStartDate}
                  onActiveStartDateChange={({ activeStartDate }) => {
                    if (activeStartDate) {
                      setActiveStartDate(activeStartDate);
                      const pad = (n: number) => n.toString().padStart(2, '0');
                      const firstDayOfNewMonth = `${activeStartDate.getFullYear()}-${pad(activeStartDate.getMonth() + 1)}-01`;
                      setSelectedDateStr(firstDayOfNewMonth);
                    }
                  }}
                  prev2Label={null}
                  next2Label={null}
                  view="month"
                />
              </div>
            </div>

            {/* Статистика по месяцу внизу панели */}
            <div className="mt-6 p-4 bg-slate-50/60 rounded-xl border border-slate-100 flex items-center gap-4">
              <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-bold text-sm border border-emerald-100/60 shadow-sm">
                {currentMonthConfig.work_days.length}
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Статистика месяца</p>
                <p className="font-medium text-slate-700 text-xs mt-0.5">
                  Активных рабочих смен: <span className="text-emerald-600 font-semibold">{currentMonthConfig.work_days.length} дн.</span>
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}