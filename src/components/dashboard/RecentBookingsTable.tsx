"use client";

import { Check, X, Phone, User, Clock, Scissors } from "lucide-react";

interface RecentBookingsTableProps {
  bookings: any[];
  onStatusChange: (bookingId: string, action: string) => void;
}

export default function RecentBookingsTable({ bookings, onStatusChange }: RecentBookingsTableProps) {
  
  // Хелпер для отображения красивых бейджей на основе статуса в БД
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-100">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            В работе
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Завершена
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-100">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Отменена
          </span>
        );
      case "pending":
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-100">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            Новая
          </span>
        );
    }
  };

  return (
    <div className="w-full">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/50">
            <th className="p-4 pl-6 text-[10px] font-bold uppercase tracking-wider text-slate-400">Время</th>
            <th className="p-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">Клиент</th>
            <th className="p-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">Услуга</th>
            <th className="p-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">Мастер</th>
            <th className="p-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">Статус</th>
            <th className="p-4 pr-6 text-right text-[10px] font-bold uppercase tracking-wider text-slate-400">Действия</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {bookings.map((booking) => {
            // Архивируем только завершенные и явно отмененные записи
            const isArchived = booking.status === "completed" || booking.status === "cancelled";

            return (
              <tr 
                key={booking.id} 
                className={`group transition-colors duration-150 hover:bg-slate-50/40 ${
                  booking.isUrgent && !isArchived ? "bg-red-50/10 hover:bg-red-50/20" : ""
                }`}
              >
                {/* ВРЕМЯ */}
                <td className="p-4 pl-6">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-xl border ${
                      booking.isUrgent && !isArchived
                        ? "bg-red-50 text-red-600 border-red-100 animate-pulse" 
                        : "bg-slate-50 text-slate-600 border-slate-100"
                    }`}>
                      <Clock size={14} />
                    </div>
                    <div>
                      <span className={`font-semibold text-sm tracking-tight ${
                        booking.isUrgent && !isArchived ? "text-red-600 font-bold" : "text-slate-800"
                      }`}>
                        {booking.time}
                      </span>
                    </div>
                  </div>
                </td>

                {/* КЛИЕНТ */}
                <td className="p-4">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-slate-800 text-sm">{booking.client}</span>
                      {booking.isFirstVisit && !isArchived && (
                        <span className="bg-emerald-100/70 text-emerald-700 text-[9px] font-bold px-1.5 py-0.5 rounded-md border border-emerald-200 uppercase tracking-wider">
                          Первый раз
                        </span>
                      )}
                    </div>
                    {booking.client_phone && (
                      <a 
                        href={`tel:${booking.client_phone}`}
                        className="text-xs text-slate-400 hover:text-blue-500 transition-colors flex items-center gap-1 mt-0.5 font-medium"
                      >
                        <Phone size={10} className="stroke-[2.5]" />
                        {booking.client_phone}
                      </a>
                    )}
                  </div>
                </td>

                {/* УСЛУГА */}
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-slate-50 rounded-lg text-slate-400 border border-slate-100">
                      <Scissors size={12} />
                    </div>
                    <span className="text-slate-600 font-medium text-xs">
                      {booking.service}
                    </span>
                  </div>
                </td>

                {/* МАСТЕР */}
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500">
                      <User size={10} className="stroke-[2.5]" />
                    </div>
                    <span className="text-slate-600 font-medium text-xs">
                      {booking.master}
                    </span>
                  </div>
                </td>

                {/* СТАТУС */}
                <td className="p-4">
                  {getStatusBadge(booking.status)}
                </td>

                {/* ДЕЙСТВИЯ */}
                {/* ДЕЙСТВИЯ */}
<td className="p-4 pr-6 text-right">
  <div className="flex items-center justify-end gap-2">
    {!isArchived && (
      <>
        {/* КНОПКА ПОДТВЕРЖДЕНИЯ / ЗАКРЫТИЯ */}
        <button
          type="button"
          onClick={() => onStatusChange(booking.id, booking.status)} // Возвращаем передачу текущего статуса!
          className={`
            inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all duration-200 active:scale-95 cursor-pointer shadow-sm
            ${booking.status === 'confirmed'
              ? 'bg-slate-900 text-white hover:bg-slate-800 shadow-slate-900/5 border border-slate-800'
              : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-600/5'
            }
          `}
        >
          {booking.status === 'confirmed' ? (
            <>
              <Check size={11} strokeWidth={3} />
              Закрыть запись
            </>
          ) : (
            <>
              <Check size={11} strokeWidth={3} />
              Подтвердить
            </>
          )}
        </button>

        {/* КНОПКА ОТМЕНЫ */}
        <button
          type="button"
          onClick={() => onStatusChange(booking.id, "cancel")}
          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 rounded-xl transition-all duration-200 active:scale-95 cursor-pointer"
          title="Отменить запись"
        >
          <X size={14} strokeWidth={2.5} />
        </button>
      </>
    )}
  </div>
</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}