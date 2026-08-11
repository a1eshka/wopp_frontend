"use client";

import React, { useEffect, useState, useRef } from "react";
import { DayPicker, DateRange } from "react-day-picker";
import { format, parseISO, isValid } from "date-fns";
import { ru } from "date-fns/locale";
import "react-day-picker/dist/style.css";

import { 
  Star, 
  Award, 
  TrendingUp, 
  Download, 
  Clock, 
  Zap, 
  BarChart3, 
  CalendarDays, 
  CheckCircle2, 
  XCircle,
  HelpCircle,
  ArrowUpRight,
  Calendar as CalendarIcon,
  ChevronDown,
  Lock,
  Eye,
  EyeOff
} from "lucide-react";

export interface AnalyticsData {
  total_revenue: number;
  total_consumables_cost: number;
  net_profit: number;
  monthly_forecast: number;
  goal_percent: number;
  avg_check: number;
  total_appointments: number;
  successful_appointments: number;
  cancelled_appointments: number;
  services_efficiency: Array<{ name: string; revenue_per_minute: number }>;
  heatmap: Array<{ weekday: number; hour: number; count: number }>;
  top_services: Array<{ name: string; count: number; share: number }>;
  masters_performance: Array<{ name: string; count: number; revenue: number }>;
}

export type PeriodType = 'today' | 'week' | 'month' | 'custom';




interface AnalyticsTabProps {
  data: AnalyticsData | null;
  period: PeriodType;
  setPeriod: (period: PeriodType) => void;
  startDate?: string;
  endDate?: string;
  onCustomDateChange?: (start: string, end: string) => void;
  subscription?: {
    plan_id: number;
    [key: string]: any;
  } | null;
}

export default function AnalyticsTab({ 
  data, 
  period, 
  setPeriod,
  startDate = "",
  endDate = "",
  onCustomDateChange,
  subscription
}: AnalyticsTabProps) {
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  
  // Состояние скрытия заблюренных блоков с сохранением в localStorage
  const [hideRestricted, setHideRestricted] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("analytics_hide_restricted") === "true";
    }
    return false;
  });

  useEffect(() => {
    localStorage.setItem("analytics_hide_restricted", String(hideRestricted));
  }, [hideRestricted]);
  const planId = subscription?.plan_id;
  const isRestrictedPlan = planId !== undefined ? planId === 2 : false;
 
  console.log('planid;', planId)
  console.log('subscription object:', subscription);
  // Если нужно блокировать и на 2 тарифе (например, если аналитика только на 3):
  // const isRestrictedPlan = subscription?.plan_id === 1 || subscription?.plan_id === 2;

  const [range, setRange] = useState<DateRange | undefined>(() => {
    const from = startDate && isValid(parseISO(startDate)) ? parseISO(startDate) : undefined;
    const to = endDate && isValid(parseISO(endDate)) ? parseISO(endDate) : undefined;
    return { from, to };
  });

  const datePickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const from = startDate && isValid(parseISO(startDate)) ? parseISO(startDate) : undefined;
    const to = endDate && isValid(parseISO(endDate)) ? parseISO(endDate) : undefined;
    setRange({ from, to });
  }, [startDate, endDate]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setIsDatePickerOpen(false);
      }
    };

    if (isDatePickerOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDatePickerOpen]);

  const handleToggleDatePicker = () => {
    if (!isDatePickerOpen) {
      const from = startDate && isValid(parseISO(startDate)) ? parseISO(startDate) : undefined;
      const to = endDate && isValid(parseISO(endDate)) ? parseISO(endDate) : undefined;
      setRange({ from, to });
    }
    setIsDatePickerOpen(!isDatePickerOpen);
  };

  const handleSelectPreset = (id: 'today' | 'week' | 'month') => {
    setPeriod(id);
    setIsDatePickerOpen(false);
    if (onCustomDateChange) {
      onCustomDateChange("", "");
    }
  };

  const handleApplyCustomDates = () => {
    if (range?.from && range?.to && onCustomDateChange) {
      const formattedStart = format(range.from, "yyyy-MM-dd");
      const formattedEnd = format(range.to, "yyyy-MM-dd");
      onCustomDateChange(formattedStart, formattedEnd);
      setPeriod('custom');
      setIsDatePickerOpen(false);
    }
  };

  const handleExport = async (formatType: 'csv' | 'xlsx') => {
    try {
      const token = localStorage.getItem('token');
      
      let exportUrl = `https://api.wopp.ru/api/organizations/stats/export?format=${formatType}&period=${period}`;
      if (period === 'custom' && startDate && endDate) {
        exportUrl += `&start_date=${startDate}&end_date=${endDate}`;
      }

      const res = await fetch(exportUrl, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Ошибка экспорта");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report_${period}_${new Date().toISOString().split('T')[0]}.${formatType}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Ошибка экспорта:", err);
    }
  };

  if (!data) {
    return (
      <div className="space-y-6 animate-pulse p-1">
        <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-50 p-2 rounded-xl border border-slate-200/60">
          <div className="h-9 w-64 bg-slate-200/60 rounded-lg" />
          <div className="h-9 w-32 bg-slate-200/80 rounded-lg" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200/50 flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-100 rounded-xl flex-shrink-0" />
              <div className="space-y-2 flex-1">
                <div className="h-3 w-16 bg-slate-200/60 rounded" />
                <div className="h-6 w-28 bg-slate-200 rounded" />
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="md:col-span-2 bg-slate-900 p-6 rounded-2xl h-[180px] flex flex-col justify-between" />
          <div className="bg-white p-6 rounded-2xl border border-slate-200/50 h-[180px]" />
        </div>
      </div>
    );
  }

  const weekdays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
  const backendDayIds = [2, 3, 4, 5, 6, 7, 1];
  const workHours = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];

  const successRate = data.total_appointments > 0 
    ? Math.round((data.successful_appointments / data.total_appointments) * 100) 
    : 0;

  const cancellationRate = data.total_appointments > 0 
    ? Math.round((data.cancelled_appointments / data.total_appointments) * 100) 
    : 0;

  const BlockTooltip = ({ text, light = false }: { text: string; light?: boolean }) => (
    <div className="absolute top-4 right-4 z-30 flex items-center justify-center">
      <div className="relative flex items-center justify-center">
        <button 
          type="button"
          className={`peer p-1.5 rounded-lg transition-colors cursor-help relative z-30 ${
            light 
              ? 'text-slate-500 hover:text-slate-300 hover:bg-white/5' 
              : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
          }`}
        >
          <HelpCircle size={15} />
        </button>

        <div className="absolute bottom-full right-0 mb-2 w-60 translate-x-[5%] scale-95 rounded-xl bg-slate-950 p-3 text-[11px] font-medium leading-relaxed text-slate-300 opacity-0 shadow-xl border border-slate-800 transition-all duration-200 pointer-events-none z-[100] backdrop-blur-md peer-hover:scale-100 peer-hover:opacity-100">
          {text}
        </div>
      </div>
    </div>
  );

  const LockOverlay = () => (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/20 backdrop-blur-[2px] rounded-2xl p-4 text-center">
      <div className="p-2.5 bg-slate-950 text-white rounded-xl shadow-lg border border-slate-800 mb-2.5">
        <Lock size={16} />
      </div>
      <span className="text-xs font-bold text-slate-900 tracking-tight">Раздел недоступен</span>
      <p className="text-[10px] text-slate-600 font-medium mt-0.5 max-w-[200px]">
        Обновите тариф для доступа к расширенным аналитическим отчетам
      </p>
    </div>
  );

  return (
    <div className="space-y-6 text-slate-900 antialiased p-0.5">
      
      {/* ПАНЕЛЬ УПРАВЛЕНИЯ */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white border border-slate-200/70 p-2 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Селектор периодов */}
          <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-lg border border-slate-200/40 relative">
            {(['today', 'week', 'month'] as const).map((id) => (
              <button
                key={id}
                onClick={() => handleSelectPreset(id)}
                className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all duration-200 cursor-pointer ${
                  period === id 
                    ? 'bg-white text-slate-950 shadow-sm border border-slate-200/50 font-bold' 
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {id === 'today' ? 'Сегодня' : id === 'week' ? 'Неделя' : 'Месяц'}
              </button>
            ))}

            <div className="relative" ref={datePickerRef}>
              <button
                onClick={handleToggleDatePicker}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 cursor-pointer ${
                  period === 'custom'
                    ? 'bg-white text-slate-950 shadow-sm border border-slate-200/50 font-bold'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <CalendarIcon size={13} />
                <span>
                  {period === 'custom' && startDate && endDate
                    ? `${format(parseISO(startDate), "dd.MM")} - ${format(parseISO(endDate), "dd.MM")}`
                    : 'Период'}
                </span>
                <ChevronDown size={12} className={`transition-transform duration-200 ${isDatePickerOpen ? 'rotate-180' : ''}`} />
              </button>

              {isDatePickerOpen && (
                <div className="absolute top-full left-0 mt-2 p-4 bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl shadow-[0_10px_38px_-10px_rgba(22,23,24,0.35),0_10px_20px_-15px_rgba(22,23,24,0.2)] z-50 space-y-3 min-w-[320px] animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <span className="text-xs font-bold text-slate-800 tracking-tight">Выберите диапазон дат</span>
                    {(range?.from || range?.to) && (
                      <button 
                        onClick={() => setRange(undefined)} 
                        className="text-[10px] font-semibold text-slate-400 hover:text-rose-500 transition-colors"
                      >
                        Сбросить
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className={`p-2 rounded-xl text-center border transition-all ${
                      range?.from 
                        ? 'bg-indigo-50/50 border-indigo-200/80 text-indigo-950 shadow-2xs' 
                        : 'bg-slate-50 border-slate-200/80 text-slate-400'
                    }`}>
                      <span className="text-[9px] text-slate-400 block font-semibold uppercase tracking-wider">С</span>
                      <span className="font-bold">
                        {range?.from ? format(range.from, "dd.MM.yyyy") : "—"}
                      </span>
                    </div>
                    <div className={`p-2 rounded-xl text-center border transition-all ${
                      range?.to 
                        ? 'bg-indigo-50/50 border-indigo-200/80 text-indigo-950 shadow-2xs' 
                        : 'bg-slate-50 border-slate-200/80 text-slate-400'
                    }`}>
                      <span className="text-[9px] text-slate-400 block font-semibold uppercase tracking-wider">По</span>
                      <span className="font-bold">
                        {range?.to ? format(range.to, "dd.MM.yyyy") : "—"}
                      </span>
                    </div>
                  </div>

                  <div className="rdp-custom-container flex justify-center py-1 select-none">
                    <DayPicker
                      mode="range"
                      selected={range}
                      onSelect={setRange}
                      locale={ru}
                      styles={{
                        caption: { color: '#0f172a', fontWeight: '700', fontSize: '13px' },
                        head_cell: { color: '#94a3b8', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase' },
                        cell: { padding: '1px' },
                        day: { borderRadius: '8px', fontSize: '12px', width: '32px', height: '32px', margin: '0' }
                      }}
                      modifiersClassNames={{
                        selected: '!bg-slate-950 !text-white font-bold shadow-xs rounded-lg',
                        range_start: '!bg-slate-950 !text-white !rounded-l-lg !rounded-r-none font-bold',
                        range_end: '!bg-slate-950 !text-white !rounded-r-lg !rounded-l-none font-bold',
                        range_middle: '!bg-indigo-50 !text-indigo-950 !rounded-none font-semibold',
                        today: 'border-2 border-indigo-500/50 text-indigo-600 rounded-lg font-bold'
                      }}
                      modifiersStyles={{
                        range_start: { boxShadow: '1px 0 0 0 white' },
                        range_end: { boxShadow: '-1px 0 0 0 white' }
                      }}
                    />
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => setIsDatePickerOpen(false)}
                      className="flex-1 py-1.5 text-xs text-slate-500 hover:bg-slate-50 rounded-lg transition-colors font-medium"
                    >
                      Отмена
                    </button>
                    <button
                      onClick={handleApplyCustomDates}
                      disabled={!range?.from || !range?.to}
                      className="flex-1 py-2 text-xs bg-slate-950 text-white rounded-lg hover:bg-slate-800 transition-colors font-semibold disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                    >
                      Применить
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Кнопка "Скрыть недоступные" под стиль UI */}
          {isRestrictedPlan && (
            <button
              onClick={() => setHideRestricted(!hideRestricted)}
              className={`px-3 py-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 border cursor-pointer ${
                hideRestricted
                  ? 'bg-olive-500/10 border-olive-500/30 text-olive-700 shadow-2xs font-bold'
                  : 'bg-slate-50 border-slate-200/50 text-slate-500 hover:text-slate-800 hover:bg-slate-100'
              }`}
            >
              {hideRestricted ? (
                <>
                  <EyeOff size={13} className="text-olive-600" />
                  <span>Показать недоступные</span>
                </>
              ) : (
                <>
                  <Eye size={13} className="text-slate-400" />
                  <span>Скрыть недоступные</span>
                </>
              )}
            </button>
          )}

        </div>

        {/* Экспорт XLSX скрыт для plan_id = 2 */}
        {!isRestrictedPlan && (
          <button 
            onClick={() => handleExport('xlsx')}
            className="px-4 py-2 bg-slate-950 text-white rounded-lg font-semibold text-xs flex items-center gap-2 hover:bg-slate-900 active:scale-[0.98] transition-all border border-slate-800 ml-auto"
          >
            <Download size={13} />
            <span>Экспорт XLSX</span>
          </button>
        )}
      </div>

      {/* ФИНАНСОВЫЕ ПОКАЗАТЕЛИ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.05)] transition-all duration-300 relative flex flex-col justify-between min-h-[140px]">
          <BlockTooltip text="Сумма всех фактически полученных средств за выполненные услуги за выбранный период." />
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100/60">
              <TrendingUp size={18} />
            </div>
            <span className="text-xs font-semibold text-slate-400 tracking-tight">Выручка</span>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold tracking-tight text-slate-900">{(data.total_revenue ?? 0).toLocaleString()} ₽</div>
            <div className="text-[10px] text-indigo-600 font-medium mt-1 flex items-center gap-0.5">
              <ArrowUpRight size={12} /> за выбранный период
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.05)] transition-all duration-300 relative flex flex-col justify-between min-h-[140px]">
          <BlockTooltip text="Суммарная себестоимость расходных материалов, затраченных на проведение выполненных услуг." />
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-50 text-slate-600 rounded-xl border border-slate-200/60">
              <Clock size={18} />
            </div>
            <span className="text-xs font-semibold text-slate-400 tracking-tight">Расходные материалы</span>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold tracking-tight text-slate-900">{(data.total_consumables_cost ?? 0).toLocaleString()} ₽</div>
            <div className="text-[10px] text-slate-400 font-medium mt-1">Себестоимость процессов</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-emerald-500/15 shadow-[0_8px_30px_rgb(16,185,129,0.02)] hover:shadow-[0_8px_30px_rgb(16,185,129,0.06)] transition-all duration-300 relative flex flex-col justify-between min-h-[140px]">
          <BlockTooltip text="Фактический доход организации за вычетом себестоимости материалов. Рассчитывается как: Выручка - Расходники." />
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100/60">
              <Zap size={18} className="fill-emerald-600/10" />
            </div>
            <span className="text-xs font-semibold text-slate-400 tracking-tight">Чистая прибыль</span>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold tracking-tight text-emerald-600">{(data.net_profit ?? 0).toLocaleString()} ₽</div>
            <div className="mt-1">
              <span className="inline-flex text-[10px] font-bold bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-100">
                Маржинальность {data.total_revenue > 0 ? Math.round((data.net_profit / data.total_revenue) * 100) : 0}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ТРЕНДЫ И ПРОГНОЗЫ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="md:col-span-2 bg-slate-950 p-6 rounded-2xl text-white flex flex-col justify-between min-h-[180px] relative border border-slate-800 shadow-xl overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl pointer-events-none -mr-12 -mt-12" />
          <BlockTooltip light text="Динамический прогноз выручки до конца текущего месяца на основе темпа текущих продаж." />
          
          <div className="relative z-10">
            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Прогноз до конца месяца</span>
            <div className="text-4xl font-bold tracking-tight mt-1">{(data.monthly_forecast ?? 0).toLocaleString()} ₽</div>
          </div>
          
          <div className="relative z-10 mt-6">
            <div className="flex justify-between text-[10px] font-semibold mb-2 text-slate-400">
              <span>Выполнение плановой цели</span>
              <span className="text-blue-400 font-bold">{data.goal_percent ?? 0}%</span>
            </div>
            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full transition-all duration-500 shadow-[0_0_12px_rgba(59,130,246,0.5)]" style={{ width: `${Math.min(data.goal_percent ?? 0, 100)}%` }} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.05)] transition-all duration-300 relative flex flex-col justify-between min-h-[180px]">
          <BlockTooltip text="Средняя стоимость одной выполненной и оплаченной услуги." />
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl w-fit border border-amber-100/50">
            <Zap size={18} className="fill-amber-600/10" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400">Средний чек</span>
            <div className="text-3xl font-bold tracking-tight text-slate-900 mt-0.5">{(data.avg_check ?? 0).toLocaleString()} ₽</div>
            <p className="text-[10px] text-slate-400 mt-1 font-medium">В расчете на один визит</p>
          </div>
        </div>
      </div>

      {/* ОПЕРАЦИОННЫЕ МЕТРИКИ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-xl border border-slate-200/60 flex items-center gap-4 relative shadow-sm">
          <BlockTooltip text="Общее количество сессий в системе за выбранный период." />
          <div className="p-3 bg-slate-50 text-slate-700 rounded-xl border border-slate-200/40">
            <CalendarDays size={18} />
          </div>
          <div>
            <span className="text-[11px] font-medium text-slate-400 block">Всего записей</span>
            <span className="text-xl font-bold text-slate-900">{data.total_appointments ?? 0}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/60 flex items-center gap-4 relative shadow-sm">
          <BlockTooltip text="Количество успешно выполненных услуг." />
          <div className="p-3 bg-emerald-50/60 text-emerald-600 rounded-xl border border-emerald-100/50">
            <CheckCircle2 size={18} />
          </div>
          <div>
            <span className="text-[11px] font-medium text-slate-400 block">Успешно визитов</span>
            <span className="text-xl font-bold text-slate-900">{data.successful_appointments ?? 0}</span>
            <span className="text-[10px] text-emerald-600 font-semibold ml-2">({successRate}% конверсия)</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/60 flex items-center gap-4 relative shadow-sm">
          <BlockTooltip text="Количество отмененных записей (No-Show Rate)." />
          <div className="p-3 bg-rose-50/60 text-rose-600 rounded-xl border border-rose-100/50">
            <XCircle size={18} />
          </div>
          <div>
            <span className="text-[11px] font-medium text-slate-400 block">Отменено / Пропущено</span>
            <span className="text-xl font-bold text-slate-900">{data.cancelled_appointments ?? 0}</span>
            <span className="text-[10px] text-rose-600 font-semibold ml-2">({cancellationRate}% отказов)</span>
          </div>
        </div>
      </div>

      {/* ЮНИТ-ЭКОНОМИКА И ТЕПЛОВАЯ КАРТА */}
{!(isRestrictedPlan && hideRestricted) && (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
    
    {/* Эффективность времени (Занимает 1 колонку из 3) */}
    <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm relative overflow-hidden transition-all duration-300">
      {isRestrictedPlan && <LockOverlay />}

      <div className={isRestrictedPlan ? "blur-md select-none pointer-events-none" : ""}>
        {!isRestrictedPlan && <BlockTooltip text="Показатель юнит-экономики: выручка от услуги деленная на время её выполнения." />}
        
        <div className="flex items-center gap-2 mb-6">
          <div className="p-2 bg-slate-50 text-slate-600 rounded-lg border border-slate-200/50">
            <Clock size={14} />
          </div>
          <h3 className="font-bold text-slate-800 text-xs tracking-tight">Эффективность времени</h3>
        </div>

        <div className="space-y-4">
          {data?.services_efficiency?.map((s, i) => (
            <div key={i} className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500 font-medium truncate max-w-[160px]">{s.name}</span>
                <span className="text-slate-900 font-semibold">
                  {s.revenue_per_minute} <span className="text-[10px] text-slate-400 font-normal">₽/мин</span>
                </span>
              </div>
              <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-slate-900 rounded-full transition-all duration-500" 
                  style={{ 
                    width: `${data.services_efficiency[0]?.revenue_per_minute ? (s.revenue_per_minute / data.services_efficiency[0].revenue_per_minute) * 100 : 0}%` 
                  }} 
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* Плотность записи по часам (Занимает 2 колонки из 3) */}
    <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col relative overflow-hidden transition-all duration-300">
      {isRestrictedPlan && <LockOverlay />}

      <div className={isRestrictedPlan ? "blur-md select-none pointer-events-none" : ""}>
        {!isRestrictedPlan && <BlockTooltip text="Визуальная карта распределения клиентского трафика по дням и часам." />}
        
        <div className="flex items-center gap-2 mb-5">
          <div className="p-2 bg-slate-50 text-slate-600 rounded-lg border border-slate-200/50">
            <BarChart3 size={14} />
          </div>
          <h3 className="font-bold text-slate-800 text-xs tracking-tight">Плотность записи по часам</h3>
        </div>
        
        <div className="overflow-x-auto pb-2 custom-scrollbar">
          <div 
            className="grid gap-1 min-w-[560px]" 
            style={{ gridTemplateColumns: "minmax(30px, auto) repeat(13, 1fr)" }}
          >
            <div className="h-4"></div>
            {workHours.map(h => (
              <div key={h} className="text-[9px] text-slate-400 font-semibold text-center">
                {h}ч
              </div>
            ))}

            {weekdays.map((day, dIdx) => {
              const targetBackendId = backendDayIds[dIdx];
              return (
                <React.Fragment key={day}>
                  <div className="text-[10px] font-bold text-slate-400 self-center">
                    {day}
                  </div>
                  {workHours.map(hour => {
                    const count = data?.heatmap?.find((h: any) => h.weekday === targetBackendId && h.hour === hour)?.count ?? 0;
                    return (
                      <div 
                        key={hour}
                        className={`h-7 rounded-[4px] transition-all border shadow-sm relative ${
                          count > 0 
                            ? 'bg-blue-600 border-blue-700 hover:scale-105 hover:z-10' 
                            : 'bg-slate-50 border-slate-100'
                        }`}
                        style={{ opacity: count > 0 ? Math.min(count * 0.25 + 0.3, 1) : 1 }}
                        title={`${day}, ${hour}:00 — Записей: ${count}`}
                      />
                    );
                  })}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        <div className="mt-4 pt-3 flex items-center justify-end gap-2 border-t border-slate-100 text-[10px] font-medium text-slate-400">
          <span>Минимум</span>
          <div className="flex gap-0.5">
            <div className="w-2.5 h-2.5 rounded-[2px] bg-slate-50 border border-slate-100"></div>
            <div className="w-2.5 h-2.5 rounded-[2px] bg-blue-600 opacity-40"></div>
            <div className="w-2.5 h-2.5 rounded-[2px] bg-blue-600 opacity-70"></div>
            <div className="w-2.5 h-2.5 rounded-[2px] bg-blue-600 opacity-100"></div>
          </div>
          <span>Пик</span>
        </div>
      </div>
    </div>

  </div>
)}

      {/* ПОПУЛЯРНОСТЬ И ЛИДЕРЫ */}
      <div className={`grid grid-cols-1 gap-5 transition-all duration-300 ${
        isRestrictedPlan && hideRestricted ? 'lg:grid-cols-1' : 'lg:grid-cols-2'
      }`}>
        
        {/* Популярные услуги */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm relative">
          <BlockTooltip text="Топ-5 наиболее востребованных процедур по количеству бронирований." />
          
          <div className="flex items-center gap-2 mb-5">
            <div className="p-2 bg-slate-50 text-slate-600 rounded-lg border border-slate-200/50">
              <Star size={14} className="fill-slate-400 text-slate-400" />
            </div>
            <h3 className="font-bold text-slate-800 text-xs tracking-tight">Популярные услуги</h3>
          </div>
          
          <div className="space-y-2">
            {data?.top_services?.map((s, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-slate-50/50 rounded-xl border border-slate-200/40 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs font-bold text-slate-400">0{i+1}</span>
                  <div className="truncate">
                    <div className="text-xs font-semibold text-slate-800 truncate">{s.name}</div>
                    <div className="text-[10px] text-slate-400 font-medium mt-0.5">{s.count} визитов</div>
                  </div>
                </div>
                <div className="px-2 py-1 bg-white rounded-md border border-slate-200/60 font-bold text-slate-700 text-[10px] shadow-sm">
                  {s.share}%
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Лидеры продаж */}
        {!(isRestrictedPlan && hideRestricted) && (
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm flex flex-col relative overflow-hidden transition-all duration-300">
            {isRestrictedPlan && <LockOverlay />}

            <div className={isRestrictedPlan ? "blur-md select-none pointer-events-none" : ""}>
              {!isRestrictedPlan && <BlockTooltip text="Рейтинг сотрудников организации по сумме принесенной выручки." />}
              
              <div className="p-6 border-b border-slate-100 flex items-center gap-2">
                <div className="p-2 bg-slate-50 text-slate-600 rounded-lg border border-slate-200/50">
                  <Award size={14} />
                </div>
                <h3 className="font-bold text-slate-800 text-xs tracking-tight">Лидеры продаж</h3>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <tbody className="divide-y divide-slate-100">
                    {data?.masters_performance?.map((m, i) => (
                      <tr key={i} className="hover:bg-slate-50/40 transition-colors">
                        <td className="px-6 py-3.5">
                          <div className="text-xs font-semibold text-slate-800">{m.name}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{m.count} выполненных сессий</div>
                        </td>
                        <td className="px-6 py-3.5 text-right">
                          <div className="text-xs font-bold text-slate-900">{(m.revenue ?? 0).toLocaleString()} ₽</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}