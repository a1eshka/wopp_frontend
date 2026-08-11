'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';

export interface SubscriptionInfo {
  is_active: boolean;
  current_plan: string;
}

interface SubscriptionBannerProps {
  subInfo: SubscriptionInfo | null | undefined;
}

export const SubscriptionBanner: React.FC<SubscriptionBannerProps> = ({ subInfo }) => {
  // Не рендерим, если подписки нет или она активна
  if (!subInfo || subInfo.is_active) {
    return null;
  }

  return (
    <div className="p-4 bg-gradient-to-r from-red-600 to-red-500  text-white shadow-lg shadow-rose-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-white/10 backdrop-blur-md shrink-0">
          <ShieldAlert size={22} className="text-white" />
        </div>
        <div>
          <h4 className="font-bold text-sm">
            Подписка «{subInfo.current_plan}» не активна
          </h4>
          <p className="text-xs text-rose-100 mt-0.5">
            Период действия закончился. Онлайн-запись для клиентов приостановлена. Продлите тариф, чтобы восстановить работу WOPP.
          </p>
        </div>
      </div>
      <Link
        href="?tab=tariffs"
        scroll={false}
        className="px-4 py-2 bg-white text-rose-600 hover:bg-rose-50 text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-sm active:scale-95 whitespace-nowrap self-stretch sm:self-auto text-center cursor-pointer shrink-0"
      >
        Продлить
      </Link>
    </div>
  );
};