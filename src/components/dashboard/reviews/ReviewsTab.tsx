"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, Star, MessageSquare, User, CalendarDays, SlidersHorizontal, ChevronDown, Award, CornerDownRight, Reply, Send, X, Lock } from "lucide-react";
import { useReviews, useReplyToReview, ReviewData } from "@/app/api/hooks"; 

type RatingFilter = "all" | "5" | "4" | "3" | "2-1";

interface ExtendedReviewData extends ReviewData {
  reply_text?: string;
  reply_created_at?: string;
}

interface ReviewsTabProps {
  subscription?: {
    plan_id: number;
    [key: string]: any;
  } | null;
  onUpgrade?: () => void;
}

const formatReviewDate = (dateString: string) => {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric" }).format(date);
  } catch (e) {
    return dateString;
  }
};

export default function ReviewsTab({ subscription, onUpgrade }: ReviewsTabProps) {
  const router = useRouter();
  const { data: reviews = [], isLoading } = useReviews("all");
  const { mutateAsync: replyToReview, isPending: isReplying } = useReplyToReview();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [ratingFilter, setRatingFilter] = useState<RatingFilter>("all");
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);

  const [activeReplyReviewId, setActiveReplyReviewId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  // ПРОВЕРКА ТАРИФА: plan_id === 1 (Базовый)
  const isBasicPlan = subscription?.plan_id === 1;

  // Клик по заблокированной кнопке ответа -> редирект / открытие тарифов
  const handleDisabledReplyClick = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      router.push("?tab=tariffs");
    }
  };

  const stats = useMemo(() => {
    if (!reviews.length) return { average: 0, total: 0 };
    const sum = reviews.reduce((acc: number, r: ExtendedReviewData) => acc + r.rating, 0);
    return {
      average: Math.round((sum / reviews.length) * 10) / 10,
      total: reviews.length,
    };
  }, [reviews]);

  const filteredReviews = useMemo(() => {
    return (reviews as ExtendedReviewData[]).filter((r: ExtendedReviewData) => {
      const matchesSearch = 
        r.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.specialist_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.comment && r.comment.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (r.reply_text && r.reply_text.toLowerCase().includes(searchTerm.toLowerCase()));

      const rating = r.rating;
      let matchesRating = true;
      if (ratingFilter === "5") matchesRating = rating === 5;
      else if (ratingFilter === "4") matchesRating = rating === 4;
      else if (ratingFilter === "3") matchesRating = rating === 3;
      else if (ratingFilter === "2-1") matchesRating = rating <= 2;

      return matchesSearch && matchesRating;
    });
  }, [reviews, searchTerm, ratingFilter]);

  const handleSendReply = async (reviewId: string) => {
    if (!replyText.trim() || isBasicPlan) return;
    try {
      await replyToReview({ reviewId, reply_text: replyText });
      setReplyText("");
      setActiveReplyReviewId(null);
    } catch (err) {
      // Ошибка
    }
  };

  const filterLabels: Record<RatingFilter, string> = {
    "all": "Все оценки",
    "5": "Только 5 ★",
    "4": "Только 4 ★",
    "3": "Только 3 ★",
    "2-1": "Критические (≤ 2 ★)",
  };

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse w-full">
        <div className="h-24 bg-slate-100 rounded-3xl w-full" />
        <div className="h-12 bg-slate-100 rounded-2xl w-full" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-6 bg-white rounded-2xl border border-slate-100 space-y-3">
            <div className="flex justify-between">
              <div className="h-4 bg-slate-100 rounded w-1/4" />
              <div className="h-4 bg-slate-100 rounded w-12" />
            </div>
            <div className="h-3 bg-slate-100 rounded w-full" />
            <div className="h-3 bg-slate-100 rounded w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full">
      
      {/* ВЕРХНЯЯ ПАНЕЛЬ С СТАТИСТИКОЙ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-6 bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl text-white shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center shrink-0 backdrop-blur-md">
            <Award className="text-amber-400" size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Средний рейтинг</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black tracking-tight">{stats.average}</span>
              <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={14} className={i < Math.round(stats.average) ? "fill-amber-400" : "opacity-30"} />
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 border-t sm:border-t-0 sm:border-l border-white/10 pt-4 sm:pt-0 sm:pl-6">
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center shrink-0 backdrop-blur-md">
            <MessageSquare className="text-blue-400" size={22} />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Всего отзывов</p>
            <span className="text-2xl font-bold tracking-tight">{stats.total} шт.</span>
          </div>
        </div>
      </div>

      {/* ПОИСК И ФИЛЬТРЫ */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between w-full relative">
        <div className="relative flex-1 flex items-center">
          <Search className="absolute left-4 text-slate-400 pointer-events-none" size={18} />
          <input
            type="text"
            placeholder="Поиск по отзыву, клиенту или мастеру..."
            className="w-full pl-12 pr-28 py-3.5 bg-slate-50/50 hover:bg-slate-50 focus:bg-white rounded-2xl border border-slate-200/60 focus:border-slate-300 focus:outline-none focus:ring-4 focus:ring-slate-100 transition-all duration-300 text-sm placeholder:text-slate-400 font-medium text-slate-800"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="absolute right-3 flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200/60 rounded-xl shadow-sm text-[10px] font-bold text-slate-500 pointer-events-none select-none">
            <span className="tabular-nums">Найдено: {filteredReviews.length}</span>
          </div>
        </div>
        
        <div className="relative shrink-0">
          <button 
            onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
            className="flex items-center justify-center gap-2 px-6 py-3.5 bg-white border border-slate-200/80 rounded-2xl text-xs font-bold uppercase tracking-wider text-slate-600 hover:text-slate-900 hover:border-slate-300 transition-all active:scale-95 w-full sm:w-auto"
          >
            <SlidersHorizontal size={14} className={ratingFilter !== "all" ? "text-blue-500" : "text-slate-600"} />
            <span>{filterLabels[ratingFilter]}</span>
            <ChevronDown size={14} className={`text-slate-400 ml-1 transition-transform duration-200 ${isFilterMenuOpen ? "rotate-180" : ""}`} />
          </button>

          {isFilterMenuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setIsFilterMenuOpen(false)} />
              <div className="absolute right-0 mt-2 w-full sm:w-64 bg-white border border-slate-100 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.06)] py-2 z-20 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-4 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Фильтр по оценке</div>
                <hr className="my-1 border-slate-100" />
                {(["all", "5", "4", "3", "2-1"] as RatingFilter[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => { setRatingFilter(type); setIsFilterMenuOpen(false); }}
                    className={`w-full text-left px-4 py-3 text-xs font-medium block transition-colors ${ratingFilter === type ? "bg-blue-50/50 text-blue-600 font-bold" : "text-slate-600 hover:bg-slate-50/60 hover:text-slate-900"}`}
                  >
                    {filterLabels[type]}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* СПИСОК ОТЗЫВОВ */}
      <div className="space-y-4 w-full">
        {filteredReviews.length === 0 ? (
          <div className="text-center py-20 bg-slate-50/40 rounded-3xl border border-dashed border-slate-200/60 w-full">
            <p className="text-sm text-slate-400 font-medium">Отзывов не найдено</p>
          </div>
        ) : (
          filteredReviews.map((review: ExtendedReviewData) => (
            <div key={review.id} className="p-5 sm:p-6 bg-white rounded-2xl border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.01)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.02)] transition-all flex flex-col gap-4 w-full">
              
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                    <User size={16} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800 text-sm tracking-tight">{review.client_name}</h4>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
                      <CalendarDays size={12} />
                      <span>{formatReviewDate(review.created_at)}</span>
                    </div>
                  </div>
                </div>

                <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl font-bold text-xs ${
                  review.rating >= 4 ? "bg-amber-50 text-amber-700 border border-amber-100" : "bg-rose-50 text-rose-700 border border-rose-100"
                }`}>
                  <Star size={12} className={review.rating >= 4 ? "fill-amber-400 text-amber-500" : "fill-rose-400 text-rose-500"} />
                  <span>{review.rating}</span>
                </div>
              </div>

              {review.comment ? (
                <p className="text-slate-600 text-sm leading-relaxed font-medium bg-slate-50/40 p-3.5 rounded-xl border border-slate-100/60">
                  «{review.comment}»
                </p>
              ) : (
                <p className="text-slate-400 text-xs italic">Клиент оставил только оценку без текстового отзыва.</p>
              )}

              {review.reply_text && (
                <div className="flex gap-3 bg-slate-50 rounded-xl p-4 border border-slate-100/80 ml-4 sm:ml-6 relative">
                  <CornerDownRight className="text-slate-400 shrink-0 mt-0.5" size={16} />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-800">Ответ организации</span>
                      {review.reply_created_at && (
                        <span className="text-[10px] text-slate-400 font-medium">{formatReviewDate(review.reply_created_at)}</span>
                      )}
                    </div>
                    <p className="text-slate-600 text-sm leading-relaxed font-medium">
                      {review.reply_text}
                    </p>
                  </div>
                </div>
              )}

              {/* НИЖНЯЯ ЧАСТЬ КАРТОЧКИ */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-t border-slate-50 pt-3.5 mt-1 gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Мастер:</span>
                  <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-blue-50/50 border border-blue-100/40 text-blue-700 font-semibold text-xs rounded-xl">
                    {review.specialist_avatar ? (
                      <img 
                        src={review.specialist_avatar} 
                        alt={review.specialist_name} 
                        className="w-4 h-4 rounded-full object-cover shrink-0 border border-blue-200"
                      />
                    ) : (
                      <div className="w-4 h-4 rounded-full bg-blue-100 text-[9px] flex items-center justify-center font-bold shrink-0">
                        {review.specialist_name ? review.specialist_name[0].toUpperCase() : "M"}
                      </div>
                    )}
                    <span>{review.specialist_name}</span>
                  </div>
                </div>

                {/* КНОПКА "ОТВЕТИТЬ": СЕРАЯ (СЛОВНО НЕАКТИВНАЯ) С ТУЛТИПОМ И РЕДИРЕКТОМ */}
                {!review.reply_text && activeReplyReviewId !== review.id && (
                  isBasicPlan ? (
                    <div className="relative group self-end sm:self-auto">
                      <div className="absolute bottom-full right-0 mb-2 hidden group-hover:flex flex-col items-end z-30 pointer-events-none">
                        <div className="bg-slate-900 text-white text-[11px] font-medium py-1.5 px-3 rounded-xl shadow-xl whitespace-nowrap border border-slate-800">
                          Повысьте тариф, чтобы отвечать на отзывы
                        </div>
                        <div className="w-2 h-2 bg-slate-900 rotate-45 -mt-1 mr-4" />
                      </div>

                      <button
                        type="button"
                        onClick={handleDisabledReplyClick}
                        className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-100/80 hover:bg-slate-200/80 border border-slate-200/50 text-slate-400 hover:text-slate-600 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-none active:scale-95"
                      >
                        <Lock size={13} className="text-slate-400" />
                        <span>Ответить</span>
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveReplyReviewId(review.id);
                        setReplyText("");
                      }}
                      className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200/80 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-800 transition-colors self-end sm:self-auto cursor-pointer"
                    >
                      <Reply size={13} />
                      <span>Ответить</span>
                    </button>
                  )
                )}
              </div>

              {!isBasicPlan && activeReplyReviewId === review.id && (
                <div className="mt-2 p-4 bg-slate-50 border border-slate-200/60 rounded-xl space-y-3 animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">Ваш ответ от имени компании:</span>
                    <button 
                      onClick={() => setActiveReplyReviewId(null)}
                      className="text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <div className="relative">
                    <textarea
                      rows={3}
                      maxLength={1000}
                      placeholder="Напишите слова благодарности или разберитесь в спорной ситуации..."
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:border-slate-300 focus:outline-none focus:ring-4 focus:ring-slate-100 transition-all text-sm font-medium text-slate-700 placeholder:text-slate-400"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setActiveReplyReviewId(null)}
                      className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 transition-colors"
                    >
                      Отмена
                    </button>
                    <button
                      disabled={!replyText.trim() || isReplying}
                      onClick={() => handleSendReply(review.id)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-olive-800 hover:bg-olive-900 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer"
                    >
                      {isReplying ? "Отправка..." : "Отправить"}
                      <Send size={12} />
                    </button>
                  </div>
                </div>
              )}

            </div>
          ))
        )}
      </div>
      
    </div>
  );
}