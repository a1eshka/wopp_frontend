"use client";

import React, { useState } from 'react';
import { 
  User, LayoutDashboard, PlusCircle, LogOut, 
  BellRing, Send, CheckCircle2, 
  ArrowLeft
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface UserHeaderProps {
  userData: {
    user?: {
      first_name?: string;
      phone?: string;
      avatar?: string | null;
      telegram_link?: string | null;
      telegram_id?: string | number | null; // ID пользователя в Телеграме
    };
    is_specialist?: boolean;
    telegram_link?: string | null;
    telegram_id?: string | number | null; // На случай, если бэкенд отдает в корне
  } | null;
  fallbackPhone?: string;
  children?: React.ReactNode; 
}

export function UserHeader({ userData, fallbackPhone, children }: UserHeaderProps) {
  const router = useRouter();
  const [isTgClicked, setIsTgClicked] = useState(false);

  // Достаем ссылку на бота и проверяем наличие Telegram ID
  const tgLink = userData?.telegram_link || userData?.user?.telegram_link;
  const hasTelegramId = userData?.telegram_id || userData?.user?.telegram_id;
  
  // Уведомления активны, если есть ID в профиле ИЛИ если пользователь только что кликнул по кнопке
  const isConnected = !!hasTelegramId || isTgClicked;

  return (
    <div className="w-full">
        {/* КНОПКА НАЗАД (Верхний навигационный трек) */}
      <div className="mb-4">
        <button 
          onClick={() => router.push('/cabinet')}
          className="inline-flex items-center text-sm gap-2 font-extrabold tracking-wider text-slate-400 hover:text-slate-900 transition-colors group cursor-pointer"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" strokeWidth={2.5} />
          Назад в кабинет
        </button>
      </div>
      {/* ХЕАДЕР ПОЛЬЗОВАТЕЛЯ */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        {/* ЛЕВАЯ ЧАСТЬ: ИНФО ПОЛЬЗОВАТЕЛЯ */}
        <div className="flex items-center gap-5">
          <div className="relative shrink-0">
            <div className="w-20 h-20 rounded-[2rem] bg-white shadow-xl shadow-slate-200 overflow-hidden border-4 border-white flex items-center justify-center text-blue-600">
              {userData?.user?.avatar ? (
                <img src={userData.user.avatar} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <User size={32} strokeWidth={2.5} />
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 bg-emerald-500 w-6 h-6 rounded-full border-4 border-slate-50"></div>
          </div>

          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none uppercase">
              {userData?.user?.first_name || 'Профиль'}
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm text-slate-400 font-bold">
                {userData?.user?.phone || fallbackPhone || '—'}
              </span>
            </div>
          </div>
        </div>

        {/* ПРАВАЯ ЧАСТЬ: ДИНАМИЧЕСКИЕ КНОПКИ */}
        <div className="flex flex-wrap items-center gap-3">
          {children}

          

          
        </div>
      </header>

      {/* ТЕЛЕГРАМ ВИДЖЕТ */}
      {/* Показываем виджет, если у нас есть ссылка для подключения ИЛИ если бот уже привязан */}
      {/* ТЕЛЕГРАМ ВИДЖЕТ */}
{(tgLink || hasTelegramId) && (
  <section className="mb-10 px-2 animate-in slide-in-from-top-4 duration-500">
    {hasTelegramId ? (
      /* СОСТОЯНИЕ 1: УВЕДОМЛЕНИЯ УСПЕШНО ПОДКЛЮЧЕНЫ И ПОДТВЕРЖДЕНЫ В БД */
      <div >
        
        </div>


    ) : (
      /* ЕСЛИ В БД ЕЩЕ НЕТ ID, ВЫБИРАЕМ МЕЖДУ КЛИКОМ И СТАНДАРТНЫМ ПРИЗЫВОМ */
      <div className="bg-white border border-slate-100 rounded-[2.5rem] p-6 md:p-8 shadow-xl shadow-slate-200/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 overflow-hidden relative">
        <div className="flex items-start gap-5 max-w-xl">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl shrink-0 animate-pulse mt-1">
            <BellRing size={24} strokeWidth={2.5} />
          </div>
          <div className="space-y-1">
            <h3 className="font-black text-slate-900 text-lg uppercase tracking-tight">
              Включите уведомления в Telegram
            </h3>
            <p className="text-xs text-slate-400 font-medium leading-relaxed">
              Подключите official-бота WOPP, чтобы мгновенно получать подтверждения, напоминания о визитах за 24 часа и оперативно связываться с мастерами.
            </p>
          </div>
        </div>

        <div className="w-full md:w-auto shrink-0">
          {isTgClicked ? (
            /* СОСТОЯНИЕ 2: ПОЛЬЗОВАТЕЛЬ НАЖАЛ, НО БЭКЕНД ЕЩЕ НЕ ПОЛУЧИЛ WEBHOOK ОТ ТГ */
            <div className="w-full md:w-auto bg-emerald-50 border border-emerald-100 text-emerald-700 py-4 px-6 rounded-2xl font-black text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 animate-in zoom-in-95">
              <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
              Нажмите «Старт» в боте
            </div>
          ) : (
            /* СОСТОЯНИЕ 3: ПЕРВИЧНЫЙ ПРИЗЫВ К ДЕЙСТВИЮ */
            <a
              href={tgLink || "#"}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsTgClicked(true)}
              className="w-full md:w-auto inline-flex bg-[#24A1DE] text-white py-4 px-8 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-500/10 hover:bg-[#208bbf] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
            >
              <Send size={14} fill="currentColor" />
              Подключить бот
            </a>
          )}
        </div>
      </div>
    )}
  </section>
)}
    </div>
  );
}