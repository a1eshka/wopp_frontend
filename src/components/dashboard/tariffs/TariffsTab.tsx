"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { 
  ShieldCheck, 
  Zap, 
  Loader2, 
  ToggleLeft, 
  ToggleRight, 
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Tag,
  CreditCard,
  UserCheck,
  Building2,
  Briefcase
} from 'lucide-react';
import { enqueueSnackbar } from 'notistack';
import { useParams, useSearchParams } from 'next/navigation';
import {
  useSubscriptionInfo,
  useCreatePayment,
  useToggleAutoRenew,
  useApplyCoupon,
} from '@/app/api/hooks';

interface Plan {
  id: number;
  name: string;
  price: number; // Базовая цена за 1 месяц
  description: string;
  features: string[];
  icon: React.ElementType;
}

interface AppliedCouponInfo {
  code: string;
  discountType: 'percentage' | 'fixed' | 'amount' | string;
  discountValue: number;
}

interface BillingCycle {
  months: number;
  label: string;
  discountPercent: number; // Скидка за период
  badge?: string;
}

interface TariffsTabProps {
  initialStats?: Record<string, unknown>;
  organizationId?: string | number | null;
}

const PLANS: Plan[] = [
  {
    id: 1,
    name: 'База',
    price: 299,
    description: 'Идеально для мастеров и специалистов, работающих на себя',
    features: ['Онлайн-запись для клиентов', 'Журнал записи', 'Краткая аналитика дохода', 'Гибкая настройка графика работы' , 'Каталог услуг', 'Просмотр отзывов', 'Короткая ссылка на онлайн-запись', 'Клиенская база','Поддержка 24/7','До 2 мастеров', 'Раздельный доступ', 'Уведомления и напоминания клиентам в Telegram'],
    icon: UserCheck,
  },
  {
    id: 2,
    name: 'Профи',
    price: 499,
    description: 'Для небольших студий, салонов и мастерских',
    features: ['Все функции тарифа База', 'Общая аналитика', 'Работа с отзывами', 'История посещений клиентов', 'Лояльность клиентов', 'До 5 мастеров', 'Уведомления и напоминания клиентам в Telegram', 'Приоритетная поддержка 24/7'],
    icon: Briefcase,
  },
  {
    id: 3,
    name: 'Премиум',
    price: 799,
    description: 'Максимальные возможности для бизнеса',
    features: ['Все функции тарифа Профи', 'Расширенная аналитика','Статистика записей и отмен','Анализ плотности записей','Выгрузка в Exel', 'Прогноз выручки', 'Лидеры продаж и эффективность работы', 'Контроль прибыли и расходов', 'Уведомления и напоминания клиентам в Telegram','Премимум поддержка 24/7'],
    icon: Building2,
  },
];

const BILLING_CYCLES: BillingCycle[] = [
  { months: 1, label: '1 месяц', discountPercent: 0 },
  { months: 3, label: '3 месяца', discountPercent: 5 },
  { months: 6, label: '6 месяцев', discountPercent: 10, badge: '-10%' },
  { months: 12, label: '1 год', discountPercent: 20, badge: '-20% ХИТ' },
];

export default function TariffsTab({ organizationId: propOrgId }: TariffsTabProps) {
  const params = useParams();
  const searchParams = useSearchParams();

  // Разрешение ID организации из аргументов / URL
  const organizationId = useMemo(() => {
    const rawId = propOrgId || params?.organizationId || params?.id || searchParams?.get('organizationId');
    const resolved = Array.isArray(rawId) ? rawId[0] : rawId;
    
    if (!resolved || resolved === 'null' || resolved === 'undefined') {
      return null;
    }
    return String(resolved);
  }, [propOrgId, params, searchParams]);

  // Состояния
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [loadingAutoRenew, setLoadingAutoRenew] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState<string | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCouponInfo | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [selectedMonths, setSelectedMonths] = useState<number>(1);

  // React Query hooks
  const { 
    data: subscriptionInfo, 
    isLoading: isSubLoading, 
    refetch 
  } = useSubscriptionInfo(organizationId);

  const createPaymentMutation = useCreatePayment();
  const toggleAutoRenewMutation = useToggleAutoRenew();
  const applyCouponMutation = useApplyCoupon();

  useEffect(() => {
    if (subscriptionInfo?.plan_id) {
      setSelectedPlanId(subscriptionInfo.plan_id);
    }
  }, [subscriptionInfo]);

  // Текущий выбранный цикл оплаты
  const currentBillingCycle = useMemo(() => {
    return BILLING_CYCLES.find(c => c.months === selectedMonths) || BILLING_CYCLES[0];
  }, [selectedMonths]);

  // Пересчет стоимости (без копеек, до целого рубля)
  const getCalculatedPrice = (baseMonthlyPrice: number, months: number, coupon: AppliedCouponInfo | null) => {
    // 1. Исходная сумма за период без скидок
    const rawTotalPrice = baseMonthlyPrice * months;

    // 2. Скидка за длительность периода
    const cycleDiscountPercent = currentBillingCycle.discountPercent;
    let priceAfterCycleDiscount = rawTotalPrice * (1 - cycleDiscountPercent / 100);

    // 3. Расчет скидки по промокоду
    let couponDiscountValue = 0;
    if (coupon && coupon.discountValue) {
      const { discountType, discountValue } = coupon;
      if (discountType === 'percentage' || discountType === 'percent') {
        couponDiscountValue = priceAfterCycleDiscount * (discountValue / 100);
      } else {
        couponDiscountValue = discountValue;
      }
    }

    const priceAfterCoupon = Math.max(0, priceAfterCycleDiscount - couponDiscountValue);

    // Округляем до целых рублей для ЮKassa
    const finalTotal = Math.round(priceAfterCoupon);
    const finalMonthlyPrice = Math.round(finalTotal / months);
    const totalSavings = rawTotalPrice - finalTotal;

    return {
      finalTotal,                   // Итоговая целая сумма к оплате
      finalMonthlyPrice,            // Эквивалент цены за 1 месяц
      rawTotalPrice,                // Сумма без скидок
      totalSavings,                 // Общая выгода в рублях
      couponDiscountValue: Math.round(couponDiscountValue), // Выгода от купона
      hasDiscount: finalTotal < rawTotalPrice,
    };
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponError(null);
    try {
      const data = await applyCouponMutation.mutateAsync({ code: couponCode, orgId: organizationId });
      
      if (data.success) {
        const type = data.discount_type || data.discountType || 'percentage';
        const rawValue = data.discount_value ?? data.discountValue ?? 0;
        const parsedValue = parseFloat(String(rawValue));

        setAppliedCoupon({
          code: data.code || couponCode.trim(),
          discountType: type,
          discountValue: !isNaN(parsedValue) ? parsedValue : 0,
        });

        enqueueSnackbar('Купон успешно применен!', { variant: 'success' });
      } else {
        setCouponError(data.error || 'Недействительный купон');
        enqueueSnackbar(data.error || 'Недействительный купон', { variant: 'error' });
      }
    } catch {
      setCouponError('Не удалось применить купон');
    }
  };

  const handleSelectPlan = async (planId: number) => {
    setLoadingPlan(String(planId));
    try {
      const payload: { plan_id: number; months: number; coupon_code?: string | null } = { 
        plan_id: planId,
        months: selectedMonths
      };
      
      const activeCouponCode = appliedCoupon?.code || couponCode.trim();
      if (activeCouponCode) {
        payload.coupon_code = activeCouponCode;
      }

      const data = await createPaymentMutation.mutateAsync(payload);
      
      if (data.success && data.payment_url) {
        window.location.href = data.payment_url;
      } else if (data.success) {
        enqueueSnackbar('План успешно подключен!', { variant: 'success' });
        refetch();
      } else {
        enqueueSnackbar(`Ошибка: ${data.error}`, { variant: 'error' });
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Ошибка сети';
      enqueueSnackbar(message, { variant: 'error' });
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleToggleAutoRenew = async () => {
    setLoadingAutoRenew(true);
    try {
      await toggleAutoRenewMutation.mutateAsync();
      enqueueSnackbar('Настройка автопродления обновлена', { variant: 'success' });
      refetch();
    } catch {
      enqueueSnackbar('Ошибка при изменении автопродления', { variant: 'error' });
    } finally {
      setLoadingAutoRenew(false);
    }
  };

  // Вычисляемые данные
  const selectedPlanData = PLANS.find((p) => p.id === selectedPlanId) || PLANS[0];
  const currentPlanName = subscriptionInfo?.current_plan || "Самозанятые";
  const isCurrentPlan = currentPlanName.toLowerCase() === selectedPlanData.name.toLowerCase();

  const calculatedPrice = useMemo(() => {
    return getCalculatedPrice(selectedPlanData.price, selectedMonths, appliedCoupon);
  }, [selectedPlanData, selectedMonths, appliedCoupon]);

  if (!organizationId) {
    return (
      <div className="bg-slate-50 min-h-screen flex items-center justify-center p-6 text-slate-600 font-sans">
        <div className="bg-white border border-slate-200 shadow-xl rounded-3xl p-8 max-w-md text-center">
          <h2 className="text-xl font-bold text-slate-900 mb-3 tracking-tight">ID организации не найден</h2>
          <p className="text-xs text-slate-500 leading-relaxed mb-6">
            Пожалуйста, проверьте правильность ссылки или попробуйте перезайти в личный кабинет.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="w-full py-3 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all shadow-md active:scale-95 cursor-pointer"
          >
            Обновить страницу
          </button>
        </div>
      </div>
    );
  }

  if (isSubLoading) {
    return (
      <div className="bg-slate-50 min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  return (
    <div className="bg-slate-50/60 min-h-screen text-slate-600 antialiased px-4 sm:px-8 lg:px-12 py-10 font-sans selection:bg-slate-900 selection:text-white">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Шапка страницы */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200/80 pb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
              Подписка и тарифы
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Управление финансовыми параметрами вашей организации.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200/60 text-emerald-700 text-xs px-3.5 py-2 rounded-xl font-semibold shadow-sm">
            <ShieldCheck size={16} className="text-emerald-600" />
            <span>Безопасная оплата SSL</span>
          </div>
        </div>

        {/* Bento Grid: Карточки состояния */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          
          {/* Текущий план */}
          <div className="bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-300 rounded-3xl p-6 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Ваш план</span>
              <h2 className="text-2xl font-black mt-1 text-slate-900 tracking-tight">{currentPlanName}</h2>
            </div>
            <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Статус</span>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold rounded-lg border ${
                subscriptionInfo?.is_active 
                  ? 'bg-emerald-50 border-emerald-200/60 text-emerald-700' 
                  : 'bg-rose-50 border-rose-200/60 text-rose-700'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${subscriptionInfo?.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
                {subscriptionInfo?.is_active ? "АКТИВЕН" : "ПРИОСТАНОВЛЕН"}
              </span>
            </div>
          </div>

          {/* Срок действия и оплата счета */}
          <div className="bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-300 rounded-3xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Действует до</span>
                <button 
                  onClick={handleToggleAutoRenew} 
                  disabled={loadingAutoRenew} 
                  className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 transition active:scale-95 disabled:opacity-50 cursor-pointer"
                  title="Автопродление"
                >
                  <span className="text-[11px] font-medium">Авто</span>
                  {loadingAutoRenew ? (
                    <Loader2 size={18} className="animate-spin text-slate-600" />
                  ) : subscriptionInfo?.auto_renew ? (
                    <ToggleRight size={26} className="text-slate-900 transition-transform hover:scale-105" />
                  ) : (
                    <ToggleLeft size={26} className="text-slate-300 transition-transform hover:scale-105" />
                  )}
                </button>
              </div>

              <div className="text-xl font-bold mt-2 text-slate-900">
                {subscriptionInfo?.subscription_until ? (
                  new Date(subscriptionInfo.subscription_until).toLocaleDateString('ru-RU', {
                    day: 'numeric', month: 'long', year: 'numeric'
                  })
                ) : "—"}
              </div>
            </div>

            <div className="mt-6">
              {/* Расширенная детализация скидок и экономии */}
              {calculatedPrice.hasDiscount && (
                <div className="mb-3 px-2.5 py-2 bg-emerald-50 border border-emerald-100 rounded-xl text-[11px] space-y-1">
                  {currentBillingCycle.discountPercent > 0 && (
                    <div className="flex justify-between text-emerald-700 font-medium">
                      <span>Скидка за период ({currentBillingCycle.label}):</span>
                      <span className="font-bold">-{currentBillingCycle.discountPercent}%</span>
                    </div>
                  )}

                  {appliedCoupon && calculatedPrice.couponDiscountValue > 0 && (
                    <div className="flex justify-between text-emerald-700 font-medium">
                      <span>Промокод ({appliedCoupon.code}):</span>
                      <span className="font-bold">-{calculatedPrice.couponDiscountValue} ₽</span>
                    </div>
                  )}
                </div>
              )}
              <div className="flex items-baseline justify-between mb-1 px-1">
                
                <span className="text-[11px] font-semibold text-slate-500">
                  К оплате ({selectedMonths} {selectedMonths === 1 ? 'мес' : 'мес'}):
                </span>
                {calculatedPrice.hasDiscount ? (
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-sm font-black text-slate-900">{calculatedPrice.finalTotal} ₽</span>
                    <span className="text-xs text-slate-400 line-through">{calculatedPrice.rawTotalPrice} ₽</span>
                  </div>
                ) : (
                  <span className="text-sm font-black text-slate-900">{calculatedPrice.finalTotal} ₽</span>
                )}
              </div>

              

              <button 
                onClick={() => handleSelectPlan(selectedPlanData.id)} 
                disabled={loadingPlan !== null}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white cursor-pointer rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loadingPlan ? <Loader2 size={15} className="animate-spin" /> : (
                  <>
                    <CreditCard size={15} />
                    <span>Оплатить {calculatedPrice.finalTotal} ₽</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Лимиты */}
          <div className="bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-300 rounded-3xl p-6 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Доступные лимиты</span>
              <div className="text-2xl font-black mt-1 text-slate-900 flex items-baseline gap-1.5">
                {subscriptionInfo?.limits?.max_staff_count || 5} 
                <span className="text-slate-400 text-xs font-normal">мест сотрудников</span>
              </div>
              <p className="text-xs text-slate-500 mt-2 flex items-center gap-1.5 font-medium">
                <CheckCircle2 size={14} className="text-slate-900 shrink-0" />
                {subscriptionInfo?.limits?.has_analytics ? "Расширенная аналитика включена" : "Базовый функционал аналитики"}
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Zap size={14} className="text-slate-900 fill-slate-900/10" /> Высокая скорость работы
            </div>
          </div>

        </div>

        {/* Блок активации промокода */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 shrink-0">
                <Tag size={18} />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">Промокод или купон</div>
                <div className="text-[11px] text-slate-500">Введите код для дополнительной скидки</div>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:w-80">
              <input 
                type="text"
                placeholder="Введите код"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl text-xs px-3.5 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-500 focus:bg-white transition uppercase font-semibold"
              />
              <button
                onClick={handleApplyCoupon}
                disabled={applyCouponMutation.isPending || !couponCode.trim()}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition disabled:opacity-40 active:scale-95 shrink-0 flex items-center justify-center min-w-[70px] cursor-pointer"
              >
                {applyCouponMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : "ОК"}
              </button>
            </div>
          </div>

          {couponError && (
            <p className="text-rose-600 text-xs mt-3 ml-1 font-medium flex items-center gap-1">
              <span>•</span> {couponError}
            </p>
          )}
          
          {appliedCoupon && (
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-emerald-600 font-bold">
                <CheckCircle2 size={15} />
                <span>Промокод «{appliedCoupon.code}» применён!</span>
              </div>
              <div className="text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/60 font-black">
                Скидка по купону: {appliedCoupon.discountType === 'percentage' || appliedCoupon.discountType === 'percent' ? `-${appliedCoupon.discountValue}%` : `-${appliedCoupon.discountValue} ₽`}
              </div>
            </div>
          )}
        </div>

        {/* Выбор периода и тарифных планов */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 space-y-8 shadow-sm">
          
          <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6 border-b border-slate-100 pb-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 text-xs font-extrabold mb-2.5">
                <Sparkles size={13} className="fill-amber-500" />
                <span>ГИБКАЯ ОПЛАТА</span>
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                Выберите тарифный план
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Экономьте до 20% при выборе долгосрочной подписки
              </p>
            </div>

            {/* Селектор периода */}
<div className="relative w-full sm:w-auto">
  <div className="relative bg-slate-900/90 backdrop-blur-xl p-1 rounded-2xl flex items-center gap-1 border border-slate-800 shadow-xl overflow-x-auto w-full sm:w-auto">
    {BILLING_CYCLES.map((cycle) => {
      const isCycleSelected = selectedMonths === cycle.months;

      return (
        <button
          key={cycle.months}
          onClick={() => setSelectedMonths(cycle.months)}
          className={`relative px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 whitespace-nowrap flex items-center justify-center gap-2 flex-1 sm:flex-none cursor-pointer select-none ${
            isCycleSelected
              ? 'text-slate-950 font-bold shadow-md shadow-black/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
          }`}
        >
          {isCycleSelected && (
            <div className="absolute inset-0 bg-white rounded-xl transition-all duration-200 -z-0" />
          )}

          <span className="relative z-10">{cycle.label}</span>

          {cycle.discountPercent > 0 && (
            <span
              className={`relative z-10 text-[10px] px-2 py-0.5 rounded-lg font-mono font-bold tracking-tight transition-all duration-200 ${
                isCycleSelected
                  ? 'bg-slate-900 text-white'
                  : 'bg-white/10 text-slate-300 border border-white/10'
              }`}
            >
              -{cycle.discountPercent}%
            </span>
          )}
        </button>
      );
    })}
  </div>
</div>
          </div>

          {/* Карточки тарифов */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PLANS.map((plan) => {
              const isSelected = selectedPlanId === plan.id;
              const Icon = plan.icon;
              const planPrice = getCalculatedPrice(plan.price, selectedMonths, appliedCoupon);

              return (
                <button
                  key={plan.id}
                  onClick={() => setSelectedPlanId(plan.id)}
                  className={`relative p-6 sm:p-7 rounded-3xl border text-left transition-all duration-300 flex flex-col justify-between group cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-b from-slate-900 to-slate-800 text-white border-slate-900 shadow-xl shadow-slate-900/10 scale-[1.02] ring-2 ring-slate-900/10'
                      : 'bg-white border-slate-200/80 hover:border-slate-300 hover:shadow-lg hover:-translate-y-1'
                  }`}
                >
                  {plan.id === 2 && (
                    <div className="absolute -top-3.5 right-6 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-black uppercase px-3 py-1 rounded-full shadow-md shadow-orange-500/20 tracking-wider flex items-center gap-1">
                      <Zap size={12} className="fill-white" /> Популярный
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-5">
                      <div className={`p-3 rounded-2xl transition-all ${
                        isSelected 
                          ? 'bg-white/10 text-white backdrop-blur-md' 
                          : 'bg-slate-100 text-slate-600 group-hover:bg-slate-900 group-hover:text-white'
                      }`}>
                        <Icon size={22} />
                      </div>
                      
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                        isSelected ? 'border-emerald-400 bg-emerald-400' : 'border-slate-300'
                      }`}>
                        {isSelected && <CheckCircle2 size={16} className="text-slate-900 stroke-[3]" />}
                      </div>
                    </div>

                    <div className={`text-xl font-bold mb-1 tracking-tight ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                      {plan.name}
                    </div>
                    <p className={`text-xs leading-relaxed mb-6 font-normal ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                      {plan.description}
                    </p>
                  </div>

                  <div className={`pt-5 border-t transition-colors ${isSelected ? 'border-white/10' : 'border-slate-100'}`}>
                    {planPrice.hasDiscount && (
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs line-through text-slate-400">
                          {plan.price} ₽
                        </span>
                        {planPrice.totalSavings > 0 && (
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            isSelected ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-50 text-emerald-600'
                          }`}>
                            Выгода {planPrice.totalSavings} ₽
                          </span>
                        )}
                      </div>
                    )}

                    <div className="flex items-baseline gap-1.5">
                      <span className={`text-3xl font-black tracking-tight ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                        {planPrice.finalMonthlyPrice} ₽
                      </span>
                      <span className={`text-xs font-medium ${isSelected ? 'text-slate-400' : 'text-slate-500'}`}>
                        / мес
                      </span>
                    </div>

                    <div className={`text-[11px] font-medium mt-1.5 ${isSelected ? 'text-slate-400' : 'text-slate-400'}`}>
                      {selectedMonths === 1 
                        ? 'Ежемесячное списание' 
                        : `Списание ${planPrice.finalTotal} ₽ раз в ${selectedMonths} ${selectedMonths < 5 ? 'месяца' : 'месяцев'}`}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Нижняя панель действий */}
          <div className="bg-slate-900 text-white rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl shadow-slate-900/5">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">В тариф включено</span>
                <span className="h-1 w-1 rounded-full bg-emerald-400"></span>
                <span className="text-xs text-emerald-400 font-semibold">{selectedPlanData.name}</span>
              </div>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-xs text-slate-300">
                {selectedPlanData.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row md:flex-col items-stretch sm:items-center md:items-end gap-3 shrink-0 pt-4 md:pt-0 border-t md:border-t-0 border-slate-800">
              <div className="text-left md:text-right">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Итого к оплате ({selectedMonths} {selectedMonths === 1 ? 'месяц' : selectedMonths < 5 ? 'месяца' : 'месяцев'}):
                </span>
                
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-white tracking-tight">
                    {calculatedPrice.finalTotal} ₽
                  </span>
                  {calculatedPrice.hasDiscount && (
                    <span className="text-xs text-slate-400 line-through">
                      {calculatedPrice.rawTotalPrice} ₽
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={() => handleSelectPlan(selectedPlanData.id)}
                disabled={loadingPlan !== null || isCurrentPlan}
                className={`px-8 py-3.5 rounded-xl text-xs font-extrabold transition-all duration-200 flex items-center justify-center gap-2 whitespace-nowrap min-w-[210px] cursor-pointer ${
                  isCurrentPlan 
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed shadow-none border border-slate-700' 
                    : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 active:scale-95 shadow-lg shadow-emerald-500/20 font-black'
                }`}
              >
                {loadingPlan === String(selectedPlanData.id) ? (
                  <Loader2 size={16} className="animate-spin text-slate-950" />
                ) : isCurrentPlan ? (
                  "ТЕКУЩИЙ ТАРИФ"
                ) : (
                  <>
                    <span>ОПЛАТИТЬ {calculatedPrice.finalTotal} ₽</span>
                    <ArrowRight size={14} className="stroke-[3]" />
                  </>
                )}
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}