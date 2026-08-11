"use client";

import { useState, useRef, useEffect, ChangeEvent } from "react";
import {
  MoreHorizontal,
  Phone,
  Clock,
  Trash2,
  TreePalm,
  Scissors,
  Palette,
  Check,
  CalendarDays,
  Radio,
  Camera,
  X,
  UserRound,
  Loader2
} from "lucide-react";

const PRESET_COLORS = ["#2563eb", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#0f172a"];

interface MasterCardProps {
  master: any;
  onOpenSchedule: (master: any) => void;
  onOpenServices: (master: any) => void;
  onDelete: (id: number | string) => void;
  onToggle: (id: number | string) => void;
  onOpenVacation: (master: any) => void;
  onUpdateColor: (id: number | string, color: string) => void;
  onUpdateMaster: (id: number | string, data: FormData) => Promise<void>;
}

export function MasterCard({
  master,
  onOpenSchedule,
  onOpenServices,
  onDelete,
  onToggle,
  onOpenVacation,
  onUpdateColor,
  onUpdateMaster
}: MasterCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Флаг того, что аватар был принудительно удален пользователем в сессии редактирования
  const [isAvatarRemoved, setIsAvatarRemoved] = useState(false);

  const [editData, setEditData] = useState({
    display_name: master.display_name || "",
    position: master.position || "",
    phone: master.phone || "",
    slot_interval: master.slot_interval || 30
  });

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const servicesCount = master.services?.length || 0;
  const hasVacation = master.vacation_start && master.vacation_end;
  const masterColor = master.color || "#2563eb";

  // Сброс локального стейта
  useEffect(() => {
    setEditData({
      display_name: master.display_name || "",
      position: master.position || "",
      phone: master.phone || "",
      slot_interval: master.slot_interval || 30
    });
    setAvatarPreview(null);
    setAvatarFile(null);
    setIsAvatarRemoved(false);
  }, [master, isEditing]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarFile(file);
    setIsAvatarRemoved(false);
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append("display_name", editData.display_name);
      formData.append("position", editData.position);
      formData.append("phone", editData.phone);
      formData.append("slot_interval", String(editData.slot_interval));

      if (avatarFile) {
        formData.append("avatar", avatarFile);
      } else if (isAvatarRemoved) {
        formData.append("remove_avatar", "true");
      }

      await onUpdateMaster(master.id, formData);
      setIsEditing(false);
    } catch (err) {
      console.error("Ошибка при обновлении мастера:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className={`relative p-6 rounded-2xl border transition-all duration-300 group flex flex-col justify-between overflow-hidden ${master.is_active
          ? 'bg-white border-slate-200/70 shadow-[0_1px_3px_rgba(0,0,0,0.02),0_12px_36px_rgba(0,0,0,0.02)] hover:shadow-[0_1px_3px_rgba(0,0,0,0.02),0_24px_48px_rgba(0,0,0,0.05)] hover:border-slate-300'
          : 'bg-slate-50/50 border-slate-200/40 opacity-60'
        }`}
    >
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleFileChange}
      />

      {/* Мягкий световой акцент на фоне */}
      {master.is_active && (
        <div
          className="absolute -top-24 -right-24 w-48 h-48 rounded-full blur-[70px] opacity-[0.03] group-hover:opacity-[0.07] transition-opacity duration-300 pointer-events-none"
          style={{ backgroundColor: masterColor }}
        />
      )}

      {/* Метка отпуска */}
      {hasVacation && !isEditing && (
        <div className="absolute top-4 left-6 z-10 px-3 py-1 rounded-lg bg-amber-50 border border-amber-200/70 text-amber-800 flex items-center gap-1.5 animate-in fade-in duration-200">
          <TreePalm size={13} className="text-amber-600" />
          <span className="text-[10px] font-semibold uppercase tracking-wider font-mono">
            {new Date(master.vacation_start).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
            — {new Date(master.vacation_end).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
          </span>
        </div>
      )}

      <div>
        {/* Верхняя часть: Инфо и управление */}
        <div className={`flex items-start justify-between mb-6 ${(hasVacation && !isEditing) ? 'pt-8' : 'pt-1.5'}`}>
          <div className="flex items-center gap-4 w-full">

            {/* Аватар */}
            <div className="relative shrink-0">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center p-[1px] transition-all duration-300 relative group/avatar"
                style={{
                  backgroundColor: master.is_active ? `${masterColor}25` : '#e2e8f0',
                  cursor: isEditing ? 'pointer' : 'default'
                }}
                onClick={() => isEditing && fileInputRef.current?.click()}
              >
                <div className="w-full h-full rounded-[11px] bg-white overflow-hidden p-[2.5px]">
                  {avatarPreview ? (
                    <img src={avatarPreview} className="w-full h-full object-cover rounded-[9px]" alt="Preview" />
                  ) : (master.avatar_url && !isAvatarRemoved) ? (
                    <img
                      src={master.avatar_url.startsWith('http') ? master.avatar_url : `http://127.0.0.1:8000${master.avatar_url}`}
                      className="w-full h-full object-cover rounded-[9px]"
                      alt={master.display_name}
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center font-bold text-base text-white uppercase rounded-[9px]"
                      style={{ backgroundColor: master.is_active ? masterColor : '#94a3b8' }}
                    >
                      {editData.display_name?.[0] || <UserRound size={18} />}
                    </div>
                  )}
                </div>

                {/* Ховер-эффект для загрузки новой картинки */}
                {isEditing && (
                  <div className="absolute inset-0 bg-slate-900/40 rounded-xl flex items-center justify-center text-white opacity-0 group-hover/avatar:opacity-100 transition-opacity">
                    <Camera size={16} />
                  </div>
                )}
              </div>

              {/* Удаление аватара в режиме редактирования */}
              {isEditing && (avatarPreview || (master.avatar_url && !isAvatarRemoved)) && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setAvatarPreview(null);
                    setAvatarFile(null);
                    setIsAvatarRemoved(true);
                  }}
                  className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white p-1 rounded-full shadow-sm hover:bg-rose-600 transition-colors z-10"
                >
                  <X size={10} />
                </button>
              )}

              {/* Статус-индикатор */}
              {master.is_active && !isEditing && (
                <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white shadow-sm" />
              )}
            </div>

            {/* Имя и должность */}
            <div className="space-y-1.5 flex-1 min-w-0">
              {isEditing ? (
                <div className="space-y-1.5 w-full pr-4">
                  <input
                    type="text"
                    value={editData.display_name}
                    onChange={(e) => setEditData(prev => ({ ...prev, display_name: e.target.value }))}
                    placeholder="Имя мастера"
                    className="w-full text-[14px] font-semibold bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-800 outline-none focus:border-slate-800"
                  />
                  <input
                    type="text"
                    value={editData.position}
                    onChange={(e) => setEditData(prev => ({ ...prev, position: e.target.value }))}
                    placeholder="Должность (напр. Топ-стилист)"
                    className="w-full text-[11px] font-medium bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-600 outline-none focus:border-slate-800"
                  />
                </div>
              ) : (
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-900 text-[16px] tracking-tight leading-snug truncate">
                    {master.display_name}
                  </h4>
                  <span className="inline-block text-[11px] font-medium text-slate-400 truncate max-w-full">
                    {master.position || "Специалист"}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Кнопка опций */}
          {!isEditing && (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-150 ${showMenu
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-400 hover:bg-slate-50 hover:text-slate-800'
                  }`}
              >
                <MoreHorizontal size={16} />
              </button>

              {/* Выпадающее меню */}
              {showMenu && (
                <div className="absolute right-0 mt-2 w-60 bg-white border border-slate-200/80 shadow-[0_12px_36px_rgba(0,0,0,0.08)] rounded-xl z-30 p-1 space-y-0.5 animate-in fade-in duration-100 origin-top-right">

                  {/* Выбор цвета */}
                  <div className="p-2 px-3 bg-slate-50 border border-slate-100 rounded-lg space-y-1.5 mb-1">
                    <p className="text-[10px] font-semibold uppercase text-slate-450 tracking-wider flex items-center gap-1.5">
                      <Palette size={11} /> Цвет карточки
                    </p>
                    <div className="flex gap-1.5 justify-between">
                      {PRESET_COLORS.map(c => {
                        const isSelected = master.color === c;
                        return (
                          <button
                            key={c}
                            onClick={() => { onUpdateColor(master.id, c); setShowMenu(false); }}
                            className="w-5 h-5 rounded-full border border-white shadow-sm relative transition-all duration-150 hover:scale-105 shrink-0"
                            style={{ backgroundColor: c }}
                          >
                            {isSelected && <Check size={10} className="text-white absolute inset-0 m-auto" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Редактировать профиль */}
                  <button
                    onClick={() => { setIsEditing(true); setShowMenu(false); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-[12px] font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                  >
                    <UserRound size={14} className="text-slate-400" />
                    <span>Редактировать данные</span>
                  </button>

                  <button
                    onClick={() => { onOpenVacation(master); setShowMenu(false); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-[12px] font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                  >
                    <CalendarDays size={14} className="text-slate-400" />
                    <span>Запланировать отпуск</span>
                  </button>

                  <button
                    onClick={() => { onToggle(master.id); setShowMenu(false); }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-left text-[12px] font-medium rounded-lg transition-colors ${master.is_active ? 'text-amber-600 hover:bg-amber-50/50' : 'text-emerald-600 hover:bg-emerald-50/50'
                      }`}
                  >
                    <Radio size={14} className="shrink-0" />
                    <span>{master.is_active ? "Приостановить запись" : "Активировать запись"}</span>
                  </button>

                  <div className="h-px bg-slate-100 my-1 mx-2" />

                  <button
                    onClick={() => { if (confirm(`Удалить сотрудника ${master.display_name}?`)) onDelete(master.id); setShowMenu(false); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-[12px] font-medium text-rose-600 hover:bg-rose-50/50 rounded-lg transition-colors"
                  >
                    <Trash2 size={14} />
                    <span>Удалить из компании</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Информационные блоки */}
        <div className="space-y-2.5 border-t border-slate-100 pt-4 pb-1.5">
          {/* Телефон */}
          <div className="flex items-center justify-between text-[13px] font-medium">
            <span className="text-slate-400 flex items-center gap-2">
              <Phone size={13} className="text-slate-300" /> Телефон
            </span>

            <span className="text-slate-700 font-mono tracking-tight">{master.phone || "—"}</span>

          </div>

          {/* Сессия */}
          <div className="flex items-center justify-between text-[13px] font-medium">
            <span className="text-slate-400 flex items-center gap-2">
              <Clock size={13} className="text-slate-300" /> Сессия
            </span>
            {isEditing ? (
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min="5"
                  max="480"
                  step="5"
                  value={editData.slot_interval}
                  onChange={(e) => setEditData(prev => ({ ...prev, slot_interval: parseInt(e.target.value) || 30 }))}
                  className="w-16 text-right text-xs font-mono bg-slate-50 border border-slate-200 rounded px-2 py-0.5 text-slate-800 outline-none focus:border-slate-800"
                />
                <span className="text-xs text-slate-400 font-mono">мин</span>
              </div>
            ) : (
              <span className="text-slate-700 font-mono">{master.slot_interval} мин</span>
            )}
          </div>
        </div>
      </div>

      {/* Управление */}
      <div className="mt-6 flex gap-2.5">
        {isEditing ? (
          <>
            <button
              onClick={() => setIsEditing(false)}
              disabled={isSaving}
              className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all duration-150 text-center active:scale-[0.98] disabled:opacity-50"
            >
              Отмена
            </button>

            <button
              onClick={handleSave}
              disabled={isSaving || !editData.display_name}
              className="flex-1 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-all duration-150 text-center flex items-center justify-center gap-1.5 active:scale-[0.98] disabled:opacity-50"
            >
              {isSaving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
              Сохранить
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => onOpenSchedule(master)}
              disabled={!master.is_active}
              className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold transition-all duration-150 text-center ${master.is_active
                  ? 'bg-slate-900 text-white hover:bg-slate-800 shadow-[0_1px_2px_rgba(0,0,0,0.05)] active:scale-[0.98]'
                  : 'bg-slate-100/80 text-slate-400 cursor-not-allowed'
                }`}
            >
              График работы
            </button>

            <button
              onClick={() => onOpenServices(master)}
              disabled={!master.is_active}
              className={`py-2.5 px-4 rounded-xl border flex items-center justify-center gap-2 transition-all duration-150 ${master.is_active
                  ? 'bg-white border-slate-200/90 text-slate-700 hover:bg-slate-50 hover:border-slate-300 active:scale-[0.98]'
                  : 'bg-slate-50/30 border-transparent text-slate-300 cursor-not-allowed'
                }`}
            >
              <Scissors size={13} className="text-slate-400 transition-colors" />
              <span className="text-xs font-semibold">
                {servicesCount > 0 ? (
                  <>
                    Услуги <span className="text-slate-300 mx-0.5">•</span> <span className="font-bold text-slate-900">{servicesCount}</span>
                  </>
                ) : (
                  "Настроить"
                )}
              </span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}