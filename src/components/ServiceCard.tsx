"use client";

import React from "react";
import { Scissors, Edit2, Trash2, Clock, Coins } from "lucide-react";

interface ServiceCardProps {
    service: any;
    categoryId: number;
    onEdit: (service: any) => void;
    onDelete: (id: number) => void;
}

export default function ServiceCard({ service: s, categoryId, onEdit, onDelete }: ServiceCardProps) {
    return (
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.015)] flex justify-between items-start group hover:border-slate-200 hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-all duration-200">
            <div className="flex items-start gap-4 overflow-hidden flex-1 pr-2">
                {/* Аватар/Фото услуги */}
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-blue-600 border border-slate-100 overflow-hidden shrink-0 shadow-inner">
                    {s.photo ? (
                        <img src={s.photo} alt={s.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                        <Scissors size={20} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
                    )}
                </div>

                {/* Инфо */}
                <div className="overflow-hidden space-y-1 flex-1">
                    <h3 className="font-bold text-slate-800 text-base leading-snug truncate group-hover:text-blue-600 transition-colors" title={s.name}>
                        {s.name}
                    </h3>
                    {s.description && (
                        <p className="text-xs text-slate-400 line-clamp-1 font-medium">{s.description}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 pt-1">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold font-mono text-slate-600 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-lg">
                            <Clock size={11} className="text-slate-400" /> {s.duration} мин
                        </span>
                        <span className="inline-flex items-center gap-0.5 text-[11px] font-extrabold font-mono text-emerald-700 bg-emerald-50 border border-emerald-100/60 px-2 py-0.5 rounded-lg">
                            {s.price.toLocaleString()} ₽
                        </span>
                    </div>

                    {s.consumables_cost !== null && s.consumables_cost !== undefined && (
                        <p className="text-slate-400 font-semibold text-[11px] flex items-center gap-1 pt-0.5">
                            <Coins size={11} className="text-amber-500/80" /> Расходники: <span className="font-bold text-slate-600 font-mono">{s.consumables_cost} ₽</span>
                        </p>
                    )}
                </div>
            </div>

            {/* Кнопки действий */}
            <div className="flex gap-1 bg-slate-50 p-1 rounded-xl shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={() => onEdit({ ...s, category_id: categoryId })}
                    className="p-2 text-slate-400 rounded-lg hover:bg-white hover:text-blue-600 hover:shadow-sm transition-all"
                >
                    <Edit2 size={13} />
                </button>
                <button
                    onClick={() => onDelete(s.id)}
                    className="p-2 text-slate-400 rounded-lg hover:bg-white hover:text-rose-600 hover:shadow-sm transition-all"
                >
                    <Trash2 size={13} />
                </button>
            </div>
        </div>
    );
}