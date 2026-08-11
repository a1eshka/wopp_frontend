"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Inbox, Layers, CheckCircle2, Clock, Star } from "lucide-react";
import RecentBookingsTable from "../RecentBookingsTable";

interface MainTableProps {
  bookings: any[];
  onViewAll?: () => void;
  onStatusChange: (bookingId: string, status: string) => void;
}

// 🕒 Хелпер: проверяет, осталось ли до визита от -15 до +30 минут
const checkIsUrgent = (bookingTime: string) => {
  if (!bookingTime || bookingTime === "--:--") return false;

  try {
    const [hours, minutes] = bookingTime.split(':').map(Number);
    const now = new Date();

    const target = new Date();
    target.setHours(hours, minutes, 0, 0);

    const diffInMs = target.getTime() - now.getTime();
    const diffInMinutes = diffInMs / (1000 * 60);

    // Горит, если до визита меньше 30 минут или он начался не более 15 минут назад
    return diffInMinutes >= -15 && diffInMinutes <= 30;
  } catch (e) {
    return false;
  }
};

export default function MainTable({ bookings, onViewAll, onStatusChange }: MainTableProps) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Маппим данные, обогащая их новыми фичами для тайм-менеджмента и лояльности
  const safeBookings = bookings?.map((b: any) => {
    const timeStr = b.time || "--:--";
    return {
      id: b.id,
      client: b.client_name || b.client || "Без имени",
      client_phone: b.client_phone || b.phone || b.client_phone_number || "",
      service: b.service || b.service_name || "Услуга",
      master: b.master || b.master_name || "Мастер",
      time: timeStr,
      status: b.status || "new",

      // 🌟 Метка лояльности (если с бэка нет поля, по дефолту считаем false)
      isFirstVisit: b.is_first_visit ?? false,

      // 🌟 Маркер "Горящего визита" (горит только если запись еще в статусе "new")
      isUrgent: checkIsUrgent(timeStr) && (b.status === "new" || b.status === "pending")
    };
  }) || [];

  // Фильтрация списка по табам
  const filteredBookings = safeBookings.filter((b) => {
    if (statusFilter === "all") return true;
    return b.status === statusFilter;
  });

  const handleViewAllClick = () => {
    if (onViewAll) onViewAll();
    router.push("?tab=bookings");
  };

  const filterTabs = [
    { id: "all", label: "Все", icon: <Layers size={13} /> },
    { id: "pending", label: "Новые", icon: <Star size={13} className="text-blue-500 fill-blue-500/10" /> },
    { id: "confirmed", label: "В работе", icon: <Clock size={13} className="text-amber-500" /> },
    { id: "completed", label: "Завершены", icon: <CheckCircle2 size={13} className="text-emerald-500" /> },
  ];

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] overflow-hidden transition-all duration-300">

      {/* ШАПКА ТАБЛИЦЫ С ЖИВЫМ СЧЕТЧИКОМ */}
      <div className="p-6 pb-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100/60">
        <div>
          <div className="flex items-center gap-2.5">
            <h3 className="font-semibold text-base text-slate-900 tracking-tight">Последние записи</h3>
            {safeBookings.length > 0 && (
              <span className="bg-slate-50 text-slate-500 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-slate-100/80 tabular-nums">
                {safeBookings.length}
              </span>
            )}
          </div>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">
            Оперативное управление
          </p>
        </div>

        <button
          onClick={handleViewAllClick}
          className="px-4 py-2 text-blue-600 font-semibold text-xs bg-blue-50/40 hover:bg-blue-50 rounded-xl transition-all duration-200 tracking-wide cursor-pointer active:scale-98 border border-blue-100/30"
        >
          Все записи →
        </button>
      </div>

      {/* ФИЛЬТРЫ СТАТУСОВ */}
      {safeBookings.length > 0 && (
        <div className="px-6 py-3.5 bg-slate-50/30 border-b border-slate-100/40 flex flex-wrap gap-3 items-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1">Фильтр списка:</span>
          <div className="flex bg-slate-100/80 p-1 rounded-xl gap-0.5 border border-slate-200/20">
            {filterTabs.map((tab) => {
              const isActive = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer ${isActive
                      ? "bg-white text-slate-900 shadow-[0_2px_8px_-1px_rgba(148,163,184,0.12)] font-semibold"
                      : "text-slate-400 hover:text-slate-600"
                    }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ОСНОВНОЙ КОНТЕНТ */}
      {filteredBookings.length > 0 ? (
        <div className="overflow-x-auto">
          <RecentBookingsTable
            bookings={filteredBookings}
            onStatusChange={onStatusChange}
          />
        </div>
      ) : (
        /* УЛУЧШЕННЫЙ EMPTY STATE */
        <div className="p-16 flex flex-col items-center justify-center text-center">
          <div className="p-3.5 bg-slate-50 rounded-2xl text-slate-400 mb-4 border border-slate-100">
            <Inbox size={22} strokeWidth={2} />
          </div>
          <h4 className="text-slate-900 font-semibold text-sm mb-1">
            {statusFilter === "all" ? "Записей пока нет" : "Нет записей с таким статусом"}
          </h4>
          <p className="text-slate-400 text-xs max-w-xs font-medium leading-relaxed mb-4">
            {statusFilter === "all"
              ? "Сюда будут падать новые бронирования клиентов в реальном времени."
              : "Попробуйте сбросить фильтр оперативного контроля или загляните позже."}
          </p>
          {statusFilter !== "all" && (
            <button
              onClick={() => setStatusFilter("all")}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer active:scale-98"
            >
              Сбросить фильтр
            </button>
          )}
        </div>
      )}
    </div>
  );
}