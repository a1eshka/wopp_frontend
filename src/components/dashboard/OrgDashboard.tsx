"use client";

import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
    Bell, Share2, ShieldAlert, CheckCircle2,
    LogOut, Loader2,
    Menu
} from "lucide-react";
import { enqueueSnackbar } from "notistack";
import dynamic from "next/dynamic";
import Link from "next/link";

// Импортируем хуки API
import {
    useBookings, useServices, useNotifications,
    useUpdateSchedule, useMarkNotificationRead, useConfirmBooking, useUpdateBookingStatus,
    useAdvancedStats, useDashboardInit
} from "@/app/api/hooks";

// Компоненты
import { Sidebar } from "@/components/dashboard/Sidebar";
import ScheduleTab from "@/components/dashboard/masters/ScheduleTab";
import ServicesManager from "@/components/dashboard/ServicesManager";
import OrganizationProfile from "@/components/dashboard/settings/OrganizationProfile";
import ClientsTab from "@/components/dashboard/clients/ClientsTab";
import MastersTab from "@/components/dashboard/masters/MastersTab";
import TariffsTab from "@/components/dashboard/tariffs/TariffsTab";
import { SubscriptionBanner } from "@/components/dashboard/tariffs/SubscriptionBanner";
import { OrganizationNewsBanner } from "@/components/dashboard/OrganizationNewsBanner";

// Динамические импорты для тяжелых вкладок
const CalendarView = dynamic(() => import("@/components/dashboard/CalendarView"));
const AnalyticsTab = dynamic(() => import("@/components/dashboard/analytics/AnalyticsTab"));
const ReviewsTab = dynamic(() => import("@/components/dashboard/reviews/ReviewsTab"));
const OverviewTab = dynamic(() => import("@/components/dashboard/OverviewTab"), {
    ssr: false,
});

export default function OrgDashboardClient() {
    // Флаг монтирования для исключения расхождений SSR и Client
    const [mounted, setMounted] = useState(false);

    const searchParams = useSearchParams();
    const activeTab = searchParams.get("tab") || "overview";
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [period, setPeriod] = useState<'today' | 'week' | 'month'>('today');
    const [analyticsPeriod, setAnalyticsPeriod] = useState<'today' | 'week' | 'month' | 'custom'>('today');
    const [analyticsStartDate, setAnalyticsStartDate] = useState<string>('');
    const [analyticsEndDate, setAnalyticsEndDate] = useState<string>('');
    const [selectedMaster, setSelectedMaster] = useState<any>(null);
    const [showNotifications, setShowNotifications] = useState(false);
    const [scheduleData, setScheduleData] = useState({
        date: new Date().toISOString().split('T')[0],
        start_time: "09:00",
        end_time: "18:00",
        is_working: true,
        mode: 'single' as 'single' | 'weekdays' | '2to2',
        selected_days: [] as number[],
        start_from: new Date().toISOString().split('T')[0]
    });

    const notificationRef = useRef<HTMLDivElement>(null);
    const [calendarDates, setCalendarDates] = useState({ start: '', end: '' });
    const [selectedMasterId, setSelectedMasterId] = useState('all');
    const mainRef = useRef<HTMLElement>(null);

    // Включаем статус "смонтирован" после hydration на клиенте
    useEffect(() => {
        setMounted(true);
    }, []);

    // --- ЕДИНСТВЕННЫЙ ЗАПРОС ПРИ ЗАГРУЗКЕ ---
    const { data: dashboardData, isLoading: initLoading, isError: initError } = useDashboardInit();

    const userProfile = dashboardData?.user;
    const orgInfo = dashboardData?.organization;
    const subInfo = dashboardData?.subscription;
    const currentRole = userProfile?.role;

    // Ленивые хуки (запросы выполняются только при активности соотв. вкладок)
    const { data: bookings = [], refetch: refetchBookings } = useBookings(
        selectedMasterId,
        calendarDates.start,
        calendarDates.end,
        activeTab === "bookings"
    );

    const { data: services = [] } = useServices(
        activeTab === "bookings" || activeTab === "services"
    );

    const { data: advancedData } = useAdvancedStats(
        analyticsPeriod,
        activeTab === "analytics",
        analyticsStartDate,
        analyticsEndDate
    );

    // Сквозные уведомления
    const { data: notifications = [] } = useNotifications();

    // МУТАЦИИ
    const { mutate: updateSchedule } = useUpdateSchedule();
    const { mutate: markRead } = useMarkNotificationRead();
    const { mutate: confirmBooking } = useConfirmBooking();
    const { mutate: updateBookingStatus } = useUpdateBookingStatus();

    const handleCustomDateChange = (start: string, end: string) => {
        setAnalyticsStartDate(start);
        setAnalyticsEndDate(end);
    };

    const unreadCount = notifications.filter((n: any) => !n.is_read).length;

    // Закрытие панели уведомлений по клику вне ее
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
                setShowNotifications(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Сохранение и восстановление позиции скролла
    useEffect(() => {
        const mainElement = mainRef.current;
        if (!mainElement) return;

        const handleScroll = () => {
            sessionStorage.setItem("dashboard_scroll_y", mainElement.scrollTop.toString());
        };
        mainElement.addEventListener("scroll", handleScroll);

        const savedScrollY = sessionStorage.getItem("dashboard_scroll_y");
        if (savedScrollY) {
            setTimeout(() => { mainElement.scrollTop = parseInt(savedScrollY, 10); }, 0);
        }
        return () => mainElement.removeEventListener("scroll", handleScroll);
    }, []);

    const NOTIFICATION_TYPES: Record<string, { title: string; color: string; bgColor: string }> = {
        create: { title: "Новая запись", color: "text-emerald-600 border-emerald-200 bg-emerald-50", bgColor: "bg-emerald-500" },
        cancel: { title: "Запись отменена", color: "text-rose-600 border-rose-200 bg-rose-50", bgColor: "bg-rose-500" },
        update: { title: "Запись изменена", color: "text-amber-600 border-amber-200 bg-amber-50", bgColor: "bg-amber-500" },
        reminder: { title: "Напоминание", color: "text-blue-600 border-blue-200 bg-blue-50", bgColor: "bg-blue-600" },
        review: {
            title: "Новый отзыв",
            color: "text-indigo-600 border-indigo-200 bg-indigo-50",
            bgColor: "bg-indigo-500"
        },
    };

    const copyBookingLink = () => {
        const displayCode = orgInfo?.short_code || userProfile?.organization_short_code || userProfile?.organization_id;
        if (!displayCode) return;
        const shortUrl = `${window.location.origin}/b/${displayCode}`;
        navigator.clipboard.writeText(shortUrl);
        enqueueSnackbar('Короткая ссылка скопирована!', { variant: 'success' });
    };

    // Пока компонент не смонтирован на клиенте или загружаются первичиные данные — отдаем одинаковый лоадер
    if (!mounted || initLoading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-slate-50">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
        );
    }

    // Обработка ошибок доступа и авторизации
    if (initError || (userProfile && !userProfile.is_specialist)) {
        return (
            <div className="h-screen flex flex-col items-center justify-center bg-white text-center p-4">
                <ShieldAlert size={48} className="text-red-500 mb-4" />
                <h1 className="text-xl font-bold mb-2">Доступ ограничен</h1>
                <p className="text-sm text-slate-500 mb-4">Ошибка авторизации или у вас нет прав специалиста.</p>
                <Link href="/logout" className="text-xs font-bold text-blue-600 uppercase tracking-wider hover:underline">Выйти из системы</Link>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen w-screen overflow-hidden bg-olive-50">
            {/* БАННЕР ОБ ИСТЕКШЕЙ ПОДПИСКЕ */}
            <OrganizationNewsBanner />
            {subInfo && !subInfo.is_active && (
                <SubscriptionBanner subInfo={subInfo} />
            )}
            <div className="flex flex-1 min-h-0 w-full overflow-hidden">
                <Sidebar userRole={currentRole} subscription={subInfo} isOpen={isSidebarOpen}
                    setIsOpen={setIsSidebarOpen} />

                <main
                    ref={mainRef}
                    className="flex-1 overflow-auto transition-all duration-300 p-4 lg:p-10"
                >
                    {/* ХЕДЕР */}
                    {activeTab !== "settings" && (
                        <header className="flex flex-col gap-6 mb-6 md:mb-10">
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3 md:gap-5">
                                    <button
                                        type="button"
                                        onClick={() => setIsSidebarOpen(true)}
                                        className="lg:hidden p-2.5 bg-white border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-2xl transition-colors shadow-sm"
                                        aria-label="Открыть меню"
                                    >
                                        <Menu size={22} />
                                    </button>

                                    <div className="relative group shrink-0">
                                        {orgInfo?.logo ? (
                                            <img
                                                src={orgInfo.logo}
                                                className="w-12 h-12 md:w-16 md:h-16 rounded-[1.2rem] md:rounded-[1.5rem] object-cover shadow-xl shadow-blue-100 border-2 border-white group-hover:scale-105 transition-transform duration-300"
                                                alt="Org Logo"
                                            />
                                        ) : (
                                            <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-[1.2rem] md:rounded-[1.5rem] flex items-center justify-center text-white text-xl md:text-2xl font-extrabold shadow-xl shadow-blue-100 border-2 border-white">
                                                {orgInfo?.name?.[0] || 'W'}
                                            </div>
                                        )}
                                        <div className="absolute -bottom-0.5 -right-0.5 md:-bottom-1 md:-right-1 w-4 h-4 md:w-6 md:h-6 bg-emerald-500 border-2 md:border-4 border-white rounded-full shadow-sm"></div>
                                    </div>

                                    <div className="hidden md:block">
                                        <h1 className="text-2xl font-bold text-slate-900 leading-tight">
                                            {activeTab === "overview" && (orgInfo?.name || "Дашборд")}
                                            {(activeTab === "masters" || activeTab === "schedule") && "Сотрудники"}
                                            {activeTab === "analytics" && "Аналитика"}
                                            {activeTab === "reviews" && "Отзывы"}
                                            {activeTab === "services" && "Каталог услуг"}
                                            {activeTab === "clients" && "База клиентов"}
                                            {activeTab === "tariffs" && "Тарифы и подписка"}
                                        </h1>
                                        {activeTab === "overview" && userProfile && (
                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-1">
                                                <div className="text-gray-400 text-xs pl-1">{orgInfo?.address}</div>
                                                <button onClick={copyBookingLink} className="group flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-100 rounded-full hover:border-blue-500 hover:shadow-md transition-all active:scale-95">
                                                    <Share2 size={12} className="text-blue-500 group-hover:rotate-12 transition-transform" />
                                                    <span className="text-[11px] font-black text-slate-600 uppercase tracking-tighter cursor-pointer">
                                                        {orgInfo?.short_code ? `wopp.ru/b/${orgInfo?.short_code}` : "Копировать ссылку"}
                                                    </span>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 md:gap-3">
                                    {activeTab === "overview" && (
                                        <div className="hidden xl:flex flex-col items-end mr-4">
                                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">ИНН организации</span>
                                            <span className="text-xs font-bold text-slate-900">{orgInfo?.inn || "—"}</span>
                                        </div>
                                    )}

                                    <div className="hidden sm:flex flex-col items-end">
                                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Тариф</span>
                                        <div className="flex flex-col items-end gap-0.5">
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${subInfo?.is_active ? 'text-emerald-600 bg-emerald-50 border border-emerald-100' : 'text-rose-600 bg-rose-50 border border-rose-100'}`}>
                                                {subInfo?.current_plan || "Без подписки"}
                                            </span>
                                            {subInfo?.subscription_until && (
                                                <span className="text-[9px] font-medium text-slate-400">
                                                    {subInfo.is_active ? "до" : "истёк"} {new Date(subInfo.subscription_until).toLocaleDateString('ru-RU')}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* УВЕДОМЛЕНИЯ */}
                                    <div className="relative" ref={notificationRef}>
                                        <button
                                            onClick={() => setShowNotifications(!showNotifications)}
                                            className={`p-2.5 md:p-3 bg-white border border-slate-200 rounded-2xl cursor-pointer hover:bg-slate-50 hover:text-blue-500 transition-colors relative ${unreadCount > 0 ? 'text-blue-600' : 'text-slate-400'}`}
                                        >
                                            <Bell size={20} />
                                            {unreadCount > 0 && (
                                                <span className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center rounded-full border-2 border-white shadow-sm text-white text-[10px] font-black bg-red-500">
                                                    {unreadCount > 99 ? '99+' : unreadCount}
                                                </span>
                                            )}
                                        </button>

                                        {showNotifications && (
                                            <div className="fixed sm:absolute right-4 sm:right-0 mt-3 w-[calc(100vw-2rem)] sm:w-80 bg-white border border-slate-100 shadow-2xl rounded-[2rem] z-[100] overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                                                <div className="p-5 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                                                    <h3 className="font-black text-[10px] uppercase text-slate-400">Уведомления</h3>
                                                    {unreadCount > 0 && (
                                                        <span className="bg-blue-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full">
                                                            {unreadCount}
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="max-h-[350px] overflow-y-auto no-scrollbar">
                                                    {notifications.length > 0 ? (
                                                        notifications.map((n: any) => {
                                                            const typeConfig = NOTIFICATION_TYPES[n.type] || {
                                                                title: "Уведомление",
                                                                color: "text-slate-600 border-slate-200 bg-slate-50",
                                                                bgColor: "bg-green-400",
                                                            };

                                                            return (
                                                                <div
                                                                    key={n.id}
                                                                    onClick={() => !n.is_read && markRead(n.id)}
                                                                    className={`p-4 border-b border-slate-50 transition-all cursor-pointer flex gap-3 items-start group ${!n.is_read ? 'bg-slate-50/50' : 'opacity-60'}`}
                                                                >
                                                                    <div className={`mt-1.5 shrink-0 w-2 h-2 rounded-full ${typeConfig.bgColor} ${!n.is_read ? 'animate-pulse' : 'opacity-40'}`} />
                                                                    <div className="flex-1">
                                                                        <p className="text-xs text-slate-900 leading-tight mb-1 group-hover:text-blue-600 transition-colors">
                                                                            {typeConfig.title}
                                                                        </p>
                                                                        <p className="text-[11px] text-slate-500 leading-snug">{n.message}</p>
                                                                        <div className="flex items-center gap-2 mt-2">
                                                                            <span className={`text-[9px] tracking-tighter px-1.5 py-0.5 rounded border ${typeConfig.color}`}>
                                                                                {n.time_ago} назад
                                                                            </span>
                                                                            {n.created_at && (
                                                                                <span className="text-[9px] text-slate-400 font-medium">
                                                                                    ({new Date(n.created_at).toLocaleString('ru-RU', {
                                                                                        hour: '2-digit',
                                                                                        minute: '2-digit',
                                                                                        day: '2-digit',
                                                                                        month: 'short'
                                                                                    })})
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })
                                                    ) : (
                                                        <div className="p-10 text-center">
                                                            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-3 text-slate-200">
                                                                <CheckCircle2 size={24} />
                                                            </div>
                                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">У вас нет уведомлений</p>
                                                        </div>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={() => setShowNotifications(false)}
                                                    className="w-full py-4 bg-white border-t border-slate-50 text-[10px] cursor-pointer font-black uppercase text-slate-900 hover:bg-slate-900 hover:text-white transition-all"
                                                >
                                                    Закрыть
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <Link
                                        href="/logout"
                                        className="p-2.5 md:p-3 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-colors relative hover:text-red-500"
                                    >
                                        <LogOut size={20} />
                                    </Link>
                                </div>
                            </div>

                            <div className="block md:hidden border-t border-slate-100 pt-3">
                                <h1 className="text-xl font-bold text-slate-900 leading-tight">
                                    {activeTab === "overview" && (orgInfo?.name || "Дашборд")}
                                    {(activeTab === "masters" || activeTab === "schedule") && "Сотрудники"}
                                    {activeTab === "analytics" && "Аналитика"}
                                    {activeTab === "reviews" && "Отзывы"}
                                    {activeTab === "services" && "Каталог услуг"}
                                    {activeTab === "clients" && "База клиентов"}
                                    {activeTab === "tariffs" && "Тарифы и подписка"}
                                </h1>
                                {activeTab === "overview" && userProfile && (
                                    <div className="flex flex-wrap items-center gap-2 mt-2">
                                        <div className="text-gray-400 text-xs">{orgInfo?.address}</div>
                                        <button onClick={copyBookingLink} className="group flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded-full hover:border-blue-500 transition-all active:scale-95">
                                            <Share2 size={12} className="text-blue-500" />
                                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-tighter">
                                                {orgInfo?.short_code ? `wopp.ru/b/${orgInfo?.short_code}` : "Копировать ссылку"}
                                            </span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </header>
                    )}

                    {/* ОСНОВНОЙ КОНТЕНТ С ОГРАНИЧЕНИЕМ ДОСТУПА */}
                    <div className="relative min-h-[500px]">
                        <div
                            className={
                                subInfo && !subInfo.is_active && activeTab !== "tariffs" && activeTab !== "settings"
                                    ? "filter blur-[2px] pointer-events-none select-none transition-all duration-300 opacity-50"
                                    : ""
                            }
                        >
                            {activeTab === "overview" && (
                                <OverviewTab
                                    period={period}
                                    setPeriod={setPeriod}
                                    isInitLoading={initLoading}
                                    initialStatsToday={dashboardData?.stats_today}
                                    subscription={subInfo}
                                    onStatusChange={(id: string, status: string) => {
                                        let action = status === 'cancel' ? 'cancel' : (status === 'confirmed' ? 'complete' : 'confirm');
                                        updateBookingStatus({ id, action });
                                    }}
                                />
                            )}
                            {activeTab === "masters" && (
                                <MastersTab
                                    onOpenSchedule={(m: any) => { setSelectedMaster(m); }}
                                />
                            )}
                            {activeTab === "services" && <ServicesManager organizationId={userProfile?.organization_id} />}
                            {activeTab === "bookings" && (
                                <CalendarView
                                    events={bookings}
                                    services={services}
                                    onConfirm={confirmBooking}
                                    onRefresh={refetchBookings}
                                    filterMasterId={selectedMasterId}
                                    setFilterMasterId={setSelectedMasterId}
                                    setCalendarDates={setCalendarDates}
                                />
                            )}
                            {activeTab === "schedule" && selectedMaster && (
                                <ScheduleTab
                                    selectedMaster={selectedMaster}
                                    scheduleData={scheduleData}
                                    setScheduleData={setScheduleData}
                                    onSave={() => updateSchedule({ masterId: selectedMaster.id, data: scheduleData })}
                                />
                            )}
                            {activeTab === "clients" && <ClientsTab subscription={subInfo} />}
                            {activeTab === "reviews" && <ReviewsTab subscription={subInfo} />}
                            {activeTab === "tariffs" && <TariffsTab organizationId={userProfile?.organization_id} />}
                            {activeTab === "analytics" && (
                                <AnalyticsTab
                                    data={advancedData}
                                    period={analyticsPeriod}
                                    setPeriod={setAnalyticsPeriod}
                                    startDate={analyticsStartDate}
                                    endDate={analyticsEndDate}
                                    onCustomDateChange={handleCustomDateChange}
                                    subscription={subInfo}
                                />
                            )}
                            {activeTab === "settings" && <OrganizationProfile organizationId={userProfile?.organization_id} />}
                        </div>

                        {/* Оверлей блокировки */}
                        {subInfo && !subInfo.is_active && activeTab !== "tariffs" && activeTab !== "settings" && (
                            <div className="absolute inset-0 z-30 bg-slate-900/5 backdrop-blur-[2px] rounded-3xl animate-in fade-in duration-200">
                                <div className="sticky top-6 flex justify-center p-4">
                                    <div className="bg-white border border-slate-100 rounded-[2rem] p-8 text-center max-w-md w-full shadow-2xl shadow-slate-300/50">
                                        <div className="w-16 h-16 bg-rose-50 border border-rose-100 rounded-[1.25rem] flex items-center justify-center mx-auto mb-5 text-rose-500 shadow-sm">
                                            <ShieldAlert size={30} />
                                        </div>

                                        <h3 className="text-lg font-black text-slate-900 mb-2 tracking-tight">
                                            Доступ ограничен
                                        </h3>

                                        <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                                            Срок действия вашей подписки истёк. Управление записями, аналитика и журнал клиентов временно заблокированы.
                                        </p>

                                        <div className="flex flex-col gap-3">
                                            <Link
                                                href="?tab=tariffs"
                                                scroll={false}
                                                className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all active:scale-95 shadow-md cursor-pointer flex items-center justify-center"
                                            >
                                                Продлить подписку
                                            </Link>

                                            <Link
                                                href="?tab=settings"
                                                scroll={false}
                                                className="text-[11px] font-extrabold uppercase text-slate-400 hover:text-slate-600 transition-colors py-1 tracking-wider"
                                            >
                                                Перейти в настройки
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}