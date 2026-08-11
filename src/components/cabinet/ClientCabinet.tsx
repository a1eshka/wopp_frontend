"use client";
import { useEffect, useState } from "react";
import {
  Calendar, Clock, User, CheckCircle2, XCircle,
  ChevronRight, LogOut, PlusCircle, LayoutDashboard, Phone,
  Building2, Scissors, MapPin, Send, BellRing, Star, Settings,
  
} from "lucide-react";
import { useRouter } from "next/navigation";
import { enqueueSnackbar } from "notistack";
import Link from "next/link";

export interface AppointmentReview {
  rating: number;
  comment?: string | null;
  organization_reply?: string | null;
}

interface Appointment {
  id: string;
  start_time: string;
  services_names: string[];
  specialist_name: string;
  specialist_id: string;
  organization_name?: string;
  organization_address?: string;
  price: number;
  status: string;
  can_cancel: boolean;
  has_review?: boolean;
  review_data: AppointmentReview | null;
}

interface UserProfile {
  first_name: string;
  username: string;
  phone: string;
  photo_url?: string;
  telegram_id?: string | null;
  telegram_link?: string | null;
}

interface FavoriteSpecialist {
  id: string;
  name: string;
  photo?: string;
  profession: string;
  organization_name: string;
}

interface CabinetData {
  upcoming: Appointment[];
  past: Appointment[];
  is_specialist?: boolean;
  user?: UserProfile;
  favorites: FavoriteSpecialist[];
  telegram_id?: string | null;
  telegram_link?: string | null;
}

export default function ClientCabinet() {
  const router = useRouter();
  const [data, setData] = useState<CabinetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDelayOptions, setShowDelayOptions] = useState(false);
  const [visibleHistory, setVisibleHistory] = useState(5);
  const [isTgClicked, setIsTgClicked] = useState(false);

  // Состояния для интерактивной оценки
  const [activeReviewAppId, setActiveReviewAppId] = useState<string | null>(null);
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [reviewComment, setReviewComment] = useState<string>("");
  const [submittingReview, setSubmittingReview] = useState<boolean>(false);

  const fetchCabinet = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    const headers = { "Authorization": `Bearer ${token}` };

    try {
      const [resCabinet, resMe] = await Promise.all([
        fetch("https://api.wopp.ru/api/booking/my-cabinet", { headers }),
        fetch("https://api.wopp.ru/api/accounts/me", { headers })
      ]);

      if (!resCabinet.ok || !resMe.ok) throw new Error("Ошибка сервера");

      const cabinetJson = await resCabinet.json();
      const meJson = await resMe.json();

      setData({
        ...cabinetJson,
        is_specialist: meJson.is_specialist,
        telegram_id: cabinetJson.telegram_id || meJson.telegram_id,
        telegram_link: cabinetJson.telegram_link || meJson.telegram_link,
        user: {
          first_name: meJson.first_name || "Клиент",
          username: meJson.username,
          phone: meJson.phone,
          photo_url: meJson.photo_url,
          telegram_id: meJson.telegram_id,
          telegram_link: meJson.telegram_link
        }
      });
    } catch (err) {
      console.error("Ошибка загрузки данных", err);
      enqueueSnackbar("Не удалось обновить данные кабинета", { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCabinet();
  }, [router]);

  const handleCancel = async (appId: string) => {
    if (!window.confirm("Вы уверены, что хотите отменить эту запись?")) return;
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`https://api.wopp.ru/api/booking/appointments/${appId}/cancel`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
      });

      if (res.ok) {
        enqueueSnackbar("Запись успешно отменена", { variant: "info" });
        await fetchCabinet();
      } else {
        const errData = await res.json();
        enqueueSnackbar(errData.detail || "Не удалось отменить запись", { variant: "error" });
      }
    } catch (err) {
      enqueueSnackbar("Произошла ошибка при отмене визита", { variant: "error" });
    }
  };

  const handleDelay = async (appId: string, minutes: number) => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`https://api.wopp.ru/api/booking/${appId}/delay`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ minutes })
      });

      if (res.ok) {
        enqueueSnackbar(`Специалист уведомлен о задержке на ${minutes} минут`, { variant: 'success' });
        setShowDelayOptions(false);
      } else {
        const errData = await res.json();
        enqueueSnackbar(errData.detail || "Не удалось отправить уведомление", { variant: 'error' });
      }
    } catch (err) {
      console.error("Ошибка при отправке задержки:", err);
      enqueueSnackbar("Ошибка связи с сервером", { variant: 'error' });
    }
  };

  const handleSubmitReview = async (appId: string, specialistId: string) => {
    if (rating === 0) {
      enqueueSnackbar("Выберите количество звезд перед отправкой", { variant: "warning" });
      return;
    }

    const token = localStorage.getItem("token");
    setSubmittingReview(true);

    try {
      const res = await fetch(`https://api.wopp.ru/api/booking/reviews`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          appointment_id: appId,
          specialist_id: specialistId,
          rating: rating,
          comment: reviewComment
        })
      });

      if (res.ok) {
        enqueueSnackbar("Спасибо за отзыв! Мастер будет счастлив.", { variant: "success" });
        setActiveReviewAppId(null);
        setRating(0);
        setReviewComment("");
        await fetchCabinet();
      } else {
        const errData = await res.json();
        enqueueSnackbar(errData.detail || "Не удалось отправить отзыв", { variant: "error" });
      }
    } catch (err) {
      enqueueSnackbar("Ошибка при отправке отзыва на сервер", { variant: "error" });
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 text-xs tracking-widest">Загрузка...</p>
      </div>
    </div>
  );

  const now = new Date();

  const sortedUpcoming = data?.upcoming
    ?.filter(app => {
      const isActiveStatus = app.status === 'pending' || app.status === 'confirmed';
      const appDate = new Date(app.start_time);
      const diffInHours = (appDate.getTime() - now.getTime()) / (1000 * 60 * 60);
      return isActiveStatus && diffInHours > -1;
    })
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

  const activeAppointment = sortedUpcoming?.[0];

  const isConciergeVisible = activeAppointment && (() => {
    const appDate = new Date(activeAppointment.start_time);
    const diffInHours = (appDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    return diffInHours < 24;
  })();

  const tgLink = data?.telegram_link || data?.user?.telegram_link;
  const hasTelegramId = data?.telegram_id || data?.user?.telegram_id;

return (
  <div className="min-h-screen bg-[#fafafa] text-slate-900 antialiased font-sans p-4 sm:p-6 md:p-10 selection:bg-blue-500/10">
    {/* Сочные размытые акценты на фоне для создания глубины в светлой теме */}
    <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-500/[0.03] rounded-full blur-[120px] pointer-events-none" />
    <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-indigo-500/[0.03] rounded-full blur-[120px] pointer-events-none" />

    <div className="max-w-4xl mx-auto space-y-10 relative z-10">

      {/* ХЕДЕР */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-8 border-b border-slate-200">
        <div className="flex items-center gap-5">
          <div className="relative shrink-0">
            <div className="w-18 h-18 rounded-full bg-slate-100 ring-2 ring-slate-200 overflow-hidden flex items-center justify-center text-slate-400 shadow-sm">
              {data?.user?.photo_url ? (
                <img src={data.user.photo_url} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <User size={28} strokeWidth={2} className="text-slate-500" />
              )}
            </div>
            <div className={`absolute bottom-0 right-0 w-4.5 h-4.5 rounded-full border-4 border-[#fafafa] ${hasTelegramId ? 'bg-emerald-500' : 'bg-amber-400'}`}></div>
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              {data?.user?.first_name}
            </h1>
            <p className="text-sm text-slate-500 font-medium mt-1">{data?.user?.phone}</p>
          </div>
        </div>

        {/* Стандартизированные по размеру кнопки управления */}
<div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
  {data?.is_specialist ? (
    <button
      onClick={() => router.push("/dashboard")}
      className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-900 px-5 py-3.5 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all shadow-sm active:scale-[0.97] cursor-pointer"
    >
      <LayoutDashboard size={18} className="text-blue-600" />
      Панель управления
    </button>
  ) : (
    <button
      onClick={() => router.push("/create-org")}
      className="w-full sm:w-auto flex items-center justify-center gap-2 bg-slate-950 text-white px-5 py-3.5 rounded-xl text-sm font-bold hover:bg-slate-900 transition-all shadow-[0_4px_20px_rgba(0,0,0,0.08)] active:scale-[0.97] cursor-pointer"
    >
      <PlusCircle size={18} />
      Создать бизнес
    </button>
  )}

  {/* Кнопка настроек — на мобильном во всю ширину с текстом, на десктопе компактная */}
  <button
    onClick={() => router.push("/cabinet/settings")}
    className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3.5 bg-white border border-slate-200 rounded-xl text-slate-700 font-bold text-sm hover:bg-slate-50 hover:text-slate-900 transition-all shadow-sm active:scale-[0.97] cursor-pointer"
  >
    <Settings size={18} className="text-slate-400 group-hover:text-slate-600" />
    <span className="sm:hidden">Настройки профиля</span>
  </button>

  {/* Кнопка выхода — на мобильном во всю ширину с текстом, на десктопе компактная */}
  <Link
    href="/logout"
    className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3.5 bg-white border border-slate-200 rounded-xl text-slate-500 font-bold text-sm hover:text-red-600 hover:border-red-200 hover:bg-red-50/50 transition-all shadow-sm active:scale-[0.97]"
  >
    <LogOut size={18} className="text-slate-400 group-hover:text-red-500" />
    <span className="sm:hidden">Выйти из аккаунта</span>
  </Link>
</div>
      </header>

      {/* ТЕЛЕГРАМ ВИДЖЕТ */}
      {(tgLink || hasTelegramId) && (
        <section className="animate-in fade-in duration-300">
          {hasTelegramId ? (
            <div className="bg-emerald-500/[0.02] border border-emerald-500/20 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
                  <CheckCircle2 size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Уведомления в Telegram активны</h3>
                  <p className="text-sm text-slate-500 mt-0.5">Бот WOPP присылает напоминания о ваших визитах.</p>
                </div>
              </div>
              <div className="inline-flex items-center bg-emerald-50 border border-emerald-200/60 text-emerald-700 py-2 px-4 rounded-xl font-bold text-xs gap-2 w-full sm:w-auto justify-center sm:justify-start">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Подключено
              </div>
            </div>
          ) : (
            <div className="relative bg-white border border-blue-200 rounded-2xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.02)] flex flex-col md:flex-row items-start md:items-center justify-between gap-5 overflow-hidden">
              <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-blue-500/[0.02] rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-start gap-4 max-w-xl relative z-10">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl shrink-0 mt-0.5">
                  <BellRing size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base sm:text-lg">Включите уведомления в Telegram</h3>
                  <p className="text-sm text-slate-500 mt-1">Подключите бота WOPP, чтобы мгновенно получать подтверждения и напоминания о визитах за 24 часа.</p>
                </div>
              </div>
              <div className="w-full md:w-auto shrink-0 relative z-10">
                {isTgClicked ? (
                  <div className="w-full bg-slate-50 border border-slate-200 text-slate-600 py-3.5 px-6 rounded-xl font-bold text-sm flex items-center justify-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-500" />
                    Нажмите «Старт» в боте
                  </div>
                ) : (
                  <a
                    href={tgLink || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setIsTgClicked(true)}
                    className="w-full inline-flex bg-[#24A1DE] text-white py-3.5 px-6 rounded-xl font-bold text-sm hover:bg-[#208bbf] transition-all items-center justify-center gap-2 cursor-pointer whitespace-nowrap shadow-[0_4px_15px_rgba(36,161,222,0.25)] active:scale-[0.97]"
                  >
                    <Send size={14} fill="currentColor" />
                    Подключить бота
                  </a>
                )}
              </div>
            </div>
          )}
        </section>
      )}

      {/* КОНСЬЕРЖ БЛИЖАЙШЕГО ВИЗИТА (Сочный светлый премиум-блок) */}
      {isConciergeVisible && activeAppointment && (
        <section className="animate-in fade-in zoom-in-98 duration-500">
          <div className="relative bg-gradient-to-br from-white via-[#fbfcfe] to-[#f5f8ff] rounded-2xl p-6 sm:p-8 shadow-[0_12px_40px_rgba(37,99,235,0.06)] border border-blue-100 overflow-hidden text-slate-900">
            {/* Мягкий сочный блик на фоне */}
            <div className="absolute -top-20 -right-20 w-[350px] h-[350px] bg-blue-500/[0.04] rounded-full blur-[80px] pointer-events-none" />

            <div className="relative z-10 space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-4 border-b border-slate-100">
                <div className="flex gap-4 items-center">
                  {/* Контрастный синий блок даты */}
                  <div className="bg-blue-600 text-white rounded-xl p-3 flex flex-col items-center min-w-[64px] shadow-[0_4px_15px_rgba(37,99,235,0.25)]">
                    <span className="text-[11px] font-bold uppercase tracking-widest opacity-90">
                      {new Date(activeAppointment.start_time).toLocaleDateString('ru-RU', { month: 'short' }).replace('.', '')}
                    </span>
                    <span className="text-3xl font-extrabold tracking-tight mt-0.5">
                      {new Date(activeAppointment.start_time).getDate()}
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-xs font-bold uppercase text-blue-600 tracking-wider">Ближайший визит</span>
                    </div>
                    <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                      {activeAppointment.organization_name}
                    </h2>
                    <p className="text-sm text-slate-500 font-medium mt-1 flex items-center gap-1.5">
                      <MapPin size={14} className="text-slate-400" />
                      {activeAppointment.organization_address || "Адрес уточняется"}
                    </p>
                  </div>
                </div>

                <div className="sm:text-right bg-slate-50 sm:bg-transparent p-3 sm:p-0 rounded-xl w-full sm:w-auto flex sm:flex-col justify-between items-center sm:items-end border border-slate-100 sm:border-0">
                  <p className="text-xs font-bold uppercase text-slate-400 tracking-wider">Время начала</p>
                  <p className="text-2xl font-extrabold tracking-tight text-blue-600 sm:text-3xl sm:mt-1">
                    {new Date(activeAppointment.start_time).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>

              {/* Детали услуги */}
              <div className="bg-white border border-slate-200/80 rounded-xl p-5 flex justify-between items-center shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center border border-blue-100 shadow-inner">
                    <Scissors size={20} />
                  </div>
                  <div>
                    <p className="text-base font-bold text-slate-900 leading-tight">
                      {activeAppointment.services_names?.join(', ') || "Услуга"}
                    </p>
                    <p className="text-sm text-slate-500 mt-1">
                      Мастер: <span className="text-slate-800 font-semibold">{activeAppointment.specialist_name}</span>
                    </p>
                  </div>
                </div>
                <p className="text-xl font-extrabold text-slate-900 whitespace-nowrap ml-4">{activeAppointment.price} ₽</p>
              </div>

              {/* Крупные, унифицированные по размеру кнопки */}
              <div className="flex flex-col gap-3 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                  <button
                    onClick={() => {
                      const location = activeAppointment.organization_address || activeAppointment.organization_name;
                      const query = encodeURIComponent(location || "");
                      window.open(`https://yandex.ru/maps/?text=${query}`, '_blank');
                    }}
                    className="w-full bg-slate-950 text-white py-4 px-5 rounded-xl font-bold text-sm transition-all hover:bg-slate-900 active:scale-[0.97] cursor-pointer text-center shadow-sm"
                  >
                    Построить маршрут
                  </button>

                  <button
                    onClick={() => setShowDelayOptions(!showDelayOptions)}
                    className={`w-full py-4 px-5 rounded-xl font-bold text-sm border transition-all active:scale-[0.97] flex items-center justify-center gap-2 cursor-pointer ${
                      showDelayOptions
                        ? 'bg-orange-500 text-white border-orange-400 shadow-[0_4px_15px_rgba(249,115,22,0.2)]'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 shadow-sm'
                    }`}
                  >
                    <Clock size={16} />
                    {showDelayOptions ? 'Отменить выбор' : 'Я задержусь'}
                  </button>
                </div>

                {showDelayOptions && (
                  <div className="grid grid-cols-3 gap-2.5 w-full animate-in slide-in-from-top-3 duration-200">
                    {[5, 10, 15].map((mins) => (
                      <button
                        key={mins}
                        onClick={() => handleDelay(activeAppointment.id, mins)}
                        className="bg-white hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 border border-slate-200 py-3.5 px-4 rounded-xl text-sm text-slate-800 font-bold transition-all cursor-pointer text-center shadow-sm"
                      >
                        +{mins} мин
                      </button>
                    ))}
                  </div>
                )}

                <button className="w-full bg-white text-slate-700 py-4 px-5 rounded-xl font-bold text-sm border border-slate-200 hover:bg-slate-50 transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer">
                  <Phone size={16} className="text-slate-400" />
                  Связаться с организацией
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ВАШИ МАСТЕРА */}
      {data?.favorites && data.favorites.length > 0 && (
      <section>
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-5 px-1">
          Ваши мастера
        </h2>
        <div className="flex gap-5 overflow-x-auto pb-3 pt-1 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-none snap-x">
          {/*
          <div
            className="flex flex-col items-center gap-3 shrink-0 group cursor-pointer w-20 snap-start"
            onClick={() => router.push('/search')}
          >
            <div className="w-16 h-16 rounded-full bg-white border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 group-hover:border-blue-500 group-hover:text-blue-600 transition-all shadow-sm">
              <PlusCircle size={22} strokeWidth={1.5} />
            </div>
            <p className="text-xs text-slate-500 font-bold text-center leading-tight">
              Найти
            </p>
          </div>
              */}
          {data?.favorites && data.favorites.length > 0 ? (
            data.favorites.map((master) => (
              <div
                key={master.id}
                className="flex flex-col items-center gap-3 shrink-0 group cursor-pointer w-22 snap-start"
                onClick={() => router.push(`/booking/${master.id}`)}
              >
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-slate-200 group-hover:border-blue-500 transition-all shadow-sm shrink-0">
                  {master.photo ? (
                    <img src={master.photo} alt={master.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-700 font-bold text-base">
                      {master.name[0]}
                    </div>
                  )}
                </div>

                <div className="text-center w-full">
                  <p className="text-xs font-bold text-slate-900 truncate leading-tight group-hover:text-blue-600 transition-colors">
                    {master.name}
                  </p>
                  <p className="text-[11px] text-slate-400 truncate mt-1">
                    {master.organization_name}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="flex items-center px-5 py-4 bg-white rounded-2xl border border-slate-200 text-slate-400 text-sm w-full shadow-sm">
              Список мастеров пуст
            </div>
          )}
        </div>
      </section>
      )}

      {/* ПРЕДСТОЯЩИЕ ВИЗИТЫ */}
      <section>
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-5 px-1">
          Предстоящие визиты
        </h2>
        <div className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100 overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.01)]">
          {data?.upcoming.length === 0 ? (
            <div className="p-10 text-center ">
              <p className="text-slate-400 text-base font-medium">У вас пока нет активных записей</p>
            </div>
          ) : (
            [...data.upcoming]
              .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
              .map((app) => (
                <div
                  key={app.id}
                  className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5 hover:bg-slate-50/50 transition-colors group"
                >
                  <div className="flex items-center gap-4 w-full sm:w-auto">
                    {/* Календарная дата в таблице */}
                    <div className="bg-slate-50 text-slate-700 w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0 border border-slate-200 font-sans text-xs shadow-sm">
                      <span className="text-[9px] uppercase font-bold text-slate-400 leading-none mb-0.5">
                        {new Date(app.start_time).toLocaleString('ru-RU', { month: 'short' }).replace('.', '')}
                      </span>
                      <span className="font-extrabold text-slate-900 text-base leading-none">
                        {new Date(app.start_time).getDate()}
                      </span>
                    </div>

                    <div className="truncate grow">
                      <div className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-wider">
                        <Building2 size={12} />
                        <span className="truncate">{app.organization_name}</span>
                      </div>
                      <h3 className="text-base font-bold text-slate-900 mt-1 group-hover:text-blue-600 transition-colors truncate">
                        {app.services_names?.join(', ')}
                      </h3>
                      <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-slate-500">
                        <span className="flex items-center gap-1.5"><User size={14} className="text-slate-400" /> {app.specialist_name}</span>
                        <span className="flex items-center gap-1.5 font-semibold text-blue-600"><Clock size={14} className="text-blue-400" /> {new Date(app.start_time).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto pt-4 sm:pt-0 border-t sm:border-0 border-slate-100">
                    <div className="text-lg font-extrabold text-slate-900">{app.price} ₽</div>
                    {app.can_cancel && (
                      <button
                        onClick={() => handleCancel(app.id)}
                        className="text-xs font-bold text-slate-400 hover:text-red-600 py-2 sm:py-0 sm:mt-1.5 transition-colors cursor-pointer"
                      >
                        Отменить запись
                      </button>
                    )}
                  </div>
                </div>
              ))
          )}
        </div>
      </section>

      {/* ИСТОРИЯ ВИЗИТОВ */}
      <section className="pb-16">
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-5 px-1">
          История визитов
        </h2>
        <div className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100 overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.01)]">
          {data?.past.slice(0, visibleHistory).map((app) => {
            const isReviewOpen = activeReviewAppId === app.id;

            return (
              <div key={app.id} className="p-5 flex flex-col gap-4 hover:bg-slate-50/30 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0 shadow-sm">
                      <Calendar size={18} className="text-slate-500" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-base font-bold text-slate-900">{app.services_names?.join(', ')}</h4>
                        <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-mono border border-slate-200">
                          {new Date(app.start_time).toLocaleDateString('ru-RU')}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500 mt-1">Мастер: <span className="text-slate-800 font-medium">{app.specialist_name}</span></p>
                      <div className="flex items-center text-slate-500 gap-2 text-xs tracking-wider">
                        
                        <span className="truncate">{app.organization_name}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 pt-3 sm:pt-0 border-t sm:border-0 border-slate-100">
                    <div className="sm:text-right">
                      <p className="text-base font-extrabold text-slate-900">{app.price} ₽</p>
                    </div>

                    <div className="flex items-center gap-2">
                      {!app.has_review && !isReviewOpen && (
                        <button
                          onClick={() => {
                            setActiveReviewAppId(app.id);
                            setRating(0);
                            setReviewComment("");
                          }}
                          className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                        >
                          <Star size={14} className="text-amber-500" />
                          Оценить
                        </button>
                      )}

                      {app.has_review && app.review_data && (
                        <div className="flex items-center gap-1 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 shadow-sm">
                          <Star size={14} fill="#EAB308" className="text-amber-500" />
                          <span className="text-xs font-bold text-slate-800">{app.review_data.rating}</span>
                        </div>
                      )}
                      {/*
                      <button
                        onClick={() => router.push(`/booking?repeat=${app.id}`)}
                        className="bg-white border border-slate-200 text-slate-800 px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-slate-950 hover:text-white hover:border-slate-950 transition-all cursor-pointer shadow-sm"
                      >
                        Повторить
                      </button>
                      */}
                    </div>
                  </div>
                </div>

                {/* ОТВЕТ ОРГАНИЗАЦИИ */}
                {app.has_review && app.review_data?.organization_reply && (
                  <div className="bg-slate-50 border-l-2 border-slate-400 rounded-r-xl p-4 text-left sm:ml-15">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Ответ {app.organization_name}
                    </p>
                    <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
                      {app.review_data.organization_reply}
                    </p>
                  </div>
                )}

                {/* АККОРДЕОН ОТЗЫВА */}
                {isReviewOpen && (
                  <div className="bg-slate-50 rounded-xl p-4 sm:ml-15 border border-slate-200 space-y-4 animate-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-800">Ваша оценка мастера {app.specialist_name}:</p>
                      <button onClick={() => setActiveReviewAppId(null)} className="text-xs text-slate-400 hover:text-slate-600 underline cursor-pointer">Отмена</button>
                    </div>

                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          className="text-slate-300 transition-transform active:scale-90 cursor-pointer p-1"
                        >
                          <Star
                            size={24}
                            fill={(hoverRating || rating) >= star ? "#EAB308" : "none"}
                            stroke={(hoverRating || rating) >= star ? "#EAB308" : "currentColor"}
                          />
                        </button>
                      ))}
                    </div>

                    <div className="space-y-3">
                      <textarea
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        placeholder="Что понравилось или чего не хватило?..."
                        className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm text-slate-900 focus:outline-none focus:border-slate-400 placeholder-slate-400 shadow-inner resize-none h-20"
                      />
                      <button
                        disabled={submittingReview}
                        onClick={() => handleSubmitReview(app.id, app.specialist_id)}
                        className="w-full sm:w-auto bg-slate-950 text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-slate-900 active:scale-[0.97] transition-all disabled:opacity-50 cursor-pointer shadow-sm"
                      >
                        {submittingReview ? "Отправка..." : "Отправить отзыв"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {data?.past && data.past.length > visibleHistory && (
          <div className="mt-6 flex justify-center">
            <button
              onClick={() => setVisibleHistory(prev => prev + 5)}
              className="flex items-center justify-center gap-1 w-full sm:w-auto px-6 py-3.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-500 hover:text-slate-900 hover:border-slate-300 transition-all shadow-sm cursor-pointer"
            >
              Показать еще записи
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </section>
    </div>
  </div>
);
}