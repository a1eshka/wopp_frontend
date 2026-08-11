"use client";

import { useEffect, useState } from "react";
import { X, Phone, CalendarDays, Wallet, Clock, User, Scissors, MessageSquare, Percent, Check, Settings, RotateCcw } from "lucide-react";
import { useClientRecords, useUpdateClientDiscount, useUpdateBookingStatus } from "@/app/api/hooks";

export function ClientDetailsModal({ client, organizationId, onClose }: any) {
  const { data: records = [], isLoading, isError } = useClientRecords(client.id);
  const updateDiscountMutation = useUpdateClientDiscount(); 
  const updateStatusMutation = useUpdateBookingStatus(); // Подключаем обновленный универсальный хук

  // Стейты для редактирования личной скидки клиента
  const [isEditingDiscount, setIsEditingDiscount] = useState(false);
  const [discountValue, setDiscountValue] = useState<number>(client.personal_discount || 0);

  // Стейты для управления калькулятором закрытия конкретной записи
  const [activeBookingId, setActiveBookingId] = useState<string | null>(null);
  const [isManualMode, setIsManualMode] = useState(false);
  const [manualPrice, setManualPrice] = useState<string>("");
  const [manualDiscount, setManualDiscount] = useState<string>("");

  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Метод сохранения личной скидки клиента в CRM
  const handleSaveDiscount = () => {
    updateDiscountMutation.mutate(
      { phone: client.phone, discount: discountValue },
      {
        onSuccess: (data) => {
          client.personal_discount = data.personal_discount;
          setIsEditingDiscount(false);
        },
        onError: () => {
          alert("Не удалось сохранить изменения");
        }
      }
    );
  };

  // Метод проведения оплаты и закрытия визита
  const handleCompleteSubmit = (bookingId: string) => {
    updateStatusMutation.mutate({
      id: bookingId,
      action: "complete",
      customPrice: isManualMode && manualPrice ? parseFloat(manualPrice) : null,
      discountPercent: isManualMode && manualDiscount ? parseInt(manualDiscount) : null,
    }, {
      onSuccess: () => {
        // Сбрасываем стейты формы расчета
        setActiveBookingId(null);
        setIsManualMode(false);
        setManualPrice("");
        setManualDiscount("");
      },
      onError: () => {
        alert("Произошла ошибка при проведении оплаты.");
      }
    });
  };

  return (
    <div 
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
    >
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Шапка модалки */}
        <div className="p-5 border-b flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
              {client.name ? client.name.split(" ").map((n: any) => n[0]).slice(0, 2).join("").toUpperCase() : "КЛ"}
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 text-base">{client.name}</h3>
              <p className="text-xs text-slate-500 flex items-center gap-1"><Phone size={12}/> {client.phone}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-200 rounded-full text-slate-400 transition">
            <X size={18} />
          </button>
        </div>

        {/* Контент модалки */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          
          {/* Блок управления персональной скидкой клиента */}
          <div className="p-4 rounded-xl border bg-slate-50/50 flex justify-between items-center">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-purple-50 text-purple-600 rounded-lg border border-purple-100">
                <Percent size={16} />
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Персональная скидка</span>
                {isEditingDiscount ? (
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(Number(e.target.value))}
                    className="w-20 p-1 border rounded text-sm bg-white font-semibold mt-0.5"
                  />
                ) : (
                  <span className="font-bold text-slate-800 text-sm">{client.personal_discount || 0}%</span>
                )}
              </div>
            </div>

            <div>
              {isEditingDiscount ? (
                <button
                  onClick={handleSaveDiscount}
                  disabled={updateDiscountMutation.isPending}
                  className="p-1.5 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-slate-300 transition"
                >
                  <Check size={14} />
                </button>
              ) : (
                <button
                  onClick={() => setIsEditingDiscount(true)}
                  className="text-xs text-purple-600 font-medium hover:underline"
                >
                  Изменить
                </button>
              )}
            </div>
          </div>

          {/* Список записей клиента */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <CalendarDays size={14}/> История визитов и записи
            </h4>

            {isLoading && <p className="text-sm text-slate-500 py-4 text-center">Загрузка истории...</p>}
            {isError && <p className="text-sm text-rose-500 py-4 text-center">Ошибка при загрузке записей</p>}

            {!isLoading && !isError && records.length === 0 && (
              <p className="text-sm text-slate-400 py-4 text-center">История записей пуста</p>
            )}

            {!isLoading && !isError && records.map((record: any) => {
              const isCurrentActive = activeBookingId === record.id;
              
              // Рассчитываем авто-цену на лету для подсказки интерфейса
              const clientDiscount = client.personal_discount || 0;
              const autoFinalPrice = record.base_price - (record.base_price * clientDiscount) / 100;

              return (
                <div key={record.id} className="p-4 border rounded-xl flex flex-col gap-3 bg-white shadow-sm">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-slate-800 text-sm">Визит на сумму {record.base_price} ₽</p>
                      <p className="text-xs text-slate-400">Статус: <span className="font-medium">{record.status}</span></p>
                    </div>
                    
                    {record.status !== 'completed' && !isCurrentActive && (
                      <button
                        onClick={() => {
                          setActiveBookingId(record.id);
                          setIsManualMode(false);
                          setManualPrice("");
                          setManualDiscount("");
                        }}
                        className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700 transition"
                      >
                        Завершить визит
                      </button>
                    )}
                  </div>

                  {/* Блок калькулятора расчета стоимости визита */}
                  {isCurrentActive && (
                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg space-y-3 animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-semibold text-slate-600">Параметры закрытия чека</span>
                        <button 
                          type="button"
                          onClick={() => {
                            setIsManualMode(!isManualMode);
                            setManualPrice("");
                            setManualDiscount("");
                          }}
                          className="text-[11px] text-indigo-600 flex items-center gap-1 hover:underline font-medium"
                        >
                          {isManualMode ? <><RotateCcw size={12}/> Использовать авто-скидку</> : <><Settings size={12}/> Своя цена / процент</>}
                        </button>
                      </div>

                      {!isManualMode ? (
                        // Автоматический сценарий расчета
                        <div className="text-xs flex justify-between items-center bg-white p-2.5 rounded border border-slate-200 text-slate-600">
                          <span>Персональная скидка: <b className="text-slate-800">{clientDiscount}%</b></span>
                          <span>Итог к оплате: <b className="text-emerald-600 text-sm">{autoFinalPrice} ₽</b></span>
                        </div>
                      ) : (
                        // Ручной сценарий (Своя цена / Свой процент)
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] text-slate-500 block mb-0.5">Вбить цену руками (₽)</label>
                            <input
                              type="number"
                              placeholder={`${record.base_price}`}
                              value={manualPrice}
                              disabled={!!manualDiscount}
                              onChange={(e) => setManualPrice(e.target.value)}
                              className="w-full p-2 border rounded bg-white text-xs disabled:bg-slate-100 focus:outline-indigo-500"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-500 block mb-0.5">Кастомная скидка (%)</label>
                            <input
                              type="number"
                              placeholder="Например: 15"
                              value={manualDiscount}
                              disabled={!!manualPrice}
                              onChange={(e) => setManualDiscount(e.target.value)}
                              className="w-full p-2 border rounded bg-white text-xs disabled:bg-slate-100 focus:outline-indigo-500"
                            />
                          </div>
                        </div>
                      )}

                      {/* Кнопки действий калькулятора */}
                      <div className="flex justify-end gap-1.5 text-xs pt-1">
                        <button
                          type="button"
                          onClick={() => { setActiveBookingId(null); setIsManualMode(false); }}
                          className="px-2.5 py-1.5 text-slate-500 hover:bg-slate-200 rounded transition"
                        >
                          Отмена
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCompleteSubmit(record.id)}
                          disabled={updateStatusMutation.isPending}
                          className="px-3 py-1.5 bg-emerald-600 text-white rounded font-medium hover:bg-emerald-700 disabled:bg-slate-300 flex items-center gap-1 transition"
                        >
                          {updateStatusMutation.isPending ? "Сохранение..." : <><Check size={12} /> Провести оплату</>}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}