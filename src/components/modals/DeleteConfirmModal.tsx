"use client";

import React from "react";
import { X, Trash2, AlertCircle } from "lucide-react";

interface DeleteConfirmModalProps {
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
}

export default function DeleteConfirmModal({
  onClose,
  onConfirm,
  title = "Удалить услугу?",
  description = "Услуга будет удалена из базы навсегда. Это действие нельзя отменить."
}: DeleteConfirmModalProps) {
  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[10000] flex items-center justify-center p-4 animate-in fade-in duration-250">

      {/* Задний фон-кликер для закрытия */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Контейнер модального окна */}
      <div className="relative bg-white rounded-2xl w-full max-w-md p-6 border border-slate-200/60 shadow-[0_24px_60px_-15px_rgba(15,23,42,0.12)] space-y-6 animate-in zoom-in-95 duration-200">

        {/* Кнопка закрытия (крестик) */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 w-8 h-8 flex items-center justify-center bg-slate-50 rounded-lg text-slate-400 hover:text-slate-900 border border-slate-200/50 hover:border-slate-300 active:scale-95 transition-all duration-200"
        >
          <X size={16} strokeWidth={2.5} />
        </button>

        {/* Контентная часть в современном компоновочном стиле */}
        <div className="flex items-start gap-4 pt-2">
          {/* Иконка-предупреждение */}
          <div className="flex-shrink-0 w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center border border-rose-100 shadow-sm">
            <AlertCircle size={20} strokeWidth={2.5} />
          </div>

          <div className="space-y-1.5 pr-6">
            <h3 className="text-base font-black tracking-tight text-slate-900">
              {title}
            </h3>
            <p className="text-slate-400 text-xs font-medium leading-relaxed">
              {description}
            </p>
          </div>
        </div>

        {/* Дополнительная плашка-предупреждение (визуальный акцент на деструктивности действия) */}
        <div className="bg-amber-50/40 border border-amber-200/60 rounded-xl p-3 flex items-center gap-2.5 text-[11px] text-amber-700 font-semibold">
          <Trash2 size={14} className="text-amber-600 flex-shrink-0" strokeWidth={2.2} />
          <span>Связанные с этим объектом активные записи могут быть отменены.</span>
        </div>

        {/* Кнопки действий: элегантные, пропорциональные, интерактивные */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl font-bold text-xs transition-all duration-200 active:scale-[0.98]"
          >
            Отмена
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className="px-5 py-2.5 bg-rose-600 text-white hover:bg-rose-700 rounded-xl font-bold text-xs shadow-md shadow-rose-600/10 hover:shadow-rose-700/20 active:scale-[0.98] transition-all duration-200 flex items-center gap-1.5"
          >
            Подтвердить удаление
          </button>
        </div>

      </div>
    </div>
  );
}