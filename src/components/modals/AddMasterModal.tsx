"use client";

import React, { useState } from "react";
import { X, ChevronDown, ShieldAlert, ShieldCheck } from "lucide-react";

interface AddMasterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
}

export function AddMasterModal({ isOpen, onClose, onSave }: AddMasterModalProps) {
  const [formData, setFormData] = useState({
    display_name: "",
    position: "Мастер",
    role: "master", // Дефолтная роль для бэкенда
    phone: "",
    slot_interval: 60
  });

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (formData.display_name.trim() && formData.phone.trim()) {
      onSave(formData);
      // Сбрасываем форму после сохранения
      setFormData({
        display_name: "",
        position: "Мастер",
        role: "master",
        phone: "",
        slot_interval: 60
      });
    }
  };

  // Автоматически подставляем название должности при изменении роли
  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedRole = e.target.value;
    const defaultPosition = selectedRole === "admin" ? "Администратор" : "Мастер";

    setFormData({
      ...formData,
      role: selectedRole,
      position: defaultPosition
    });
  };

  const isFormValid = formData.display_name.trim().length > 0 && formData.phone.trim().length > 0;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-2xl border border-slate-200/80 shadow-[0_20px_50px_rgba(0,0,0,0.12)] overflow-hidden animate-in zoom-in-98 duration-200">

        {/* Шапка модального окна */}
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/40">
          <div>
            <h3 className="text-[18px] font-bold text-slate-900 tracking-tight leading-none">Новый сотрудник</h3>
            <p className="text-[12px] text-slate-400 mt-1.5">Заполните основные данные сотрудника</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-150/60 rounded-lg transition-colors text-slate-400 hover:text-slate-800"
          >
            <X size={18} />
          </button>
        </div>

        {/* Тело формы */}
        <div className="p-6 space-y-4">

          {/* Поле: Имя и Фамилия */}
          <div className="space-y-1.5">
            <label className="text-[13px] font-semibold text-slate-700 ml-0.5">Имя и фамилия</label>
            <input
              autoFocus
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:border-slate-800 focus:ring-4 focus:ring-slate-900/5 transition-all outline-none text-slate-900 placeholder:text-slate-400"
              placeholder="Напр. Иван Иванов"
              value={formData.display_name}
              onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
            />
          </div>

          {/* Сетка: Роль и Интервал */}
          <div className="grid grid-cols-2 gap-4">
            {/* Поле: Системная Роль */}
            <div className="space-y-1.5">
              <label className="text-[13px] font-semibold text-slate-700 ml-0.5">Доступ (Роль)</label>
              <div className="relative">
                <select
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 pr-10 text-sm font-medium focus:border-slate-800 focus:ring-4 focus:ring-slate-900/5 transition-all outline-none appearance-none cursor-pointer text-slate-900"
                  value={formData.role}
                  onChange={handleRoleChange}
                >
                  <option value="master">Мастер</option>
                  <option value="admin">Администратор</option>
                </select>
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <ChevronDown size={14} />
                </div>
              </div>
            </div>

            {/* Поле: Интервал */}
            <div className="space-y-1.5">
              <label className="text-[13px] font-semibold text-slate-700 ml-0.5">Интервал (мин)</label>
              <input
                type="number"
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:border-slate-800 focus:ring-4 focus:ring-slate-900/5 transition-all outline-none text-slate-900"
                value={formData.slot_interval}
                onChange={(e) => setFormData({ ...formData, slot_interval: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>

          {/* ПОДСКАЗКА ПРО ДОСТУПЫ (Контекстная плашка) */}
          <div className="animate-in fade-in slide-in-from-top-1 duration-200">
            {formData.role === "admin" ? (
              <div className="flex gap-2.5 p-3 rounded-xl bg-blue-50/50 border border-blue-100 text-blue-800">
                <ShieldCheck size={16} className="text-blue-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-blue-700">Полный доступ (Админ)</p>
                  <p className="text-xs text-slate-500 leading-normal">
                    Разрешено управление всей филиальной сетью: просмотр общей выручки, редактирование каталога услуг, изменение прав других сотрудников и доступ к базе клиентов.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-slate-700">
                <ShieldAlert size={16} className="text-slate-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Ограниченный доступ (Мастер)</p>
                  <p className="text-xs text-slate-500 leading-normal">
                    Сотрудник видит только своё расписание и личные записи. Доступ к редактированию настроек компании, общей финансовой аналитике и чужим клиентам закрыт.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Поле: Название должности */}
          <div className="space-y-1.5">
            <label className="text-[13px] font-semibold text-slate-700 ml-0.5">Отображаемая должность (для клиентов)</label>
            <input
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:border-slate-800 focus:ring-4 focus:ring-slate-900/5 transition-all outline-none text-slate-900 placeholder:text-slate-400"
              placeholder="Напр. Старший Топ-Мастер"
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
            />
          </div>

          {/* Поле: Телефон */}
          <div className="space-y-1.5">
            <label className="text-[13px] font-semibold text-slate-700 ml-0.5">Телефон</label>
            <input
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:border-slate-800 focus:ring-4 focus:ring-slate-900/5 transition-all outline-none text-slate-900 placeholder:text-slate-400"
              placeholder="+7 (999) 000-00-00"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>
        </div>

        {/* Подвал с действиями */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl font-semibold text-sm text-slate-500 hover:text-slate-800 hover:bg-slate-100/50 transition-all active:scale-[0.98]"
          >
            Отмена
          </button>
          <button
            disabled={!isFormValid}
            onClick={handleSubmit}
            className={`flex-1 py-2.5 rounded-xl font-semibold text-sm text-center transition-all active:scale-[0.98] ${isFormValid
                ? 'bg-slate-900 text-white hover:bg-slate-800 shadow-[0_1px_2px_rgba(0,0,0,0.05)] cursor-pointer'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200/40'
              }`}
          >
            Создать
          </button>
        </div>
      </div>
    </div>
  );
}