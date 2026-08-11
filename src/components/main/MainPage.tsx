'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
    ArrowUpRight,
    Clock,
    ChevronRight,
    TrendingUp,
    Users,
    Zap,
    ShieldCheck,
    Bot,
    BellRing,
    BarChart3,
    UserCheck,
    Briefcase,
    Building2,
    FileSpreadsheet,
    LineChart,
    Check,
    Sparkles,
    CalendarDays,
    Lock,
    MessageSquare,
    BadgeCheck,
    Share2,
    PieChart,
    Headphones,
    FileText,
    Calendar,
    CheckCircle2,
    Car,
    GraduationCap,
    Dumbbell,
    Stethoscope,
    Scissors,
    HelpCircle
} from 'lucide-react';
import LiveFeed from '@/components/main/LiveFeed';


const PLANS = [
    {
        id: 1,
        name: 'База',
        price: 299,
        description: 'Идеально для индивидуальных мастеров и специалистов, работающих на себя',
        features: [
            'Онлайн-запись клиентов 24/7',
            'Электронный журнал записи',
            'Краткая аналитика дохода',
            'Гибкая настройка графика работы',
            'Каталог услуг и цен',
            'Просмотр отзывов клиентов',
            'Короткая ссылка на онлайн-запись',
            'База клиентов и история визитов',
            'Техническая поддержка 24/7',
            'До 2 мастеров в системе',
            'Раздельный доступ для мастеров',
            'Уведомления и напоминания клиентам в Telegram'
        ],
        icon: UserCheck,
        isPopular: false
    },
    {
        id: 2,
        name: 'Профи',
        price: 499,
        description: 'Для небольших студий, салонов и бьюти-пространств',
        features: [
            'Все функции тарифа «База»',
            'Общая аналитика по студии',
            'Работа с отзывами и рейтингом',
            'Полная история посещений клиентов',
            'Программа лояльности клиентов',
            'До 5 мастеров в системе',
            'Уведомления и напоминания клиентам в Telegram',
            'Приоритетная поддержка 24/7'
        ],
        icon: Briefcase,
        isPopular: true
    },
    {
        id: 3,
        name: 'Премиум',
        price: 799,
        description: 'Максимальный контроль и аналитика для растущего бизнеса',
        features: [
            'Все функции тарифа «Профи»',
            'Расширенная бизнес-аналитика',
            'Подробная статистика записей и отмен',
            'Анализ плотности и загрузки расписания',
            'Выгрузка любых отчетов в Excel',
            'Автоматический прогноз выручки',
            'Лидеры продаж и эффективность мастеров',
            'Контроль чистой прибыли и расходов',
            'Уведомления и напоминания клиентам в Telegram',
            'Персональная поддержка 24/7'
        ],
        icon: Building2,
        isPopular: false
    }
];

export default function MainPage() {

    const [selectedMaster, setSelectedMaster] = useState<'Александр' | 'Анна'>('Александр');
    const [selectedSlot, setSelectedSlot] = useState<string>('14:00');
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        // Проверяем наличие JWT токена в localStorage
        const token = localStorage.getItem('token'); // или имя вашего ключа

        if (token) {
            // Опционально: здесь можно добавить базовую проверку валидности (не истек ли exp)
            setIsAuthenticated(true);
        } else {
            setIsAuthenticated(false);
        }

        setIsLoading(false);
    }, []);
    // JSON-LD разметка для SEO
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        'name': 'WOPP',
        'applicationCategory': 'BusinessApplication',
        'operatingSystem': 'All',
        'description': 'Сервис онлайн-записи, электронный журнал визитов и автоматические Телеграм-уведомления клиентам.',
        'offers': {
            '@type': 'AggregateOffer',
            'priceCurrency': 'RUB',
            'lowPrice': '299',
            'highPrice': '799',
            'offerCount': '3'
        }
    };

    return (
        <div className="min-h-screen bg-[#FAFAFA] text-zinc-900 font-sans antialiased selection:bg-zinc-900 selection:text-white">

            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            {/* КРАСИВОЕ СОВРЕМЕННОЕ МЕНЮ (Floating Pill Navigation) */}
            <div className="fixed top-4 inset-x-0 z-50 flex justify-center px-4 pointer-events-none">
                <header className="pointer-events-auto bg-white/85 backdrop-blur-xl border border-zinc-200/90 rounded-2xl shadow-xl shadow-zinc-950/5 px-5 h-16 flex items-center justify-between gap-4 w-full max-w-7xl transition-all">

                    {/* Логотип */}
                    <Link href="/" className="flex items-center gap-3 group shrink-0">

                        <img src="https://api.wopp.ru/media/org/logo.png" width={100} alt="Logo" />
                    </Link>

                    {/* Ссылки навигации */}
                    <nav className="hidden md:flex items-center gap-1 bg-zinc-100/80 p-1.5 rounded-xl border border-zinc-200/60 text-xs font-semibold text-zinc-600">
                        <a href="#features" className="px-3.5 py-2 rounded-lg hover:text-zinc-950 hover:bg-white hover:shadow-2xs transition-all">
                            Возможности
                        </a>
                        <a href="#use-cases" className="px-3.5 py-2 rounded-lg hover:text-zinc-950 hover:bg-white hover:shadow-2xs transition-all">
                            Для кого
                        </a>
                        <a href="#advantage" className="px-3.5 py-2 rounded-lg hover:text-zinc-950 hover:bg-white hover:shadow-2xs transition-all">
                            Преимущества
                        </a>
                        <a href="#pricing" className="px-3.5 py-2 rounded-lg hover:text-zinc-950 hover:bg-white hover:shadow-2xs transition-all">
                            Тарифы
                        </a>
                        <a href="#faq" className="px-3.5 py-2 rounded-lg hover:text-zinc-950 hover:bg-white hover:shadow-2xs transition-all">
                            Вопросы
                        </a>
                    </nav>

                    {/* Кнопки действий */}
                    <div className="flex items-center gap-2.5 shrink-0 min-h-[40px]">
                        {isLoading ? (
                            /* Заглушка/скелетон на момент проверки токена (предотвращает скачки UI) */
                            <div className="w-24 h-9 bg-zinc-100 animate-pulse rounded-xl" />
                        ) : isAuthenticated ? (
                            /* Если авторизован: только кнопка "В кабинет" */
                            <Link
                                href="/dashboard"
                                className="text-xs font-bold bg-zinc-950 text-white px-4 py-2.5 rounded-xl hover:bg-zinc-800 transition-all flex items-center gap-1.5 shadow-sm active:scale-98"
                            >
                                <span>В кабинет</span>
                                <ArrowUpRight className="w-4 h-4" />
                            </Link>
                        ) : (
                            /* Если НЕ авторизован: Войти + Попробовать */
                            <>
                                <Link
                                    href="/login"
                                    className="text-xs font-bold text-zinc-700 hover:text-zinc-950 transition-colors px-3.5 py-2.5 rounded-xl hover:bg-zinc-100"
                                >
                                    Войти
                                </Link>
                                <Link
                                    href="/register"
                                    className="text-xs font-bold bg-zinc-950 text-white px-4 py-2.5 rounded-xl hover:bg-zinc-800 transition-all flex items-center gap-1.5 shadow-sm active:scale-98"
                                >
                                    <span>Попробовать</span>
                                    <ArrowUpRight className="w-4 h-4" />
                                </Link>
                            </>
                        )}
                    </div>
                </header>
            </div>
            <main className="pt-20">

                {/* HERO SECTION */}
                <section className="pt-16 pb-20 px-6 max-w-7xl mx-auto border-b border-zinc-200/60">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-12">
                        <div className="max-w-2xl">

                            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-zinc-950 leading-[1.08]">
                                Удобная онлайн-запись <br />
                                <span className="text-zinc-400 font-normal">и авто-напоминания клиентам.</span>
                            </h1>

                            <p className="mt-6 text-base sm:text-lg text-zinc-600 max-w-xl leading-relaxed">
                                Современный сервис для специалистов и салонов. Запись за 20 секунд по ссылке, ведение клиентов, журнал визитов и автоматические напоминания клиентам в Telegram.
                            </p>

                            <div className="mt-8 flex flex-wrap items-center gap-4">
                                <Link
                                    href="/register"
                                    className="px-7 py-3.5 bg-zinc-950 text-white text-sm font-semibold rounded-xl hover:bg-zinc-800 transition-all flex items-center gap-2 shadow-md"
                                >
                                    <span>Начать 14 дней бесплатно</span>
                                    <ChevronRight className="w-4 h-4 text-zinc-400" />
                                </Link>
                                <a
                                    href="#pricing"
                                    className="px-7 py-3.5 bg-white text-zinc-800 border border-zinc-200 text-sm font-semibold rounded-xl hover:bg-zinc-50 transition-all shadow-xs"
                                >
                                    Посмотреть тарифы
                                </a>
                            </div>
                        </div>

                        {/* ПРЕВЬЮ ТЕЛЕГРАМ УВЕДОМЛЕНИЯ КЛИЕНТАМ */}
                        <div className="lg:w-[440px] bg-white border border-slate-200 rounded-2xl p-5 shadow-sm font-sans">

                            {/* Шапка диалога */}
                            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700">
                                            <Bot className="w-4 h-4 text-emerald-600" />
                                        </div>
                                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-xs font-bold text-slate-900">WOPP Бот-помощник</span>
                                            <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">бот</span>
                                        </div>
                                        <span className="text-[11px] text-slate-500">Автоматическая рассылка клиентам</span>
                                    </div>
                                </div>
                                <span className="text-[10px] font-mono font-medium text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-md">
                                    Активен
                                </span>
                            </div>

                            {/* Сообщения */}
                            <div className="mt-4 space-y-3">

                                {/* Сообщение 1: Подтверждение */}
                                <div className="max-w-[92%] bg-slate-50 border border-slate-200/80 rounded-2xl rounded-tl-xs p-3.5 text-xs">
                                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700 mb-1.5">
                                        <span className="flex items-center gap-1.5">
                                            <BellRing className="w-3.5 h-3.5 text-emerald-600" />
                                            Подтверждение записи
                                        </span>
                                        <span className="text-[10px] text-slate-400 font-mono">10:15</span>
                                    </div>
                                    <p className="text-slate-600 leading-relaxed text-[11px]">
                                        Вы успешно записаны в <strong className="text-slate-900 font-bold">WOPP Studio</strong>
                                    </p>
                                    <div className="mt-2 pt-2 border-t border-slate-200/60 text-[11px] text-slate-600 space-y-0.5 font-mono">
                                        <div>• Услуга: Мужская стрижка</div>
                                        <div>• Дата: Завтра в 14:00</div>
                                    </div>
                                </div>

                                {/* Сообщение 2: Напоминание */}
                                <div className="max-w-[92%] bg-slate-50 border border-slate-200/80 rounded-2xl rounded-tl-xs p-3.5 text-xs">
                                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700 mb-1.5">
                                        <span className="flex items-center gap-1.5">
                                            <Clock className="w-3.5 h-3.5 text-emerald-600" />
                                            Напоминание за 24 часа
                                        </span>
                                        <span className="text-[10px] text-slate-400 font-mono">Завтра, 14:00</span>
                                    </div>
                                    <p className="text-slate-600 leading-relaxed text-[11px]">
                                        Здравствуйте! Напоминаем о вашей записи завтра в <strong className="text-slate-900 font-bold">14:00</strong>. Будем рады вас видеть!
                                    </p>
                                </div>

                            </div>

                            {/* Подвал */}
                            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono text-slate-400">
                                <span>Доставляемость: 99.9%</span>
                                <span>Мгновенная отправка</span>
                            </div>

                        </div>
                    </div>
                </section>



                {/* ================= СФЕРЫ ПРИМЕНЕНИЯ (BENTO GRID) ================= */}
                <section id="use-cases" className="py-24 px-6 max-w-7xl mx-auto border-b border-zinc-200/60 font-sans">

                    {/* Заголовок секции */}
                    <div className="max-w-2xl mb-14">

                        <h2 className="text-3xl sm:text-5xl font-black text-zinc-950 tracking-tight">
                            Подходит для любой сферы услуг
                        </h2>
                        <p className="mt-4 text-sm sm:text-base text-zinc-600 leading-relaxed">
                            Автоматизируйте запись, сократите отмены и избавьтесь от рутины независимо от того, работаете вы соло или управляете командой.
                        </p>
                    </div>

                    {/* BENTO GRID */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                        {/* БЛОК 1 (Широкий: 2 колонки) — Бьюти-сфера */}
                        <div className="md:col-span-2 relative bg-gradient-to-br from-white via-zinc-50/50 to-emerald-50/30 border border-zinc-200/80 rounded-3xl p-8 sm:p-10 shadow-xs hover:border-zinc-300 transition-all duration-500 group flex flex-col justify-between min-h-[340px]">

                            {/* Фоновое мягкое свечение (сохраняем внутри границы) */}
                            <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
                                <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-all duration-500" />
                            </div>

                            <div className="max-w-md relative z-10">
                                <span className="text-[10px] font-mono font-bold tracking-widest text-emerald-700 uppercase bg-emerald-100/80 border border-emerald-200 px-2.5 py-1 rounded-md shadow-2xs">
                                    Самое популярное
                                </span>
                                <h3 className="text-2xl sm:text-3xl font-black text-zinc-950 tracking-tight mt-4">
                                    Бьюти-салоны & Мастера
                                </h3>
                                <p className="mt-3 text-xs sm:text-sm text-zinc-600 leading-relaxed">
                                    Парикмахеры, барбершопы, ногтевой сервис, лэшмейкеры, бровисты и косметологи. Удобный журнал визитов и авто-напоминания клиентам перед сеансом.
                                </p>
                            </div>

                            {/* Теги */}
                            <div className="mt-8 flex flex-wrap items-center gap-2 relative z-10 pr-24 sm:pr-48">
                                <span className="text-[11px] font-semibold bg-white/80 backdrop-blur-md border border-zinc-200/80 text-zinc-700 px-3.5 py-1.5 rounded-full shadow-2xs">
                                    ⚡ Рост повторных визитов
                                </span>
                                <span className="text-[11px] font-semibold bg-white/80 backdrop-blur-md border border-zinc-200/80 text-zinc-700 px-3.5 py-1.5 rounded-full shadow-2xs">
                                    💬 Уведомления в Telegram
                                </span>
                            </div>

                            {/* 3D Иконка Crown */}
                            <img
                                src="https://api.wopp.ru/media/main_page/crown.png"
                                alt="3D Crown"
                                className="absolute right-2 bottom-2 w-48 h-48 sm:w-60 sm:h-60 object-contain pointer-events-none drop-shadow-[0_15px_25px_rgba(16,185,129,0.25)] group-hover:scale-105 group-hover:-translate-y-2 group-hover:-rotate-2 transition-transform duration-500 ease-out z-20 transform-gpu image-render-crisp"
                            />
                        </div>

                        {/* БЛОК 2 (1 колонка) — Медицина и Здоровье */}
                        <div className="relative bg-white border border-zinc-200/80 rounded-3xl p-8 shadow-xs hover:border-zinc-300 transition-all duration-500 group flex flex-col justify-between min-h-[340px]">

                            <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
                                <div className="absolute -right-6 -bottom-6 w-48 h-48 bg-rose-500/10 rounded-full blur-2xl group-hover:bg-rose-500/20 transition-all duration-500" />
                            </div>

                            <div className="relative z-10">
                                <h3 className="text-xl sm:text-2xl font-bold text-zinc-950 tracking-tight">
                                    Здоровье & Массаж
                                </h3>
                                <p className="mt-2 text-xs sm:text-sm text-zinc-500 leading-relaxed">
                                    Массажисты, остеопаты, частные практики и физиотерапевты. Четкое распределение времени без накладок.
                                </p>
                            </div>

                            {/* 3D Иконка Heart */}
                            <img
                                src="https://api.wopp.ru/media/main_page/3dicons-heart-front-color.png"
                                alt="3D Heart"
                                className="absolute right-3 bottom-3 w-36 h-36 sm:w-40 sm:h-40 object-contain pointer-events-none drop-shadow-[0_15px_25px_rgba(244,63,94,0.25)] group-hover:scale-105 group-hover:-translate-y-2 group-hover:rotate-3 transition-transform duration-500 ease-out z-20 transform-gpu image-render-crisp"
                            />
                        </div>

                        {/* БЛОК 3 (1 колонка) — Спорт & Тренеры */}
                        <div className="relative bg-white border border-zinc-200/80 rounded-3xl p-8 shadow-xs hover:border-zinc-300 transition-all duration-500 group flex flex-col justify-between min-h-[320px]">

                            <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
                                <div className="absolute -right-6 -bottom-6 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all duration-500" />
                            </div>

                            <div className="relative z-10">
                                <h3 className="text-xl sm:text-2xl font-bold text-zinc-950 tracking-tight">
                                    Спорт & Фитнес
                                </h3>
                                <p className="mt-2 text-xs sm:text-sm text-zinc-500 leading-relaxed pr-12">
                                    Персональные тренеры, студии йоги и пилатеса. Индивидуальные графики тренировок.
                                </p>
                            </div>

                            {/* 3D Иконка Flash */}
                            <img
                                src="https://api.wopp.ru/media/main_page/premium.png"
                                alt="3D Flash"
                                className="absolute right-3 bottom-3 w-32 h-32 sm:w-36 sm:h-36 object-contain pointer-events-none drop-shadow-[0_15px_20px_rgba(245,158,11,0.25)] group-hover:scale-105 group-hover:-translate-y-2 group-hover:-rotate-3 transition-transform duration-500 ease-out z-20 transform-gpu image-render-crisp"
                            />
                        </div>

                        {/* БЛОК 4 (1 колонка) — Обучение & Репетиторы */}
                        <div className="relative bg-white border border-zinc-200/80 rounded-3xl p-8 shadow-xs hover:border-zinc-300 transition-all duration-500 group flex flex-col justify-between min-h-[320px]">

                            <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
                                <div className="absolute -right-6 -bottom-6 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all duration-500" />
                            </div>

                            <div className="relative z-10">
                                <h3 className="text-xl sm:text-2xl font-bold text-zinc-950 tracking-tight">
                                    Обучение & Коучинг
                                </h3>
                                <p className="mt-2 text-xs sm:text-sm text-zinc-500 leading-relaxed pr-12">
                                    Репетиторы, преподаватели языков и консультанты. Ученики сами выбирают свободные слоты.
                                </p>
                            </div>

                            {/* 3D Иконка Graduation Cap */}
                            <img
                                src="https://api.wopp.ru/media/main_page/3dicons-star-front-clay.png"
                                alt="3D Graduation Cap"
                                className="absolute right-3 bottom-3 w-32 h-32 sm:w-36 sm:h-36 object-contain pointer-events-none drop-shadow-[0_15px_20px_rgba(59,130,246,0.25)] group-hover:scale-105 group-hover:-translate-y-2 group-hover:rotate-3 transition-transform duration-500 ease-out z-20 transform-gpu image-render-crisp"
                            />
                        </div>

                        {/* БЛОК 5 (1 колонка) — Автоуслуги и Сервисы */}
                        <div className="relative bg-white border border-zinc-200/80 rounded-3xl p-8 shadow-xs hover:border-zinc-300 transition-all duration-500 group flex flex-col justify-between min-h-[320px]">

                            <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
                                <div className="absolute -right-6 -bottom-6 w-48 h-48 bg-slate-500/10 rounded-full blur-2xl group-hover:bg-slate-500/20 transition-all duration-500" />
                            </div>

                            <div className="relative z-10">
                                <h3 className="text-xl sm:text-2xl font-bold text-zinc-950 tracking-tight">
                                    Авто & Детейлинг
                                </h3>
                                <p className="mt-2 text-xs sm:text-sm text-zinc-500 leading-relaxed pr-12">
                                    Автомойки, шиномонтаж и автосервисы. Планируйте загрузку постов без очередей.
                                </p>
                            </div>

                            {/* 3D Иконка Setting / Gear */}
                            <img
                                src="https://api.wopp.ru/media/main_page/3dicons-tools-dynamic-color.png"
                                alt="3D Setting"
                                className="absolute right-3 bottom-3 w-32 h-32 sm:w-36 sm:h-36 object-contain pointer-events-none drop-shadow-[0_15px_20px_rgba(0,0,0,0.18)] group-hover:scale-105 group-hover:rotate-6 transition-transform duration-500 ease-out z-20 transform-gpu image-render-crisp"
                            />
                        </div>

                    </div>
                </section>


                <section id="features" className="py-24 px-6 max-w-7xl mx-auto border-b border-zinc-200/60 font-sans overflow-hidden">

                    {/* ЗАГОЛОВОК СЕКЦИИ */}
                    <div className="max-w-2xl mb-20">
                        <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">

                            Рабочее пространство
                        </div>
                        <h2 className="text-3xl sm:text-4xl font-black text-zinc-950 tracking-tight">
                            Всё для удобного контроля записей
                        </h2>
                    </div>

                    <div className="flex flex-col gap-20">

                        {/* ================= BLOCK 1: ЖУРНАЛ ЗАПИСЕЙ ================= */}
                        <article className="bg-gradient-to-br from-white to-zinc-50/80 border border-zinc-200/80 rounded-3xl p-8 sm:p-10 shadow-xs relative group hover:border-zinc-300 transition-all duration-300 mt-8 lg:mt-0">
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">

                                {/* ТЕКСТ СЛЕВА */}
                                <div className="lg:col-span-5 flex flex-col justify-center order-2 lg:order-1 z-10">
                                    <div className="flex items-center gap-2 text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">
                                        <Calendar className="w-4 h-4 text-emerald-600" />
                                        <span>Расписание</span>
                                    </div>

                                    <h3 className="text-2xl sm:text-3xl font-extrabold text-zinc-950 tracking-tight leading-tight">
                                        Электронный журнал записей
                                    </h3>

                                    <p className="text-sm sm:text-base text-zinc-600 mt-4 leading-relaxed">
                                        Наглядный календарь для работы с графиком мастеров. Управляйте свободой слотов, избегайте накладок и быстро планируйте рабочие дни филиала.
                                    </p>

                                    <ul className="mt-6 space-y-2.5 text-xs sm:text-sm font-medium text-zinc-700">
                                        <li className="flex items-center gap-2.5">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                            <span>Гибкая настройка смен и графиков мастеров</span>
                                        </li>
                                        <li className="flex items-center gap-2.5">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                            <span>Защита от накладок и двойных бронирований</span>
                                        </li>
                                    </ul>
                                </div>

                                {/* СКРИНШОТ (СПРАВА) */}
                                <div className="lg:col-span-7 order-1 lg:order-2 relative z-20">
                                    {/* 
                transform-gpu + backface-hidden — включает жесткое аппаратное ускорение видеокартой
                will-change-transform — принуждает браузер рендерить слой в высоком DPI
              */}
                                    <div className="relative transform-gpu will-change-transform backface-hidden lg:-rotate-3 lg:translate-x-8 lg:-translate-y-8 lg:-mt-12 group-hover:rotate-0 group-hover:translate-x-4 group-hover:-translate-y-4 transition-all duration-500 ease-out">
                                        {/* Подсветка на фоне */}
                                        <div className="absolute -inset-2 bg-gradient-to-r from-emerald-500/25 to-teal-500/25 rounded-3xl blur-2xl opacity-70 group-hover:opacity-100 transition-opacity" />

                                        {/* Карточка со скриншотом */}
                                        <div className="relative rounded-2xl border border-zinc-200/90 bg-white p-2 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.12)]">
                                            <img
                                                src="https://api.wopp.ru/media/main_page/journal.png"
                                                alt="Скриншот электронного журнала записей"
                                                className="w-full h-auto max-h-[480px] object-contain rounded-xl block transform-gpu backface-hidden [image-rendering:-webkit-optimize-contrast]"
                                            />
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </article>

                        {/* ================= BLOCK 2: ПОДРОБНОСТИ ЗАПИСИ ================= */}
                        <article className="bg-gradient-to-bl from-white to-zinc-50/80 border border-zinc-200/80 rounded-3xl p-8 sm:p-10 shadow-xs relative group hover:border-zinc-300 transition-all duration-300 mt-8 lg:mt-0">
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">

                                {/* СКРИНШОТ (СЛЕВА) */}
                                <div className="lg:col-span-7 relative z-20 order-1">
                                    <div className="relative transform-gpu will-change-transform backface-hidden lg:rotate-3 lg:-translate-x-8 lg:-translate-y-8 lg:-mt-12 group-hover:rotate-0 group-hover:-translate-x-4 group-hover:-translate-y-4 transition-all duration-500 ease-out">
                                        {/* Подсветка на фоне */}
                                        <div className="absolute -inset-2 bg-gradient-to-r from-zinc-400/20 to-emerald-500/25 rounded-3xl blur-2xl opacity-70 group-hover:opacity-100 transition-opacity" />

                                        {/* Карточка со скриншотом */}
                                        <div className="relative rounded-2xl border border-zinc-200/90 bg-white p-2 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.12)]">
                                            <img
                                                src="https://api.wopp.ru/media/main_page/journal-detail.png"
                                                alt="Скриншот деталей записи"
                                                className="w-full h-auto max-h-[480px] object-contain rounded-xl block transform-gpu backface-hidden [image-rendering:-webkit-optimize-contrast]"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* ТЕКСТ СПРАВА */}
                                <div className="lg:col-span-5 flex flex-col justify-center order-2 z-10">
                                    <div className="flex items-center gap-2 text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">
                                        <FileText className="w-4 h-4 text-emerald-600" />
                                        <span>Карточка визита</span>
                                    </div>

                                    <h3 className="text-2xl sm:text-3xl font-extrabold text-zinc-950 tracking-tight leading-tight">
                                        Подробная карточка записи
                                    </h3>

                                    <p className="text-sm sm:text-base text-zinc-600 mt-4 leading-relaxed">
                                        Вся информация о визите под рукой: перечень услуг, итоговая стоимость, персональные скидки, статус оплаты и контактные данные клиента.
                                    </p>

                                    <ul className="mt-6 space-y-2.5 text-xs sm:text-sm font-medium text-zinc-700">
                                        <li className="flex items-center gap-2.5">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                            <span>Учет скидок, бонусов и статусов оплаты</span>
                                        </li>
                                        <li className="flex items-center gap-2.5">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                            <span>Быстрый доступ к истории посещений</span>
                                        </li>
                                    </ul>
                                </div>

                            </div>
                        </article>

                    </div>
                </section>
                {/* ПОЛНЫЙ КАТАЛОГ ВСЕХ ВОЗМОЖНОСТЕЙ ПЛАТФОРМЫ (BENTO GRID) */}
                <section id="advantage" className="py-20 px-6 max-w-7xl mx-auto border-b border-zinc-200/60 font-sans">
                    <div className="max-w-2xl mb-12">
                        <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Полный список возможностей</span>
                        <h2 className="text-3xl font-extrabold text-zinc-950 mt-1">Все преимущества WOPP в деталях</h2>
                    </div>

                    {/* Идеальная симметричная Bento-сетка 3x3 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">

                        {/* 01. Онлайн-запись 24/7 (col-span-2) */}
                        <div className="md:col-span-2 bg-zinc-900 text-white border border-zinc-800 p-7 rounded-3xl shadow-sm flex flex-col justify-between relative overflow-hidden group">
                            <span className="absolute top-6 right-7 font-mono font-black text-2xl bg-gradient-to-r from-emerald-400 to-teal-200 bg-clip-text text-transparent select-none">
                                01
                            </span>
                            <div>
                                <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-emerald-400 mb-5">
                                    <CalendarDays className="w-5 h-5" />
                                </div>
                                <h3 className="text-xl font-bold text-white pr-12">Онлайн-запись 24/7</h3>
                                <p className="text-xs text-zinc-400 mt-2.5 leading-relaxed max-w-xl">
                                    Клиент заходит по вашей персональной короткой ссылке, выбирает мастера, услугу, дату и записывается за 20 секунд без звонков.
                                </p>
                            </div>
                        </div>

                        {/* 02. Управление командой (col-span-1) */}
                        <div className="bg-white border border-zinc-200/80 p-6 rounded-3xl shadow-xs flex flex-col justify-between relative overflow-hidden hover:border-zinc-300 transition-all">
                            <span className="absolute top-6 right-6 font-mono font-black text-xl bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent select-none">
                                02
                            </span>
                            <div>
                                <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-900 mb-4">
                                    <Users className="w-5 h-5" />
                                </div>
                                <h3 className="text-base font-bold text-zinc-950 pr-8">Управление командой</h3>
                                <p className="text-xs text-zinc-600 mt-2 leading-relaxed">
                                    Подключайте до 5 мастеров. Разделяйте права доступа, чтобы мастера видели только свои записи и рабочий график.
                                </p>
                            </div>
                        </div>

                        {/* 03. Короткая ссылка и каталог (col-span-1) */}
                        <div className="bg-white border border-zinc-200/80 p-6 rounded-3xl shadow-xs flex flex-col justify-between relative overflow-hidden hover:border-zinc-300 transition-all">
                            <span className="absolute top-6 right-6 font-mono font-black text-xl bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent select-none">
                                03
                            </span>
                            <div>
                                <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-900 mb-4">
                                    <Share2 className="w-5 h-5" />
                                </div>
                                <h3 className="text-base font-bold text-zinc-950 pr-8">Короткая ссылка и каталог</h3>
                                <p className="text-xs text-zinc-600 mt-2 leading-relaxed">
                                    Удобный витринный каталог ваших услуг с ценами, длительностью и портфолио. Легко размещается в соцсетях и мессенджерах.
                                </p>
                            </div>
                        </div>

                        {/* 04. Клиентская база и лояльность (Теперь col-span-2!) */}
                        <div className="md:col-span-2 bg-white border border-zinc-200/80 p-7 rounded-3xl shadow-xs flex flex-col justify-between relative overflow-hidden hover:border-zinc-300 transition-all">
                            <span className="absolute top-6 right-7 font-mono font-black text-2xl bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent select-none">
                                04
                            </span>
                            <div>
                                <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-900 mb-5">
                                    <BadgeCheck className="w-5 h-5" />
                                </div>
                                <h3 className="text-xl font-bold text-zinc-950 pr-12">Клиентская база и лояльность</h3>
                                <p className="text-xs text-zinc-600 mt-2.5 leading-relaxed max-w-xl">
                                    Полная история визитов каждого клиента, индивидуальные скидки, система лояльности и сбор обратной связи.
                                </p>
                            </div>
                        </div>

                        {/* 05. Плотность и статистика отмен (col-span-1) */}
                        <div className="bg-white border border-zinc-200/80 p-6 rounded-3xl shadow-xs flex flex-col justify-between relative overflow-hidden hover:border-zinc-300 transition-all">
                            <span className="absolute top-6 right-6 font-mono font-black text-xl bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent select-none">
                                05
                            </span>
                            <div>
                                <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-900 mb-4">
                                    <PieChart className="w-5 h-5" />
                                </div>
                                <h3 className="text-base font-bold text-zinc-950 pr-8">Плотность и статистика отмен</h3>
                                <p className="text-xs text-zinc-600 mt-2 leading-relaxed">
                                    Отслеживайте загрузку рабочего дня, выявляйте "часы пик" и анализируйте причины отмен визитов.
                                </p>
                            </div>
                        </div>

                        {/* 06. Прогноз выручки и расходы (col-span-1) */}
                        <div className="bg-white border border-zinc-200/80 p-6 rounded-3xl shadow-xs flex flex-col justify-between relative overflow-hidden hover:border-zinc-300 transition-all">
                            <span className="absolute top-6 right-6 font-mono font-black text-xl bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent select-none">
                                06
                            </span>
                            <div>
                                <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-900 mb-4">
                                    <TrendingUp className="w-5 h-5" />
                                </div>
                                <h3 className="text-base font-bold text-zinc-950 pr-8">Прогноз выручки и расходы</h3>
                                <p className="text-xs text-zinc-600 mt-2 leading-relaxed">
                                    Автоматический расчёт потенциального дохода на основе текущих записей, удержание баланса прибылей и расходов.
                                </p>
                            </div>
                        </div>

                        {/* 07. Выгрузка в Excel (col-span-1) */}
                        <div className="bg-white border border-zinc-200/80 p-6 rounded-3xl shadow-xs flex flex-col justify-between relative overflow-hidden hover:border-zinc-300 transition-all">
                            <span className="absolute top-6 right-6 font-mono font-black text-xl bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent select-none">
                                07
                            </span>
                            <div>
                                <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-900 mb-4">
                                    <FileSpreadsheet className="w-5 h-5" />
                                </div>
                                <h3 className="text-base font-bold text-zinc-950 pr-8">Выгрузка в Excel</h3>
                                <p className="text-xs text-zinc-600 mt-2 leading-relaxed">
                                    Скачивайте готовые Excel-таблицы с базой клиентов, расписанием, доходами и финансовыми отчетами в один клик.
                                </p>
                            </div>
                        </div>

                        {/* 08. Забота и поддержка 24/7 (Теперь на все 3 колонки!) */}
                        <div className="md:col-span-2 lg:col-span-3 bg-emerald-950 text-white border border-emerald-900 p-7 sm:p-8 rounded-3xl shadow-sm flex flex-col justify-between relative overflow-hidden">
                            <span className="absolute top-6 right-7 font-mono font-black text-2xl sm:text-3xl bg-gradient-to-r from-emerald-300 to-teal-100 bg-clip-text text-transparent select-none">
                                08
                            </span>
                            <div>
                                <div className="w-10 h-10 rounded-xl bg-emerald-900/80 border border-emerald-800 flex items-center justify-center text-emerald-400 mb-5">
                                    <Headphones className="w-5 h-5" />
                                </div>
                                <h3 className="text-xl sm:text-2xl font-bold text-white pr-12">Забота и поддержка 24/7</h3>
                                <p className="text-xs sm:text-sm text-emerald-100/80 mt-2.5 leading-relaxed max-w-2xl">
                                    Помогаем на каждом этапе: от первичной настройки каталога услуг и прайс-листа до индивидуальной подгонки сервиса под ваши бизнес-процессы. Наша команда на связи в любое время, чтобы оперативно проконсультировать, решить любой технический вопрос и сделать работу с платформой максимально простой и комфортной.
                                </p>
                            </div>
                        </div>

                    </div>
                </section>

                {/* ТАРИФНЫЕ ПЛАНЫ */}
                <section id="pricing" className="py-24 px-6 max-w-7xl mx-auto border-b border-zinc-200/60">
                    <div className="text-center max-w-2xl mx-auto mb-16">
                        <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/50">
                            Тарифы
                        </span>
                        <h2 className="text-3xl sm:text-4xl font-black text-zinc-950 mt-3 tracking-tight">
                            Прозрачные тарифы без скрытых платежей
                        </h2>
                        <p className="text-sm text-zinc-500 mt-2 font-medium">
                            Выберите подходящий вариант для частной практики или студии.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
                        {PLANS.map((plan) => {

                            const IconComponent = plan.icon;

                            return (

                                <div

                                    key={plan.id}

                                    className={`bg-white border rounded-2xl p-8 flex flex-col justify-between relative transition-all ${plan.isPopular

                                        ? 'border-zinc-950 shadow-xl ring-2 ring-zinc-950/10'

                                        : 'border-zinc-200 shadow-xs hover:border-zinc-300'

                                        }`}
                                >
                                    {plan.isPopular && (
                                        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-zinc-950 text-white text-[11px] font-bold px-4 py-1 rounded-full shadow-md tracking-wide uppercase">
                                            Хит продаж
                                        </div>
                                    )}

                                    <div>
                                        <div className="flex items-center justify-between">
                                            <div className="w-12 h-12 rounded-2xl bg-zinc-100/80 border border-zinc-200/60 flex items-center justify-center text-zinc-950 shadow-2xs">
                                                <IconComponent className="w-6 h-6" />
                                            </div>
                                            <span className="text-xs font-bold text-zinc-400 bg-zinc-100 px-2.5 py-1 rounded-lg">
                                                #{plan.id}
                                            </span>
                                        </div>

                                        <h3 className="text-2xl font-black text-zinc-950 mt-5 tracking-tight">{plan.name}</h3>
                                        <p className="text-xs text-zinc-500 mt-1.5 leading-relaxed min-h-[36px] font-medium">
                                            {plan.description}
                                        </p>

                                        <div className="mt-6 pb-6 border-b border-zinc-100 flex items-baseline gap-1">
                                            <span className="text-4xl font-black text-zinc-950 tracking-tight">{plan.price} ₽</span>
                                            <span className="text-xs font-semibold text-zinc-400">/ месяц</span>
                                        </div>

                                        <div className="mt-6 space-y-4">
                                            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                                                Все возможности тарифa:
                                            </span>
                                            <ul className="space-y-3">
                                                {plan.features.map((feature, idx) => (
                                                    <li key={idx} className="flex items-start gap-3 text-xs font-medium text-zinc-700">
                                                        <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                                                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                                                        </div>
                                                        <span className="leading-tight">{feature}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>

                                    <Link
                                        href={isAuthenticated ? "/dashboard" : `/register?plan=${plan.id}`}
                                        className={`mt-8 w-full py-3.5 px-4 rounded-2xl text-xs font-bold text-center transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-98 ${plan.isPopular
                                            ? 'bg-zinc-950 text-white hover:bg-zinc-800 shadow-zinc-950/20'
                                            : 'bg-zinc-100 text-zinc-900 hover:bg-zinc-200/80'
                                            }`}
                                    >
                                        <span>{isAuthenticated ? 'В кабинет' : `Выбрать ${plan.name}`}</span>
                                        <ArrowUpRight className="w-4 h-4" />
                                    </Link>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* ЧАСТО ЗАДАВАЕМЫЕ ВОПРОСЫ */}
                <section id="faq" className="py-24 px-6 max-w-4xl mx-auto border-b border-zinc-200/60">
                    <div className="text-center mb-16">
                        <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/50">
                            FAQ
                        </span>
                        <h2 className="text-3xl sm:text-4xl font-black text-zinc-950 mt-3 tracking-tight">
                            Ответы на вопросы
                        </h2>
                    </div>

                    <div className="space-y-4">
                        <div className="bg-white/80 backdrop-blur-xl border border-zinc-200/80 p-6 rounded-2xl shadow-xl shadow-zinc-950/5 transition-all hover:border-zinc-300">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-zinc-100 flex items-center justify-center shrink-0 text-zinc-950">
                                    <HelpCircle className="w-4 h-4" />
                                </div>
                                <h3 className="font-bold text-zinc-950 text-base">Кому приходят уведомления в Telegram?</h3>
                            </div>
                            <p className="text-xs text-zinc-600 mt-3 leading-relaxed font-medium pl-11">
                                Уведомления и напоминания отправляются клиентам, чтобы они вовремя приходили на визит. Салон и мастера управляют записями через удобный веб-интерфейс WOPP.
                            </p>
                        </div>

                        <div className="bg-white/80 backdrop-blur-xl border border-zinc-200/80 p-6 rounded-2xl shadow-xl shadow-zinc-950/5 transition-all hover:border-zinc-300">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-zinc-100 flex items-center justify-center shrink-0 text-zinc-950">
                                    <HelpCircle className="w-4 h-4" />
                                </div>
                                <h3 className="font-bold text-zinc-950 text-base">Есть ли бесплатный пробный период?</h3>
                            </div>
                            <p className="text-xs text-zinc-600 mt-3 leading-relaxed font-medium pl-11">
                                Да, вы получаете 14 дней бесплатного доступа со всеми функциями. Привязка банковской карты не требуется.
                            </p>
                        </div>

                        <div className="bg-white/80 backdrop-blur-xl border border-zinc-200/80 p-6 rounded-2xl shadow-xl shadow-zinc-950/5 transition-all hover:border-zinc-300">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-zinc-100 flex items-center justify-center shrink-0 text-zinc-950">
                                    <HelpCircle className="w-4 h-4" />
                                </div>
                                <h3 className="font-bold text-zinc-950 text-base">Как клиент записывается на прием?</h3>
                            </div>
                            <p className="text-xs text-zinc-600 mt-3 leading-relaxed font-medium pl-11">
                                Вы получаете персональную короткую ссылку. Размещаете её в соцсетях или отправляете клиентам. Перейдя по ней, клиент видит список услуг, выберет мастера, удобную дату и время.
                            </p>
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <section className="py-16 px-6 max-w-7xl mx-auto">
                    <div className="bg-zinc-950 text-white rounded-3xl p-8 sm:p-12 shadow-2xl border border-zinc-800">
                        <div className="max-w-2xl">
                            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
                                Готовы автоматизировать запись?
                            </h2>
                            <p className="mt-4 text-zinc-400 text-sm leading-relaxed">
                                Зарегистрируйтесь за 1 минуту и получите 14 дней полного бесплатного доступа к WOPP.
                            </p>
                            <div className="mt-8 flex gap-4">
                                <Link
                                    href="/register"
                                    className="px-8 py-3.5 bg-white text-zinc-950 text-xs font-bold rounded-xl hover:bg-zinc-100 transition-all text-center"
                                >
                                    Попробовать 14 дней бесплатно
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>
                <LiveFeed />
            </main>

            {/* FOOTER */}
            <footer className="border-t border-zinc-200 bg-white py-10 px-6">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-zinc-500">
                    <div>© 2026 WOPP. Онлайн-запись и авто-уведомления для бизнеса.</div>
                    <div className="flex gap-6">
                        <Link href="/privacy" className="hover:text-zinc-950 transition-colors">Конфиденциальность</Link>
                        <Link href="/terms" className="hover:text-zinc-950 transition-colors">Условия сервиса</Link>
                    </div>
                </div>
            </footer>

        </div>
    );
}