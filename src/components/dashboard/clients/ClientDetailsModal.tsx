"use client";

import { useEffect, useState } from "react";
import { X, Phone, CalendarDays, Wallet, Clock, Lock, User, Scissors, MessageSquare, Percent, Check, Sparkles } from "lucide-react";
import { useClientRecords, useUpdateClientDiscount } from "@/app/api/hooks"; // Подключаем твой новый хук
import { useRouter } from "next/navigation";

interface ClientDetailsModalProps {
  client: any;
  onClose: () => void;
  subscription?: {
    plan_id: number;
    [key: string]: any;
  } | null;
  onUpgrade?: () => void;
}

export function ClientDetailsModal({ client, organizationId, onClose,
  subscription,
  onUpgrade
}: ClientDetailsModalProps) {
  const { data: records = [], isLoading, isError } = useClientRecords(client.id);
  const router = useRouter();
  // Подключаем мутацию обновления скидки (organizationId передай пропсом из родителя)
  const updateDiscountMutation = useUpdateClientDiscount();

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "https://api.wopp.ru";

  // Стейты для редактирования скидки
  const [isEditingDiscount, setIsEditingDiscount] = useState(false);
  const [discountValue, setDiscountValue] = useState<number>(client.personal_discount || 0);

  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  const statusConfig: Record<string, { label: string; classes: string }> = {
    'pending': { label: 'Ожидает', classes: 'bg-amber-50 text-amber-700 border-amber-100' },
    'confirmed': { label: 'Подтверждена', classes: 'bg-blue-50 text-blue-700 border-blue-100' },
    'cancelled': { label: 'Отменена', classes: 'bg-rose-50 text-rose-700 border-rose-100' },
    'completed': { label: 'Завершена', classes: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
  };

  // Метод сохранения скидки
  const handleSaveDiscount = () => {
    updateDiscountMutation.mutate(
      { phone: client.phone, discount: discountValue },
      {
        onSuccess: (data) => {
          client.personal_discount = data.personal_discount; // Локально обновляем данные до рефетча
          setIsEditingDiscount(false);
        },
        onError: () => {
          alert("Не удалось сохранить изменения");
        }
      }
    );
  };
  const handleUpgradeClick = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      router.push("?tab=tarrifs");
    }
  };
  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 cursor-pointer animate-in fade-in duration-200"
    >
      <div className="bg-white rounded-3xl w-full max-w-xl shadow-[0_20px_50px_rgba(0,0,0,0.12)] border border-slate-100 flex flex-col max-h-[85vh] cursor-default animate-in zoom-in-95 duration-200">

        {/* ШАПКА МОДАЛКИ */}
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 rounded-t-3xl relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all active:scale-95"
          >
            <X size={18} />
          </button>

          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg tracking-wider shadow-md shadow-blue-500/10 shrink-0">
              {getInitials(client.name)}
            </div>

            <div className="space-y-1.5 pr-8 flex-1">
              <h2 className="text-xl font-bold text-slate-800 tracking-tight leading-snug">{client.name}</h2>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
                <a
                  href={`tel:${client.phone}`}
                  className="inline-flex items-center gap-1.5 text-xs font-mono font-medium text-slate-500 hover:text-blue-600 transition-colors"
                >
                  <Phone size={12} className="text-slate-400" />
                  {client.phone}
                </a>

                {/* 🌟 ИНТЕРАКТИВНЫЙ БЛОК УПРАВЛЕНИЯ СКИДКОЙ */}
                {!isEditingDiscount ? (
                  <button
                    onClick={() => setIsEditingDiscount(true)}
                    className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-lg border transition-all ${discountValue > 0
                        ? 'bg-purple-50 text-purple-700 border-purple-100 hover:bg-purple-100'
                        : 'bg-slate-100 text-slate-500 border-transparent hover:bg-slate-200'
                      }`}
                  >
                    <Percent size={10} />
                    <span>Скидка: {discountValue}%</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5 animate-in fade-in duration-150">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={discountValue}
                      onChange={(e) => setDiscountValue(Math.min(100, Math.max(0, Number(e.target.value))))}
                      className="w-14 px-1.5 py-0.5 text-xs font-mono font-bold bg-white border border-purple-300 rounded-md focus:outline-none focus:border-purple-500"
                    />
                    <button
                      onClick={handleSaveDiscount}
                      disabled={updateDiscountMutation.isPending}
                      className="p-1 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors disabled:bg-slate-200"
                    >
                      <Check size={12} />
                    </button>
                    <button
                      onClick={() => {
                        setDiscountValue(client.personal_discount || 0);
                        setIsEditingDiscount(false);
                      }}
                      className="text-[10px] text-slate-400 font-semibold hover:text-slate-600 px-0.5"
                    >
                      Отмена
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-5">
            <div className="bg-white border border-slate-100 p-3 rounded-2xl flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                <CalendarDays size={16} />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Визиты</span>
                <span className="text-sm font-bold text-slate-700">{client.records_count || 0}</span>
              </div>
            </div>

            {client.ltv !== undefined && (
              <div className="bg-white border border-slate-100 p-3 rounded-2xl flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <Wallet size={16} />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Общий доход</span>
                  <span className="text-sm font-bold text-slate-800 font-mono">{(client.ltv).toLocaleString()} ₽</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* КОНТЕНТ (СКРОЛЛ-ЗОНА ВНУТРИ ОКНА) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-[250px] relative">

          {/* ОВЕРЛЕЙ ПРИ БАЗОВОМ ТАРИФЕ */}
          {subscription?.plan_id === 1 && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 bg-slate-900/10 backdrop-blur-[2px] transition-all">
              <div className="bg-white/95 border border-slate-200/80 rounded-2xl p-6 text-center max-w-xs shadow-2xl shadow-slate-900/10 backdrop-blur-md space-y-3.5 animate-in fade-in zoom-in-95 duration-200">
                <div className="w-12 h-12 bg-amber-50 border border-amber-200/60 rounded-2xl flex items-center justify-center mx-auto text-amber-600 shadow-sm">
                  <Lock size={22} />
                </div>

                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-800 tracking-tight">
                    История посещений недоступна
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Перейдите на продвинутый тариф, чтобы просматривать полную историю записей и фото работ.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (onUpgrade) {
                      onUpgrade();
                    } else {
                      router.push("?tab=tariffs");
                    }
                  }}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
                >
                  <Sparkles size={14} />
                  <span>Повысить тариф</span>
                </button>
              </div>
            </div>
          )}

          {/* ОСНОВНОЙ КОНТЕНТ (БЛЮРИТСЯ, ЕСЛИ plan_id === 1) */}
          <div className={subscription?.plan_id === 1 ? "blur-md select-none pointer-events-none opacity-60" : ""}>
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-2">
              <Clock size={14} /> История посещений
            </h3>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-3">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs font-medium text-slate-400">Загрузка истории записей...</p>
              </div>
            ) : isError ? (
              <div className="text-center py-10 bg-rose-50/50 rounded-2xl border border-dashed border-rose-100">
                <p className="text-sm text-rose-600 font-medium">Не удалось загрузить историю записей</p>
              </div>
            ) : records && records.length > 0 ? (
              <div className="relative border-l-2 border-slate-100 pl-4 ml-2 space-y-5">

                {records.map((rec: any) => {
                  const status = statusConfig[rec.status] || { label: rec.status, classes: 'bg-slate-50 text-slate-600 border-slate-200' };

                  return (
                    <div key={rec.id} className="relative group/item">
                      <div className="absolute -left-[23px] top-1.5 w-2.5 h-2.5 rounded-full bg-slate-300 border-2 border-white group-hover/item:bg-blue-500 group-hover/item:scale-125 transition-all" />

                      <div className="bg-white border border-slate-100 rounded-2xl p-4 hover:border-slate-200/80 hover:shadow-[0_4px_20px_rgba(0,0,0,0.015)] transition-all space-y-3">

                        <div className="flex justify-between items-center gap-4">
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-xl">
                            <span>
                              {new Date(rec.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                            <span className="text-slate-300">•</span>
                            <span className="text-slate-700 font-mono">
                              {new Date(rec.date).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </span>

                          <span className="text-sm font-bold text-slate-900 font-mono bg-emerald-50/60 border border-emerald-100/50 px-2.5 py-0.5 rounded-xl">
                            {(rec.price ?? 0).toLocaleString()} ₽
                          </span>
                        </div>

                        <div className="flex items-start gap-2 text-sm text-slate-800 font-semibold leading-snug">
                          <Scissors size={14} className="text-slate-400 shrink-0 mt-0.5" />
                          <span>{rec.services_names ? rec.services_names.join(", ") : "Без названия"}</span>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-50 text-xs">
                          <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                            <User size={13} className="text-slate-400" />
                            <span>Мастер: <span className="text-slate-700 font-semibold">{rec.specialist_name || "—"}</span></span>
                          </div>

                          <span className={`inline-flex items-center px-2 py-0.5 rounded-lg border text-[10px] font-bold uppercase tracking-wider ${status.classes}`}>
                            {status.label}
                          </span>
                        </div>

                        {rec.comment && (
                          <div className="flex items-start gap-1.5 p-2.5 bg-slate-50/50 rounded-xl text-xs border border-slate-100/40 text-slate-600">
                            <MessageSquare size={12} className="text-slate-400 shrink-0 mt-0.5" />
                            <p><span className="font-semibold text-slate-500">Заметка:</span> {rec.comment}</p>
                          </div>
                        )}

                        {rec.photos && rec.photos.length > 0 && (
                          <div className="pt-1">
                            <div className="grid grid-cols-4 gap-2">
                              {rec.photos.map((photo: any) => {
                                const photoUrl = photo.image.startsWith('http')
                                  ? photo.image
                                  : `${apiBaseUrl.replace(/\/$/, '')}${photo.image}`;

                                return (
                                  <div
                                    key={photo.id}
                                    className="relative aspect-square rounded-xl overflow-hidden border border-slate-200/80 bg-slate-50 group/img cursor-pointer"
                                    onClick={() => window.open(photoUrl, '_blank')}
                                    title="Открыть оригинал фото"
                                  >
                                    <img
                                      src={photoUrl}
                                      alt="Результат"
                                      className="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-300"
                                    />
                                    <div className="absolute inset-0 bg-black/5 opacity-0 group-hover/img:opacity-100 transition-opacity" />
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                      </div>
                    </div>
                  );
                })}

              </div>
            ) : (
              <div className="text-center py-16 bg-slate-50/40 border border-dashed border-slate-200 rounded-2xl">
                <p className="text-xs font-medium text-slate-400">У этого клиента еще нет посещений.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}