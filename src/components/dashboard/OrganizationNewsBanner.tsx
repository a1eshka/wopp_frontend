'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
    Gift,
    Info,
    Wrench,
    Rocket,
    X,
    ExternalLink,
    Copy,
    Check,
    Tag
} from 'lucide-react';
import { useOrganizationNews, useMarkNewsAsRead, NewsItem } from '@/app/api/hooks';
import { enqueueSnackbar } from 'notistack';

export const OrganizationNewsBanner: React.FC = () => {
    const { data: newsList, isLoading } = useOrganizationNews();
    const markAsReadMutation = useMarkNewsAsRead();
    const [copiedCode, setCopiedCode] = useState<string | null>(null);

    const handleMarkAsRead = (id: number) => {
        markAsReadMutation.mutate(id);
    };

    const handleCopyPromocode = (code: string) => {
        navigator.clipboard.writeText(code);
        setCopiedCode(code);
        setTimeout(() => setCopiedCode(null), 2000);
        enqueueSnackbar('Промокод скопирован.', { variant: 'info', autoHideDuration: 1000 });
    };

    const activeUnreadNews = newsList?.filter((item) => !item.is_read) || [];

    if (isLoading || activeUnreadNews.length === 0) {
        return null;
    }

    const getTypeConfig = (type: NewsItem['news_type']) => {
        switch (type) {
            case 'promo':
            case 'promocode':
                return {
                    bg: 'bg-gradient-to-r from-amber-500 to-orange-500',
                    shadow: 'shadow-orange-100',
                    icon: <Gift size={22} className="text-white" />,
                    btnText: 'text-orange-600 hover:bg-orange-50',
                };
            case 'maintenance':
                return {
                    bg: 'bg-gradient-to-r from-slate-700 to-slate-800',
                    shadow: 'shadow-slate-200',
                    icon: <Wrench size={22} className="text-white" />,
                    btnText: 'text-slate-800 hover:bg-slate-100',
                };
            case 'update':
                return {
                    bg: 'bg-gradient-to-r from-blue-600 to-indigo-600',
                    shadow: 'shadow-blue-100',
                    icon: <Rocket size={22} className="text-white" />,
                    btnText: 'text-blue-600 hover:bg-blue-50',
                };
            case 'info':
            default:
                return {
                    bg: 'bg-gradient-to-r from-emerald-600 to-teal-500',
                    shadow: 'shadow-emerald-100',
                    icon: <Info size={22} className="text-white" />,
                    btnText: 'text-emerald-600 hover:bg-emerald-50',
                };
        }
    };

    return (
        <div className="space-y-3">
            {activeUnreadNews.map((item) => {
                const config = getTypeConfig(item.news_type);

                return (
                    <div
                        key={item.id}
                        className={`p-4 ${config.bg} text-white shadow-lg ${config.shadow} rounded-none flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-300 relative group`}
                    >
                        {/* Текст и иконка слева, внутри сохранены rounded у элементов */}
                        <div className="flex items-start md:items-center gap-3 pr-8 md:pr-0">
                            <div className="p-2.5 bg-white/10 backdrop-blur-md shrink-0 rounded-xl">
                                {config.icon}
                            </div>
                            <div className="space-y-0.5">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h4 className="font-bold text-sm leading-snug">{item.title}</h4>
                                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 bg-white/20 rounded-md backdrop-blur-sm">
                                        {item.news_type_display}
                                    </span>
                                </div>
                                <p className="text-xs text-white/90 leading-relaxed max-w-2xl">
                                    {item.content}
                                </p>
                            </div>
                        </div>

                        {/* Промокод, Кнопка действия и Кнопка закрытия (со скруглениями) */}
                        <div className="flex items-center gap-2 self-stretch md:self-auto shrink-0 flex-wrap sm:flex-nowrap">
                            {item.promocode && (
                                <button
                                    type="button"
                                    onClick={() => handleCopyPromocode(item.promocode!)}
                                    className="flex items-center gap-1.5 px-3.5 py-2 bg-white/15 hover:bg-white/25 border border-white/20 text-white text-xs font-mono font-bold rounded-xl transition-all active:scale-95 cursor-pointer"
                                    title="Скопировать промокод"
                                >
                                    <Tag size={14} />
                                    <span>{item.promocode}</span>
                                    {copiedCode === item.promocode ? (
                                        <Check size={14} className="text-emerald-300 ml-1" />
                                    ) : (
                                        <Copy size={14} className="opacity-70 ml-1" />
                                    )}
                                </button>
                            )}

                            {item.action_url && (
                                <Link
                                    href={item.action_url}
                                    scroll={false}
                                    className={`px-4 py-2 bg-white ${config.btnText} text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-sm active:scale-95 whitespace-nowrap text-center cursor-pointer flex-1 md:flex-initial flex items-center justify-center gap-1.5`}
                                >
                                    <span>{item.action_text || 'Подробнее'}</span>
                                    <ExternalLink size={14} />
                                </Link>
                            )}

                            {/* Крестик закрытия */}
                            <button
                                type="button"
                                onClick={() => handleMarkAsRead(item.id)}
                                className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer absolute right-2 top-2 md:relative md:right-0 md:top-0"
                                aria-label="Закрыть новость"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};