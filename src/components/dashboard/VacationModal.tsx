import { useState, useEffect } from "react";

// 1. Добавили export, чтобы файл MastersTab мог его импортировать
export function VacationModal({ isOpen, onClose, onSave, currentStart, currentEnd }: any) {
  const [start, setStart] = useState(currentStart || "");
  const [end, setEnd] = useState(currentEnd || "");

  // 2. Добавили синхронизацию стейта. Когда открываем модалку для нового мастера, 
  // даты в инпутах должны обновляться на актуальные
  useEffect(() => {
    if (isOpen) {
      setStart(currentStart || "");
      setEnd(currentEnd || "");
    }
  }, [isOpen, currentStart, currentEnd]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-110 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden p-6 animate-in zoom-in-95 duration-200">
        <h3 className="font-black text-lg mb-4 text-slate-900">Период отпуска</h3>

        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 ml-2 mb-1 block">С какого числа</label>
            <input
              type="date"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 ml-2 mb-1 block">По какое число</label>
            <input
              type="date"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-8">
          {/* Кнопка сброса шлет null на бэкенд, очищая отпуск */}
          <button
            onClick={() => { onSave(null, null); onClose(); }}
            className="flex-1 text-red-500 font-bold text-[10px] uppercase tracking-wider hover:bg-red-50 rounded-2xl transition-colors"
          >
            Убрать отпуск
          </button>

          <button
            onClick={() => onSave(start, end)}
            className="flex-[2] bg-slate-900 text-white p-4 rounded-2xl font-bold text-xs shadow-xl active:scale-95 transition-all"
          >
            Сохранить
          </button>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-4 text-slate-400 text-[10px] font-bold uppercase tracking-widest hover:text-slate-600 transition-colors"
        >
          Закрыть
        </button>
      </div>
    </div>
  );
}