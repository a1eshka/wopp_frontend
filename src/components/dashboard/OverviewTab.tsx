"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Calendar as CalendarIcon, Clock, CreditCard, TrendingUp,
  HelpCircle, ArrowUpRight, ArrowDownRight
} from "lucide-react";
import { useStats } from "@/app/api/hooks";
import MainTable from "./main/MainTable";

interface OverviewTabProps {
  period: string;
  setPeriod: (period: 'today' | 'week' | 'month') => void;
  onViewAll?: () => void;
  onStatusChange?: any;
  isInitLoading?: boolean;
  initialStatsToday?: any;
  subscription?: {
    plan_id: number;
    [key: string]: any;
  } | null;
}

export default function OverviewTab({
  period,
  setPeriod,
  onViewAll,
  onStatusChange,
  isInitLoading,
  initialStatsToday,
  subscription
}: OverviewTabProps) {

  const { data: stats, isPending, isFetching } = useStats(period, {
    enabled: !isInitLoading,
    placeholderData: period === 'today' ? initialStatsToday : undefined
  });

  const currentStats = stats || (period === 'today' ? initialStatsToday : null);

  const periodCount = currentStats?.today_count ?? 0;
  const cleanRevenue = currentStats?.today_revenue ?? 0;
  const bookingsArray = currentStats?.recent_bookings ?? [];

  // ПРОВЕРКА ТАРИФА:
  // Если plan_id === 1 (Базовый), скрываем расширенный блок аналитики
  const isBasicPlan = subscription?.plan_id === 1;

  return (
    <div className={`animate-in fade-in duration-500 transition-opacity ${isFetching ? 'opacity-60 pointer-events-none' : ''}`}>

      {/* ШАПКА СТАТИСТИКИ */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-5 border-b border-slate-200/60">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Аналитика</h2>
          <p className="text-slate-500 text-xs font-medium mt-0.5">Обзор ключевых показателей вашей организации</p>
        </div>

        {/* ПЕРЕКЛЮЧАТЕЛЬ ПЕРИОДОВ */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/40 w-full sm:w-auto">
          {(['today', 'week', 'month'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${period === p
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
                }`}
            >
              {p === 'today' ? 'Сегодня' : p === 'week' ? 'Неделя' : 'Месяц'}
            </button>
          ))}
        </div>
      </div>

      {/* СЕТКА КАРТОЧЕК С ТРЕНДАМИ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title={period === 'today' ? "Записи (сегодня)" : "Записи за период"}
          value={periodCount}
          icon={<CalendarIcon size={18} />}
          color="text-blue-600"
          bg="bg-blue-50"
          tooltipText="Общее количество бронирований клиентов в системе за выбранный промежуток времени."
          trend={stats?.count_trend ?? { value: 8.2, isPositive: true }}
        />

        <StatCard
          title="Выручка"
          value={cleanRevenue}
          suffix="₽"
          icon={<TrendingUp size={18} />}
          color="text-emerald-600"
          bg="bg-emerald-50"
          tooltipText="Сумма всех фактически полученных и закрытых оплат за услуги за этот период."
          trend={stats?.revenue_trend ?? { value: 12.4, isPositive: true }}
        />

        <StatCard
          title="Средний чек"
          value={stats?.avg_check ?? 0}
          suffix="₽"
          icon={<CreditCard size={18} />}
          color="text-orange-600"
          bg="bg-orange-50"
          tooltipText="Средняя стоимость одной оплаченной записи. Рассчитывается как Выручка / Количество визитов."
          trend={stats?.avg_check_trend ?? { value: 2.1, isPositive: false }}
        />

        <StatCard
          title="Загрузка"
          value={stats?.occupancy_rate ?? 0}
          suffix="%"
          icon={<Clock size={18} />}
          color="text-purple-600"
          bg="bg-purple-50"
          tooltipText="Процент занятого клиентами времени от общей доступной длительности рабочих смен мастеров."
          trend={stats?.occupancy_trend ?? { value: 4.5, isPositive: true }}
        />
      </div>

      {/* БЛОК ЛОЯЛЬНОСТИ И ПОТЕРЬ — Показываем ТОЛЬКО если тариф НЕ базовый (plan_id !== 1) */}
      {!isBasicPlan && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Блок возвращаемости */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.01)] flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-slate-900 text-sm">Лояльность клиентов</h3>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${(stats?.retention_rate ?? 0) > 50
                    ? 'text-emerald-700 bg-emerald-50 border-emerald-200/50'
                    : 'text-orange-700 bg-orange-50 border-orange-200/50'
                  }`}>
                  {(stats?.retention_rate ?? 0) > 50 ? 'Отлично' : 'Средне'}
                </span>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-500">Возвращаемость (RR)</span>
                  <span className="font-bold text-slate-900">{stats?.retention_rate ?? 0}%</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full transition-all duration-1000"
                    style={{ width: `${stats?.retention_rate ?? 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 font-medium mt-4 pt-3 border-t border-slate-50">
              * {stats?.sleeping_clients_count ?? 0} клиентов не были у вас более месяца.
            </p>
          </div>

          {/* Блок потерь */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.01)] flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-slate-900 text-sm">Потери за период</h3>
                {(stats?.lost_revenue ?? 0) > 0 ? (
                  <span className="text-red-700 text-[11px] font-bold bg-red-50 border border-red-200/50 px-2 py-0.5 rounded-md">
                    Внимание
                  </span>
                ) : (
                  <span className="text-emerald-700 text-[11px] font-bold bg-emerald-50 border border-emerald-200/50 px-2 py-0.5 rounded-md">
                    Стабильно
                  </span>
                )}
              </div>

              <div className="flex items-baseline gap-1.5 mt-2">
                <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  {(stats?.lost_revenue ?? 0).toLocaleString('ru-RU')} ₽
                </span>
                <span className="text-slate-400 text-xs font-medium">упущено из-за отмен</span>
              </div>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed mt-4 pt-3 border-t border-slate-50">
              {(stats?.lost_revenue ?? 0) > 0 ? (
                <>Это {stats?.lost_appointments_count ?? 0} отмененных визитов. Стоит включить автоподтверждение через ТГ-бота.</>
              ) : (
                <>Упущенная выгода отсутствует. Отличная работа с клиентами!</>
              )}
            </p>
          </div>
        </div>
      )}

      {/* ТАБЛИЦА ПОСЛЕДНИХ ЗАПИСЕЙ */}
      <MainTable
        bookings={bookingsArray}
        onViewAll={onViewAll}
        onStatusChange={onStatusChange}
      />
    </div>
  );
}

export function StatCard({ title, value, icon, color, bg, suffix = "", tooltipText, trend }: any) {
  const numericValue = typeof value === 'string'
    ? parseFloat(value.replace(/[^0-9.]/g, "").replace(',', '.'))
    : Number(value || 0);

  const [displayValue, setDisplayValue] = useState(0);
  const prevValueRef = useRef(0);

  useEffect(() => {
    const start = prevValueRef.current;
    const end = numericValue;
    const duration = 1000;
    let startTimestamp: any = null;

    const step = (timestamp: any) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const current = progress * (end - start) + start;
      setDisplayValue(current);

      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };

    window.requestAnimationFrame(step);
    prevValueRef.current = end;
  }, [numericValue]);

  const formattedDisplay = `${numericValue % 1 !== 0
      ? displayValue.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : Math.floor(displayValue).toLocaleString('ru-RU', { maximumFractionDigits: 0 })
    }${suffix ? ' ' + suffix : ''}`;

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-[0_4px_20px_rgba(0,0,0,0.01)] flex flex-col justify-between gap-4 transition-all duration-300 hover:border-slate-300 relative group">

      {/* ИНТЕГРИРОВАННЫЙ ТУЛТИП */}
      {tooltipText && (
        <div className="absolute top-4 right-4 z-20 flex items-center justify-center">
          <div className="relative flex items-center justify-center">
            <button
              type="button"
              className="peer p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors cursor-help relative z-30"
            >
              <HelpCircle size={13} />
            </button>
            <div className="absolute bottom-full right-0 mb-2 w-48 translate-x-[5%] scale-95 rounded-lg bg-gray-900 p-2.5 text-[11px] font-medium leading-relaxed text-slate-300 opacity-0 shadow-xl border border-slate-800 transition-all duration-150 pointer-events-none z-[100] peer-hover:scale-100 peer-hover:opacity-100">
              {tooltipText}
            </div>
          </div>
        </div>
      )}

      {/* Иконка метрики */}
      <div className="flex justify-between items-start">
        <div className={`p-2.5 rounded-lg ${bg} ${color}`}>
          {React.cloneElement(icon, { size: 18 })}
        </div>
      </div>

      {/* Данные и тренд */}
      <div className="space-y-1">
        <p className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">{title}</p>
        <div className="flex items-baseline flex-wrap gap-2">
          <h2 className="text-2xl font-extrabold tracking-tight text-gray-800 tabular-nums">
            {formattedDisplay}
          </h2>

          {/* Отображение процента динамики с прошлым периодом */}
          {trend && trend.value !== undefined && (
            <div className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[11px] font-bold border ${trend.isPositive
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200/40'
                : 'bg-red-50 text-red-700 border-red-200/40'
              }`}>
              {trend.isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
              <span>{trend.isPositive ? '+' : ''}{trend.value}%</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}