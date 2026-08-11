"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronRight, ArrowLeft, Loader2, ChevronLeft,
  Check, Phone, MapPin, Clock, X, Plus, Scissors, Lock,
  Instagram, MessageSquare, Send, Compass,
  Star, ArrowRight, User
} from "lucide-react";
import { enqueueSnackbar } from "notistack";

import {
  useBookingInit,
  useSpecialistsByServices,
  useCheckPhone,
  useCreateBooking,
  useMe,
  useWorkingDays,
  useMasterSlotsStream
} from "@/app/api/hooks";
import MasterReviewsModal from "@/components/modals/MasterReviewsModal";

const formatPhoneNumber = (value: string) => {
  if (!value) return value;
  const phoneNumber = value.replace(/[^\d]/g, "");
  const listLen = phoneNumber.length;
  if (listLen === 0) return "";

  let firstChar = "7";
  if (phoneNumber[0] === "8") {
    firstChar = "8";
  }

  if (listLen <= 1) {
    return firstChar === "8" ? "8" : "+7";
  }
  if (listLen < 5) {
    return `${firstChar === "8" ? "8" : "+7"} (${phoneNumber.slice(1)}`;
  }
  if (listLen < 8) {
    return `${firstChar === "8" ? "8" : "+7"} (${phoneNumber.slice(1, 4)}) ${phoneNumber.slice(4)}`;
  }
  if (listLen < 10) {
    return `${firstChar === "8" ? "8" : "+7"} (${phoneNumber.slice(1, 4)}) ${phoneNumber.slice(4, 7)}-${phoneNumber.slice(7)}`;
  }
  return `${firstChar === "8" ? "8" : "+7"} (${phoneNumber.slice(1, 4)}) ${phoneNumber.slice(4, 7)}-${phoneNumber.slice(7, 9)}-${phoneNumber.slice(9, 11)}`;
};

export default function BookingClient({ ORG_ID }: { ORG_ID: string }) {
  const router = useRouter();

  // ==========================================
  // --- СОСТОЯНИЯ ШАГОВ И КОРЗИНЫ ---
  // ==========================================
  const [step, setStep] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [selectedServices, setSelectedServices] = useState<any[]>([]);
  const [selectedSpecialist, setSelectedSpecialist] = useState<any>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  // ==========================================
  // --- КАЛЕНДАРЬ И ДАТЫ ---
  // ==========================================
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  // ==========================================
  // --- ДАННЫЕ КЛИЕНТА ---
  // ==========================================
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [password, setPassword] = useState("");
  const [userStatus, setUserStatus] = useState<"guest" | "exists" | "new">("guest");

  // ==========================================
  // --- ВЫЧИСЛЯЕМЫЕ ДАННЫЕ ---
  // ==========================================
  const totalDuration = useMemo(() => selectedServices.reduce((acc, s) => acc + s.duration, 0), [selectedServices]);
  const totalPrice = useMemo(() => selectedServices.reduce((acc, s) => acc + s.price, 0), [selectedServices]);
  const serviceIdsStr = useMemo(() => selectedServices.map(s => s.id).join(','), [selectedServices]);
  const [activeReviewMaster, setActiveReviewMaster] = useState<any>(null);

  const dateStr = useMemo(() => {
    const y = selectedDate.getFullYear();
    const m = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const d = String(selectedDate.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, [selectedDate]);

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const shift = firstDayIndex === 0 ? 6 : firstDayIndex - 1;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];
    for (let i = 0; i < shift; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(new Date(year, month, d));
    return days;
  }, [currentMonth]);

  // ==========================================
  // --- REACT QUERY ---
  // ==========================================
  const { data: initData, isLoading: isInitLoading } = useBookingInit(ORG_ID, true);

  const orgInfo = initData?.organization;
  const categories = initData?.showcase || [];

  const { data: currentUser } = useMe();
  const isAuth = !!currentUser;

  useEffect(() => {
    if (currentUser) {
      setClientName(currentUser.first_name || currentUser.username || "");
      setClientPhone(currentUser.phone || "");
    }
  }, [currentUser]);

  const { data: specialists = [], isFetching: loadingSpecialists } = useSpecialistsByServices(
    serviceIdsStr,
    step === 3 && selectedServices.length > 0
  );

  const currentYearNum = currentMonth.getFullYear();
  const currentMonthNum = currentMonth.getMonth() + 1;
  const { data: availableDays = [] } = useWorkingDays(
    selectedSpecialist?.id,
    currentMonthNum,
    currentYearNum,
    !!selectedSpecialist && step === 4
  );

  const { liveSlots, loadingSlots, isFetching } = useMasterSlotsStream({
    orgId: orgInfo?.id || ORG_ID,
    masterId: selectedSpecialist?.id,
    dateStr,
    serviceIdsStr,
    enabled: !!selectedSpecialist && step === 4
  });

  const checkPhoneMutation = useCheckPhone();
  const createBookingMutation = useCreateBooking();

  const toggleService = (service: any) => {
    setSelectedServices(prev => {
      const isExist = prev.some(s => s.id === service.id);
      if (isExist) {
        return prev.filter(s => s.id !== service.id);
      } else {
        return [...prev, service];
      }
    });
  };

  const handlePhoneBlur = async () => {
    if (clientPhone.length < 10 || !!currentUser) return;
    try {
      const data = await checkPhoneMutation.mutateAsync(clientPhone);
      setUserStatus(data.exists ? "exists" : "new");
    } catch (err) {
      console.error("Ошибка проверки телефона:", err);
    }
  };

  const handleBooking = async () => {
    if (!selectedSpecialist || selectedServices.length === 0 || !selectedSlot) return;

    const digits = clientPhone.replace(/[^\d]/g, "");
    const cleanPhone = digits.startsWith("7") ? `+${digits}` : `+7${digits}`;

    const payload = {
      specialist_id: selectedSpecialist.id,
      service_ids: selectedServices.map(s => s.id),
      start_time: `${dateStr}T${selectedSlot}:00`,
      client_name: clientName,
      client_phone: cleanPhone,
      password: password || null
    };

    try {
      const result = await createBookingMutation.mutateAsync(payload);
      if (result.token) {
        localStorage.setItem("token", result.token.access);
        localStorage.setItem("refresh_token", result.token.refresh);
      }
      enqueueSnackbar("Запись успешно оформлена!", { variant: "success" });
      router.push("/cabinet?success=true");
    } catch (err: any) {
      enqueueSnackbar(err.message || "Ошибка при создании записи", { variant: "error" });
    }
  };

  const isGlobalLoading = loadingSpecialists || createBookingMutation.isPending;

  if (!ORG_ID) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" /></div>;

  if (isInitLoading) {
    return (
      <div className="min-h-screen bg-[#FDFDFF] text-slate-900 p-4 max-w-xl mx-auto space-y-6 animate-pulse">
        <div className="flex justify-between items-center py-2 border-b border-slate-100">
          <div className="h-4 bg-slate-200 rounded w-1/3" />
          <div className="w-9 h-9 bg-slate-200 rounded-xl" />
        </div>
        <div className="flex gap-2 mb-10">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-1.5 flex-1 bg-slate-100 rounded-full" />
          ))}
        </div>
        <div className="relative w-full mb-12">
          <div className="w-full h-40 bg-slate-100 rounded-b-[2.5rem]" />
          <div className="absolute left-1/2 -translate-x-1/2 -bottom-10 z-10">
            <div className="w-24 h-24 rounded-[2.5rem] bg-slate-200 border-4 border-white shadow-md" />
          </div>
        </div>
        <div className="flex flex-col items-center space-y-3 pt-4">
          <div className="h-8 bg-slate-200 rounded-2xl w-3/4" />
          <div className="h-4 bg-slate-100 rounded-xl w-1/2" />
          <div className="h-10 bg-slate-50 border border-slate-100 rounded-2xl w-1/3 mt-2" />
        </div>
        <div className="space-y-4 pt-4">
          <div className="h-6 bg-slate-200 rounded-xl w-1/2 ml-2" />
          <div className="grid gap-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="w-full flex justify-between items-center p-6 bg-white border border-slate-100 rounded-[2rem] shadow-sm h-20">
                <div className="h-5 bg-slate-200 rounded-lg w-1/3" />
                <div className="w-9 h-9 bg-slate-100 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFDFF] text-slate-900 pb-32 font-sans relative">
      {/* Schema.org Микроразметка для поисковиков (Яндекс / Google) */}
      {orgInfo && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "BeautySalon",
              "name": orgInfo.name,
              "address": orgInfo.address || "",
              "telephone": orgInfo.phone || "",
              "image": orgInfo.logo || orgInfo.cover || ""
            })
          }}
        />
      )}

      {/* HEADER */}
      <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-100 z-50 p-4">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="flex items-center">
            {step > 1 && (
              <button onClick={() => setStep(step - 1)} className="p-2 hover:bg-slate-100 rounded-full mr-3 transition-colors">
                <ArrowLeft size={20} />
              </button>
            )}
            <h1 className="font-black text-sm uppercase tracking-widest text-slate-400">
              {step === 5 ? "Подтверждение" : "Онлайн-запись"}
            </h1>
          </div>
          {orgInfo?.phone && (
            <a href={`tel:${orgInfo.phone}`} className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors">
              <Phone size={18} />
            </a>
          )}
        </div>
      </div>

      <div className="max-w-xl mx-auto p-4 mt-4">
        {/* PROGRESS BAR */}
        <div className="flex gap-2 mb-10">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${step >= i ? 'bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.3)]' : 'bg-slate-100'}`} />
          ))}
        </div>

        {/* STEP 1: WELCOME & CATEGORIES */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col min-h-full">
            <div className="relative w-full mb-6">
              {orgInfo?.cover ? (
                <div className="w-full h-40 bg-slate-100 rounded-b-[2.5rem] overflow-hidden shadow-sm relative">
                  <img src={orgInfo.cover} className="w-full h-full object-cover" alt="banner" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/10 to-transparent" />
                </div>
              ) : (
                <div className="w-full h-24 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-b-[2rem]" />
              )}

              <div className="absolute left-1/2 -translate-x-1/2 -bottom-10 z-10">
                {orgInfo?.logo ? (
                  <img
                    src={orgInfo.logo}
                    className="w-24 h-24 rounded-[2.5rem] object-cover shadow-2xl border-4 border-white bg-white"
                    alt="logo"
                  />
                ) : (
                  <div className="w-24 h-24 bg-blue-600 rounded-[2.5rem] flex items-center justify-center text-white text-3xl font-black shadow-xl border-4 border-white">
                    {orgInfo?.name?.[0] || 'W'}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col items-center text-center space-y-3 pt-4">
              <div className="space-y-3 w-full">
                <h2 className="text-3xl font-black text-slate-900 leading-tight px-4">{orgInfo?.name || "Загрузка..."}</h2>

                <div className="flex items-center justify-center gap-1.5 text-slate-400">
                  <MapPin size={14} className="text-blue-500 shrink-0" />
                  <p className="text-[10px] font-black uppercase tracking-widest">{orgInfo?.address || "Адрес не указан"}</p>
                </div>

                {(orgInfo?.address || orgInfo?.vk_url || orgInfo?.telegram_url || orgInfo?.instagram_url || orgInfo?.whatsapp_url) && (
                  <div className="flex items-center justify-center gap-2 flex-wrap pt-1 px-4">
                    {orgInfo?.address && (
                      <a href={`https://yandex.ru/maps/?text=${encodeURIComponent(orgInfo.address)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-wider text-slate-600 hover:text-blue-600 hover:bg-blue-50/50 hover:border-blue-100 transition-all active:scale-95 cursor-pointer shadow-sm h-10">
                        <Compass size={12} className="text-blue-500 animate-pulse shrink-0" />
                        Карты
                      </a>
                    )}

                    {orgInfo?.vk_url && (
                      <a href={orgInfo.vk_url} target="_blank" rel="noopener noreferrer" className="p-3 bg-slate-50 text-slate-600 border border-slate-100 rounded-2xl hover:bg-blue-50 hover:text-blue-600 hover:border-blue-100 transition-all active:scale-90 shadow-sm font-bold h-10 flex items-center justify-center gap-1.5">
                        <span className="font-black tracking-tight text-xs px-1">VK</span>
                      </a>
                    )}

                    {orgInfo?.telegram_url && (
                      <a href={orgInfo.telegram_url} target="_blank" rel="noopener noreferrer" className="p-3 bg-slate-50 text-slate-600 border border-slate-100 rounded-2xl hover:bg-sky-50 hover:text-sky-500 hover:border-sky-100 transition-all active:scale-90 shadow-sm font-bold h-10 flex items-center justify-center gap-1.5">
                        <Send size={14} className="-rotate-12" />
                      </a>
                    )}

                    {orgInfo?.instagram_url && (
                      <a href={orgInfo.instagram_url} target="_blank" rel="noopener noreferrer" className="p-3 bg-slate-50 text-slate-600 border border-slate-100 rounded-2xl hover:bg-pink-50 hover:text-pink-600 hover:border-pink-100 transition-all active:scale-90 shadow-sm font-bold h-10 flex items-center justify-center">
                        <Instagram size={14} />
                      </a>
                    )}

                    {orgInfo?.whatsapp_url && (
                      <a href={orgInfo.whatsapp_url} target="_blank" rel="noopener noreferrer" className="p-3 bg-slate-50 text-slate-600 border border-slate-100 rounded-2xl hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-100 transition-all active:scale-90 shadow-sm font-bold h-10 flex items-center justify-center gap-1.5">
                        <MessageSquare size={14} />
                        <span className="font-black tracking-tight text-xs">WA</span>
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 space-y-4">
              <h3 className="text-xl font-black px-2">Выберите категорию</h3>
              <div className="grid gap-3">
                {categories.map((cat: any) => (
                  <button key={cat.id} onClick={() => { setSelectedCategory(cat); setStep(2); }} className="group w-full flex justify-between items-center p-6 bg-white border border-slate-100 rounded-[2rem] shadow-sm hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/5 transition-all">
                    <span className="font-bold text-lg group-hover:text-blue-600 transition-colors">{cat.name}</span>
                    <div className="p-2 bg-slate-50 rounded-full group-hover:bg-blue-600 group-hover:text-white transition-all">
                      <ChevronRight size={20} />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: MULTI-SERVICES SELECTION */}
        {step === 2 && (
          <div className="space-y-4 animate-in slide-in-from-right-8 duration-500 pb-24">
            <h2 className="text-2xl font-black mb-1">Выберите услуги</h2>
            <p className="text-xs text-slate-400 uppercase font-black tracking-wider mb-6">Можно выбрать несколько позиций</p>

            {selectedCategory?.services.map((ser: any) => {
              const isSelected = selectedServices.some(s => s.id === ser.id);
              return (
                <button
                  key={ser.id}
                  onClick={() => toggleService(ser)}
                  className={`w-full flex justify-between items-center p-5 bg-white border rounded-[2rem] transition-all group ${isSelected ? 'border-blue-600 ring-2 ring-blue-100' : 'border-slate-100 shadow-sm hover:border-blue-300'
                    }`}
                >
                  <div className="text-left flex items-start gap-4 flex-1">
                    <div className={`mt-1 p-1 rounded-lg transition-colors shrink-0 ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'}`}>
                      {isSelected ? <Check size={14} strokeWidth={3} /> : <Plus size={14} strokeWidth={3} />}
                    </div>

                    <div className="w-16 h-16 rounded-2xl bg-slate-50 overflow-hidden shrink-0 flex items-center justify-center border border-slate-100 transition-transform group-hover:scale-105 duration-300">
                      {ser.photo ? (
                        <img src={ser.photo} alt={ser.name} className="w-full h-full object-cover" />
                      ) : (
                        <Scissors size={20} className="text-slate-300" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className={`font-bold text-base transition-colors leading-tight line-clamp-2 ${isSelected ? 'text-blue-600' : 'text-slate-900'}`}>
                        {ser.name}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1 font-bold uppercase tracking-tighter">
                        <Clock size={11} /> {ser.duration} мин
                      </div>
                      {ser.description && (
                        <div className="text-xs mt-1.5 text-gray-400 line-clamp-2 font-medium leading-normal">
                          {ser.description}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={`px-4 py-2 rounded-2xl font-black text-sm shrink-0 transition-all ml-4 ${isSelected ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-blue-50 text-blue-600'}`}>
                    {ser.price} ₽
                  </div>
                </button>
              );
            })}

            {selectedServices.length > 0 && (
              <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 p-4 shadow-[0_-10px_30px_rgba(0,0,0,0.04)] z-50 animate-in fade-in slide-in-from-bottom-8">
                <div className="max-w-xl mx-auto flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Выбрано: {selectedServices.length}</p>
                    <div className="text-xl font-black text-slate-900 mt-0.5">
                      {totalPrice} ₽ <span className="text-xs text-slate-400 font-medium">• {totalDuration} мин</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setStep(3)}
                    className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all active:scale-95"
                  >
                    Далее к мастеру
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 3: SPECIALISTS */}
        {step === 3 && (
          <div className="space-y-4 animate-in slide-in-from-right-8 duration-500">
            <h2 className="text-2xl font-black mb-6">Выберите мастера</h2>
            {isGlobalLoading ? (
              <div className="flex justify-center p-10">
                <Loader2 className="animate-spin text-blue-600" size={32} />
              </div>
            ) : (
              specialists.map((spec: any) => (
                <div
                  key={spec.id}
                  onClick={() => {
                    setSelectedSpecialist(spec);
                    setStep(4);
                  }}
                  className="w-full flex items-center gap-5 p-5 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm hover:border-blue-500 transition-all group cursor-pointer"
                >
                  <div className="w-16 h-16 rounded-[1.5rem] overflow-hidden flex items-center justify-center shrink-0 ring-4 ring-blue-50/50 group-hover:ring-blue-100 transition-all">
                    {spec.avatar_url ? (
                      <img src={spec.avatar_url} alt={spec.display_name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-blue-100 flex items-center justify-center text-blue-600 font-black text-xl uppercase">
                        {spec.display_name ? spec.display_name[0] : "?"}
                      </div>
                    )}
                  </div>

                  <div className="text-left flex-1 min-w-0">
                    <div className="font-bold text-lg truncate text-slate-800">{spec.display_name}</div>
                    <div className="text-xs font-black text-blue-500 uppercase tracking-widest mt-0.5">
                      {spec.position || "Мастер"}
                    </div>

                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveReviewMaster(spec);
                      }}
                      className="inline-flex items-center gap-1 mt-1 bg-amber-50 hover:bg-amber-100 border border-amber-100/50 px-2 py-0.5 rounded-full transition-colors group/rating"
                    >
                      <Star size={11} fill="#f59e0b" className="text-amber-500 transition-transform group-hover/rating:scale-110 duration-200" />
                      <span className="text-xs font-bold text-amber-700">
                        {spec.rating_avg > 0 ? spec.rating_avg.toFixed(1) : "0.0"}
                      </span>
                      <span className="text-[10px] font-medium text-amber-600/80 underline decoration-dotted">
                        ({spec.reviews_count || 0} отв.)
                      </span>
                    </div>
                  </div>

                  <ChevronRight className="ml-auto text-slate-200 group-hover:text-blue-500 transition-colors shrink-0" />
                </div>
              ))
            )}

            <MasterReviewsModal
              specialist={activeReviewMaster}
              isOpen={activeReviewMaster !== null}
              onClose={() => setActiveReviewMaster(null)}
            />
          </div>
        )}

        {/* STEP 4: CALENDAR & SLOTS */}
        {step === 4 && (
          <div className="space-y-6 animate-in slide-in-from-right-8 duration-500">
            <h2 className="text-2xl font-black">Когда удобно?</h2>

            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <h3 className="font-black text-xl capitalize">
                  {currentMonth.toLocaleString('ru', { month: 'long', year: 'numeric' })}
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const now = new Date();
                      const prev = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
                      if (prev.getFullYear() > now.getFullYear() || (prev.getFullYear() === now.getFullYear() && prev.getMonth() >= now.getMonth())) {
                        setCurrentMonth(prev);
                      }
                    }}
                    disabled={
                      currentMonth.getFullYear() === new Date().getFullYear() &&
                      currentMonth.getMonth() === new Date().getMonth()
                    }
                    className="p-3 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={20} />
                  </button>

                  <button
                    onClick={() => {
                      const now = new Date();
                      const next = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
                      const maxDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);

                      if (next <= maxDate) {
                        setCurrentMonth(next);
                      }
                    }}
                    disabled={(() => {
                      const now = new Date();
                      const maxDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
                      return currentMonth.getFullYear() === maxDate.getFullYear() && currentMonth.getMonth() === maxDate.getMonth();
                    })()}
                    className="p-3 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center mb-4">
                {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(d => (
                  <span key={d} className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{d}</span>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-2">
                {calendarDays.map((day, i) => {
                  if (!day) return <div key={`empty-${i}`} />;

                  const isSelected = day.toDateString() === selectedDate.toDateString();

                  const todayStart = new Date();
                  todayStart.setHours(0, 0, 0, 0);
                  const isPast = day < todayStart;

                  const now = new Date();
                  const maxDate = new Date(now.getFullYear(), now.getMonth() + 2, 0, 23, 59, 59);
                  const isTooFar = day > maxDate;

                  const dY = day.getFullYear();
                  const dM = String(day.getMonth() + 1).padStart(2, '0');
                  const dD = String(day.getDate()).padStart(2, '0');
                  const formattedDay = `${dY}-${dM}-${dD}`;

                  const isWorking = Array.isArray(availableDays) && availableDays.includes(formattedDay);
                  const isDisabled = isPast || isTooFar || !isWorking;

                  return (
                    <button
                      key={day.toISOString()}
                      disabled={isDisabled}
                      onClick={() => {
                        setSelectedDate(day);
                        setSelectedSlot(null);
                      }}
                      className={`aspect-square flex items-center justify-center rounded-2xl text-sm font-black transition-all
                ${isSelected ? 'bg-blue-600 text-white shadow-xl shadow-blue-200 scale-110' : 'hover:bg-slate-50 text-slate-700'}
                ${isDisabled ? 'opacity-20 cursor-not-allowed grayscale pointer-events-none' : ''}`}
                    >
                      {day.getDate()}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Доступное время</p>

              {loadingSlots ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 animate-pulse">
                  {[1, 2, 3, 4].map((n) => (
                    <div key={n} className="h-14 bg-slate-100 rounded-2xl" />
                  ))}
                </div>
              ) : liveSlots.length > 0 ? (
                <div
                  className={`grid grid-cols-4 gap-2 transition-opacity duration-200 ${isFetching ? 'opacity-50 pointer-events-none' : 'opacity-100'
                    }`}
                >
                  {liveSlots.map(slot => (
                    <button
                      key={slot}
                      onClick={() => setSelectedSlot(slot)}
                      className={`p-4 rounded-2xl border-2 font-black text-sm transition-all ${selectedSlot === slot
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xl'
                        : 'bg-white text-slate-600 border-slate-50 hover:border-blue-200'
                        }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-100 text-slate-400 font-bold italic text-sm">
                  Нет свободных окон
                </div>
              )}
            </div>

            {selectedSlot && (
              <button
                onClick={() => setStep(5)}
                className="w-full bg-blue-600 text-white p-6 rounded-[2rem] font-black shadow-2xl shadow-blue-200 animate-in fade-in zoom-in duration-300 uppercase tracking-widest text-sm"
              >
                Продолжить
              </button>
            )}
          </div>
        )}

        {/* STEP 5: CONFIRMATION */}
        {step === 5 && (
          <div className="space-y-6 animate-in zoom-in-95 duration-500">
            <h2 className="text-3xl font-black text-center mb-2">Все верно?</h2>
            <p className="text-xs text-slate-400 font-black uppercase tracking-wider text-center mb-6">
              Проверьте детали перед подтверждением
            </p>

            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
              <div className="space-y-4">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Выбранные услуги</p>

                <div className="space-y-3">
                  {selectedServices.map((s: any) => (
                    <div 
                      key={s.id} 
                      className="flex justify-between items-center bg-slate-50/50 p-4 rounded-[2rem] border border-slate-100/50 group relative"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-[1.5rem] bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center border border-slate-200/60">
                          {s.photo ? (
                            <img src={s.photo} alt={s.name} className="w-full h-full object-cover" />
                          ) : (
                            <Scissors size={20} className="text-slate-400" />
                          )}
                        </div>

                        <div>
                          <p className="font-black text-base text-slate-800 leading-tight mb-1">{s.name}</p>
                          {s.description && <p className="text-xs text-gray-400 line-clamp-1 mb-1 font-medium">{s.description}</p>}
                          <p className="text-xs font-black text-slate-400 uppercase tracking-wider">{s.duration} мин.</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <p className="text-sm font-black text-blue-600 shrink-0 bg-blue-50 px-3 py-1.5 rounded-xl">{s.price} ₽</p>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = selectedServices.filter((item: any) => item.id !== s.id);
                            setSelectedServices(updated);
                            if (updated.length === 0) {
                              setStep(2);
                              enqueueSnackbar("Выберите хотя бы одну услугу", { variant: "info" });
                            }
                          }}
                          className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all active:scale-90"
                          title="Удалить услугу"
                        >
                          <X size={16} strokeWidth={2.5} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-dashed border-slate-100 flex justify-between items-center text-slate-400 text-[10px] font-black uppercase tracking-widest px-2">
                  <span>Итого: {totalDuration} мин</span>
                  <span className="text-slate-900 font-black text-2xl normal-case">{totalPrice} ₽</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-5 rounded-[2rem] border border-slate-100/70">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Мастер</p>
                  <p className="font-bold text-slate-800 text-sm truncate">{selectedSpecialist?.display_name}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Дата и время</p>
                  <p className="font-bold text-slate-800 text-sm">
                    {selectedDate.toLocaleDateString('ru', { day: 'numeric', month: 'short' })} в {selectedSlot}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {!isAuth ? (
                <div className="bg-white border border-slate-100 rounded-[2.5rem] p-4 shadow-sm space-y-3">
                  <div className="relative group bg-slate-50 rounded-[1.5rem] border border-slate-100/80">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                      <User size={16} strokeWidth={2.5} />
                    </div>
                    <input 
                      placeholder="Ваше имя" 
                      className="w-full pl-12 pr-4 py-4 bg-transparent font-bold text-slate-800 placeholder-slate-400 focus:outline-none text-sm" 
                      value={clientName} 
                      onChange={(e) => setClientName(e.target.value)} 
                    />
                  </div>

                  <div className="relative group bg-slate-50 rounded-[1.5rem] border border-slate-100/80">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                      <Phone size={16} strokeWidth={2.5} />
                    </div>
                    <input 
                      type="tel" 
                      placeholder="+7 (999) 999-99-99" 
                      className="w-full pl-12 pr-4 py-4 bg-transparent font-bold text-slate-800 placeholder-slate-400 focus:outline-none text-sm tabular-nums" 
                      value={clientPhone} 
                      onBlur={handlePhoneBlur} 
                      onChange={(e) => {
                        const formatted = formatPhoneNumber(e.target.value);
                        setClientPhone(formatted);
                      }} 
                    />
                  </div>

                  {(userStatus === "exists" || userStatus === "new") && (
                    <div className="relative group bg-slate-100/50 rounded-[1.5rem] border border-slate-200/40 animate-in slide-in-from-top-2 duration-200">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                        <Lock size={16} strokeWidth={2.5} />
                      </div>
                      <input 
                        type="password" 
                        placeholder={userStatus === "exists" ? "Пароль для входа" : "Придумайте пароль"} 
                        className="w-full pl-12 pr-28 py-4 bg-transparent font-bold text-slate-800 placeholder-slate-400 focus:outline-none text-sm" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                      />
                      
                      <div className="absolute inset-y-0 right-3 flex items-center">
                        <span className="text-[9px] font-black text-blue-600 bg-blue-50 border border-blue-100 px-2 py-1 rounded-xl uppercase tracking-wider flex items-center gap-1.5">
                          <span className="relative flex h-1 w-1">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1 w-1 bg-blue-500"></span>
                          </span>
                          {userStatus === "exists" ? "Есть профиль" : "Новый"}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 bg-emerald-50 text-emerald-600 rounded-[2rem] font-black text-center border border-emerald-100 flex items-center justify-center gap-2 text-xs tracking-widest uppercase animate-in zoom-in-95 duration-200">
                  <div className="p-0.5 bg-emerald-500 rounded-full text-white">
                    <Check size={12} strokeWidth={3} />
                  </div>
                  Данные верифицированы
                </div>
              )}

              <button
                onClick={handleBooking}
                disabled={isGlobalLoading}
                className="w-full bg-blue-600 text-white p-6 rounded-[2rem] font-black shadow-2xl shadow-blue-200 hover:bg-blue-700 transition-all active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2 uppercase tracking-widest text-sm"
              >
                {isGlobalLoading ? (
                  <Loader2 className="animate-spin text-white" size={18} />
                ) : (
                  <>
                    <span>Подтвердить запись</span>
                    <ArrowRight size={16} strokeWidth={2.5} />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}