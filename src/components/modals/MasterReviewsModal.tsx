"use client";

import React from 'react';
import { Star, X, MessageSquare, CornerDownRight } from 'lucide-react';
import { useReviewsBooking, ReviewData } from "@/app/api/hooks";

interface Specialist {
    id: string | number;
    display_name?: string;
    rating_avg?: string | number;
    reviews_count?: number;
}

interface MasterReviewsModalProps {
    specialist: Specialist | null;
    isOpen: boolean;
    onClose: () => void;
}

export default function MasterReviewsModal({ specialist, isOpen, onClose }: MasterReviewsModalProps) {
    // Запрос пойдет ТОЛЬКО когда модалка открыта и есть ID мастера
    const { data: reviews = [], isLoading } = useReviewsBooking(
        specialist?.id ? String(specialist.id) : "all",
        { enabled: isOpen && !!specialist?.id }
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            {/* Контейнер модалки */}
            <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl flex flex-col max-h-[85vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                {/* Шапка модалки */}
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                    <div>
                        <h3 className="text-base font-bold text-slate-800">{specialist?.display_name || 'Мастер'}</h3>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <div className="flex items-center text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded text-xs font-bold">
                                <Star size={12} className="fill-amber-500 mr-0.5" />
                                {specialist?.rating_avg ? Number(specialist.rating_avg).toFixed(2) : '0.00'}
                            </div>
                            <span className="text-xs text-slate-400">
                                • {specialist?.reviews_count || 0} отзывов
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-full transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Тело модалки / Список отзывов */}
                <div className="p-4 overflow-y-auto flex-1 space-y-3 bg-slate-50/50">
                    {isLoading ? (
                        <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400 text-sm">
                            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                            <span>Загрузка отзывов...</span>
                        </div>
                    ) : reviews.length === 0 ? (
                        <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
                            <MessageSquare size={28} className="stroke-[1.5]" />
                            <span className="text-sm">У этого мастера пока нет отзывов</span>
                        </div>
                    ) : (
                        reviews.map((review: ReviewData) => (
                            <div key={review.id} className="p-3.5 bg-white border border-slate-100 rounded-xl shadow-sm space-y-2.5">

                                {/* Имя клиента и Дата */}
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-sm font-semibold text-slate-700">{review.client_name}</span>
                                    <span className="text-[11px] text-slate-400">
                                        {new Date(review.created_at).toLocaleDateString('ru-RU')}
                                    </span>
                                </div>

                                {/* Звезды в отзыве */}
                                <div className="flex items-center gap-0.5">
                                    {[...Array(5)].map((_, i) => (
                                        <Star
                                            key={i}
                                            size={12}
                                            className={`${i < review.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`}
                                        />
                                    ))}
                                </div>

                                {/* Текст отзыва */}
                                {review.comment ? (
                                    <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line bg-slate-50/50 p-2.5 rounded-lg border border-slate-100/60">
                                        «{review.comment}»
                                    </p>
                                ) : (
                                    <p className="text-xs text-slate-400 italic">Клиент оставил только оценку</p>
                                )}

                                {/* ОТОБРАЖЕНИЕ ОТВЕТА ОРГАНИЗАЦИИ (Если он присутствует) */}
                                {review.reply_text && (
                                    <div className="flex gap-2 bg-blue-50/40 border border-blue-100/50 rounded-lg p-2.5 ml-3 animate-in fade-in duration-200">
                                        <CornerDownRight className="text-blue-400 shrink-0 mt-0.5" size={13} />
                                        <div className="space-y-0.5">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-[11px] font-bold text-blue-900">Ответ организации</span>
                                                {review.reply_created_at && (
                                                    <span className="text-[9px] text-blue-400 font-medium">
                                                        {new Date(review.reply_created_at).toLocaleDateString('ru-RU')}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-600 leading-relaxed">
                                                {review.reply_text}
                                            </p>
                                        </div>
                                    </div>
                                )}

                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}