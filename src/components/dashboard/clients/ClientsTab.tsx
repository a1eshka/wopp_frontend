"use client";

import { useState, useMemo } from "react";
import { Search, SlidersHorizontal, Sparkles, CalendarDays, Wallet, Clock, ArrowRight, ChevronDown, Users } from "lucide-react";
import { ClientDetailsModal } from "./ClientDetailsModal";
import { useClients } from "@/app/api/hooks";

type SortOption = "visit-latest" | "visits-desc" | "name";

// Хелпер для генерации мягкого пастельного фона на основе имени
const getAvatarColor = (name: string) => {
  const colors = [
    "bg-indigo-50 text-indigo-600 border-indigo-100",
    "bg-emerald-50 text-emerald-600 border-emerald-100",
    "bg-amber-50 text-amber-600 border-amber-100",
    "bg-rose-50 text-rose-600 border-rose-100",
    "bg-sky-50 text-sky-600 border-sky-100",
  ];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
};

// Хелпер для получения инициалов
const getInitials = (name: string) => {
  return name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
};

// Хелпер для форматирования даты ISO в человеческий вид
const formatLastVisit = (dateString: string | null | undefined) => {
  if (!dateString) return null;

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const visitDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    const timeFormatter = new Intl.DateTimeFormat("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const timeStr = timeFormatter.format(date);

    if (visitDay.getTime() === today.getTime()) {
      return `Сегодня в ${timeStr}`;
    } else if (visitDay.getTime() === yesterday.getTime()) {
      return `Вчера в ${timeStr}`;
    } else {
      const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
        day: "numeric",
        month: "long",
      });
      return `${dateFormatter.format(date)}, ${timeStr}`;
    }
  } catch (e) {
    return dateString;
  }
};
interface ClientsTabProps {
  subscription?: {
    plan_id: number;
    [key: string]: any;
  } | null;
  onUpgrade?: () => void;
}
export default function ClientsTab({ subscription, onUpgrade }: ClientsTabProps) {
  const { data: clients = [], isLoading } = useClients();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("visit-latest");
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any | null>(null);

  // Мемоизированная фильтрация и сортировка
  const processedClients = useMemo(() => {
    const filtered = clients.filter((c: any) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm)
    );

    return [...filtered].sort((a: any, b: any) => {
      if (sortBy === "name") {
        return a.name.localeCompare(b.name, "ru");
      }
      if (sortBy === "visits-desc") {
        return (b.records_count || 0) - (a.records_count || 0);
      }
      if (sortBy === "visit-latest") {
        const dateA = a.last_visit ? new Date(a.last_visit).getTime() : 0;
        const dateB = b.last_visit ? new Date(b.last_visit).getTime() : 0;
        return dateB - dateA;
      }
      return 0;
    });
  }, [clients, searchTerm, sortBy]);

  const sortLabels: Record<SortOption, string> = {
    "visit-latest": "Последний визит",
    "visits-desc": "Кол-во визитов",
    "name": "Имя (А-Я)",
  };

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse w-full">
        <div className="h-12 bg-slate-100 rounded-2xl w-full" />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="p-5 bg-white rounded-2xl border border-slate-100 flex justify-between items-center w-full">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-full bg-slate-100" />
              <div className="space-y-2">
                <div className="h-4 bg-slate-100 rounded w-32" />
                <div className="h-3 bg-slate-100 rounded w-24" />
              </div>
            </div>
            <div className="h-4 bg-slate-100 rounded w-32" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full">

      {/* HEADER & SEARCH BAR */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between w-full relative">
        <div className="relative flex-1 flex items-center">
          <Search className="absolute left-4 text-slate-400 pointer-events-none" size={18} />
          <input
            type="text"
            placeholder="Поиск по имени или телефону..."
            className="w-full pl-12 pr-28 py-3.5 bg-slate-50/50 hover:bg-slate-50 focus:bg-white rounded-2xl border border-slate-200/60 focus:border-slate-300 focus:outline-none focus:ring-4 focus:ring-slate-100 transition-all duration-300 text-sm placeholder:text-slate-400 font-medium text-slate-800"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          {/* ИНТЕГРИРОВАННЫЙ СЧЕТЧИК КЛИЕНТОВ */}
          <div className="absolute right-3 flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200/60 rounded-xl shadow-sm text-[10px] font-bold text-slate-500 pointer-events-none select-none">
            <Users size={12} className="text-slate-400" />
            <span className="tabular-nums">
              {searchTerm ? `${processedClients.length} из ${clients.length}` : clients.length}
            </span>
          </div>
        </div>

        {/* Кнопка "Фильтры" */}
        <div className="relative shrink-0">
          <button
            onClick={() => setIsSortMenuOpen(!isSortMenuOpen)}
            className="flex items-center justify-center gap-2 px-6 py-3.5 bg-white border border-slate-200/80 rounded-2xl text-xs font-bold uppercase tracking-wider text-slate-600 hover:text-slate-900 hover:border-slate-300 transition-all active:scale-95 w-full sm:w-auto"
          >
            <SlidersHorizontal size={14} className={sortBy !== "visit-latest" ? "text-gray-500" : "text-slate-600"} />
            <span>Фильтры: <span className="text-gray-900 normal-case font-semibold ml-0.5">{sortLabels[sortBy]}</span></span>
            <ChevronDown size={14} className={`text-slate-400 ml-1 transition-transform duration-200 ${isSortMenuOpen ? "rotate-180" : ""}`} />
          </button>

          {isSortMenuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setIsSortMenuOpen(false)} />

              <div className="absolute right-0 mt-2 w-full sm:w-64 bg-white border border-slate-100 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.06)] py-2 z-20 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-4 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Сортировать клиентов
                </div>
                <hr className="my-1 border-slate-100" />
                <button
                  onClick={() => { setSortBy("visit-latest"); setIsSortMenuOpen(false); }}
                  className={`w-full text-left px-4 py-3 text-xs font-medium block transition-colors ${sortBy === "visit-latest" ? "bg-blue-50/50 text-blue-600 font-bold" : "text-slate-600 hover:bg-slate-50/60 hover:text-slate-900"}`}
                >
                  По последнему визиту
                </button>
                <button
                  onClick={() => { setSortBy("visits-desc"); setIsSortMenuOpen(false); }}
                  className={`w-full text-left px-4 py-3 text-xs font-medium block transition-colors ${sortBy === "visits-desc" ? "bg-blue-50/50 text-blue-600 font-bold" : "text-slate-600 hover:bg-slate-50/60 hover:text-slate-900"}`}
                >
                  По количеству визитов
                </button>
                <button
                  onClick={() => { setSortBy("name"); setIsSortMenuOpen(false); }}
                  className={`w-full text-left px-4 py-3 text-xs font-medium block transition-colors ${sortBy === "name" ? "bg-blue-50/50 text-blue-600 font-bold" : "text-slate-600 hover:bg-slate-50/60 hover:text-slate-900"}`}
                >
                  По имени (А-Я)
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* CLIENTS LIST */}
      <div className="space-y-3 w-full">
        {processedClients.length === 0 ? (
          <div className="text-center py-20 bg-slate-50/40 rounded-3xl border border-dashed border-slate-200/60 w-full">
            <p className="text-sm text-slate-400 font-medium">Никого не найдено</p>
          </div>
        ) : (
          processedClients.map((client: any) => {
            const avatarStyle = getAvatarColor(client.name);
            const recordsCount = client.records_count || 0;
            const isNew = recordsCount === 1;
            const isRegular = recordsCount >= 11;
            const readableLastVisit = formatLastVisit(client.last_visit);

            return (
              <div
                key={client.id}
                onClick={() => setSelectedClient(client)}
                className="group relative flex flex-col lg:flex-row lg:items-center justify-between p-5 bg-white rounded-2xl border border-slate-100 hover:border-blue-100 hover:shadow-[0_10px_30px_rgba(37,99,235,0.03)] cursor-pointer transition-all duration-300 gap-4 w-full"
              >
                {/* Левая сторона */}
                <div className="flex items-center gap-4">
                  <div className={`w-11 h-11 rounded-full border flex items-center justify-center font-bold text-xs tracking-wider shrink-0 transition-transform group-hover:scale-105 ${avatarStyle}`}>
                    {getInitials(client.name)}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-slate-800 tracking-tight text-base group-hover:text-blue-600 transition-colors">
                        {client.name}
                      </h3>

                      {isNew && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-emerald-50 text-[10px] font-medium text-emerald-700 border border-emerald-100">
                          Новый
                        </span>
                      )}

                      {isRegular && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-[10px] font-medium text-blue-700 border border-blue-100">
                          <Sparkles size={10} className="fill-blue-400 text-blue-500" /> Постоянный
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-mono text-slate-400 tracking-wide">{client.phone}</p>
                  </div>
                </div>

                {/* Правая сторона */}
                <div className="flex flex-wrap items-center gap-6 md:gap-10 self-end lg:self-auto border-t lg:border-t-0 border-slate-50 pt-3 lg:pt-0 w-full lg:w-auto justify-between lg:justify-end">

                  {/* Блок "Последний визит" */}
                  <div className="space-y-1 text-left lg:text-right min-w-[150px]">
                    <span className="text-[10px] font-medium text-slate-400 block">Последний визит</span>

                    {isNew ? (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gradient-to-r from-violet-50 to-indigo-50 border border-indigo-100 text-olive-700 font-medium text-xs shadow-sm">
                        <Clock size={12} className="text-olive-500" />
                        <span>{readableLastVisit ? readableLastVisit : "Первый визит"}</span>
                      </div>
                    ) : readableLastVisit ? (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200/60 text-slate-700 font-medium text-xs transition-colors group-hover:bg-slate-100/80">
                        <Clock size={12} className="text-slate-400" />
                        <span className="font-medium text-slate-800">{readableLastVisit}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-slate-300 font-medium block lg:pr-2">—</span>
                    )}
                  </div>

                  {/* Количество визитов */}
                  <div className="space-y-0.5 text-left lg:text-right">
                    <span className="text-[10px] font-medium text-slate-400 block">Визиты</span>
                    <div className="flex items-center lg:justify-end gap-1.5 text-slate-600 font-semibold text-sm">
                      <CalendarDays size={14} className="text-slate-400" />
                      <span className={isRegular ? "text-gray-800 font-bold" : "text-slate-700"}>
                        {recordsCount}
                      </span>
                    </div>
                  </div>

                  {/* LTV Доход */}
                  {client.ltv !== undefined && (
                    <div className="space-y-0.5 text-right min-w-[90px]">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block">Доход (LTV)</span>
                      <div className="flex items-center justify-end gap-1.5 text-slate-800 font-bold text-sm">
                        <Wallet size={14} className="text-emerald-500" />
                        <span className="font-mono text-slate-900">{client.ltv.toLocaleString()} ₽</span>
                      </div>
                    </div>
                  )}

                  {/* Стрелочка */}
                  <div className="hidden lg:flex items-center justify-center w-8 h-8 rounded-full bg-slate-50 text-slate-400 opacity-0 group-hover:opacity-100 group-hover:text-blue-600 group-hover:bg-blue-50 transition-all duration-300">
                    <ArrowRight size={16} />
                  </div>

                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL */}
      {selectedClient && (
        <ClientDetailsModal
          client={selectedClient}
          subscription={subscription}
          onUpgrade={onUpgrade}
          onClose={() => setSelectedClient(null)}
        />
      )}
    </div>
  );
}