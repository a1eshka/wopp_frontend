"use client";

import React, { useState, useRef, ChangeEvent, useEffect } from 'react';
import { 
  Building2, MapPin, Phone, Camera, Save, Loader2, X, 
  ShieldCheck, Clock, Globe, Check,
  AlertCircle, Link2, Image as ImageIcon, Send,
  RefreshCw, Copy, Sparkles, 
  ArrowUpRight, Hash, Command, RotateCcw, Lock
} from 'lucide-react';
import { enqueueSnackbar } from 'notistack';
import { AddressSuggestions, DaDataAddress, DaDataSuggestion } from 'react-dadata';

import 'react-dadata/dist/react-dadata.css';
import { useOrganizationInfo } from "@/app/api/hooks"; 

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.wopp.ru';

// Форматирование номера телефона в формате +7 (XXX) XXX-XX-XX
const formatPhoneNumber = (value: string) => {
  if (!value) return value;
  const phoneNumber = value.replace(/[^\d]/g, '');
  const phoneNumberLength = phoneNumber.length;

  if (phoneNumberLength < 4) return `+7${phoneNumber.slice(1)}`;
  if (phoneNumberLength < 7) {
    return `+7 (${phoneNumber.slice(1, 4)}) ${phoneNumber.slice(4)}`;
  }
  if (phoneNumberLength < 9) {
    return `+7 (${phoneNumber.slice(1, 4)}) ${phoneNumber.slice(4, 7)}-${phoneNumber.slice(7)}`;
  }
  return `+7 (${phoneNumber.slice(1, 4)}) ${phoneNumber.slice(4, 7)}-${phoneNumber.slice(7, 9)}-${phoneNumber.slice(9, 11)}`;
};

export default function OrganizationProfileUltraCleanLightBento({ organizationId }: { organizationId: string | number }) {
  const { data: orgData, isLoading: isQueryLoading, isError, refetch } = useOrganizationInfo(organizationId);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    legal_type: 'SELF',
    legal_name: '',
    inn: '',
    slug: '',
    cancel_window_hours: 3,
    site_url: '',
    vk_url: '',
    telegram_url: '',
    instagram_url: '',
  });

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  const [saveLoading, setSaveLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (orgData) {
      setFormData({
        name: orgData.name || '',
        phone: orgData.phone || '',
        address: orgData.address || '',
        legal_type: orgData.legal_type || 'SELF',
        legal_name: orgData.legal_name || '',
        inn: orgData.inn || '',
        slug: orgData.slug || '',
        cancel_window_hours: orgData.cancel_window_hours || 3,
        site_url: orgData.site_url || '',
        vk_url: orgData.vk_url || '',
        telegram_url: orgData.telegram_url || '',
        instagram_url: orgData.instagram_url || '',
      });
      setLogoPreview(orgData.logo || null);
      setCoverPreview(orgData.cover || null);
      setLogoFile(null);
      setCoverFile(null);
      setIsDirty(false);
    }
  }, [orgData]);

  // Освобождаем память при создании Blob URL
  useEffect(() => {
    return () => {
      if (logoPreview && logoPreview.startsWith('blob:')) URL.revokeObjectURL(logoPreview);
      if (coverPreview && coverPreview.startsWith('blob:')) URL.revokeObjectURL(coverPreview);
    };
  }, [logoPreview, coverPreview]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setIsDirty(true);

    if (name === 'phone') {
      const formatted = value.length > 0 ? formatPhoneNumber(value) : '';
      setFormData(prev => ({ ...prev, [name]: formatted }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>, type: 'logo' | 'cover') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsDirty(true);
    const objectUrl = URL.createObjectURL(file);

    if (type === 'logo') {
      setLogoFile(file);
      setLogoPreview(objectUrl);
    } else {
      setCoverFile(file);
      setCoverPreview(objectUrl);
    }
  };

  const copyToClipboard = (text: string, fieldName: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    enqueueSnackbar('Скопировано в буфер обмена', { variant: 'info' });
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleReset = () => {
    if (orgData) {
      setFormData({
        name: orgData.name || '',
        phone: orgData.phone || '',
        address: orgData.address || '',
        legal_type: orgData.legal_type || 'SELF',
        legal_name: orgData.legal_name || '',
        inn: orgData.inn || '',
        slug: orgData.slug || '',
        cancel_window_hours: orgData.cancel_window_hours || 3,
        site_url: orgData.site_url || '',
        vk_url: orgData.vk_url || '',
        telegram_url: orgData.telegram_url || '',
        instagram_url: orgData.instagram_url || '',
      });
      setLogoPreview(orgData.logo || null);
      setCoverPreview(orgData.cover || null);
      setLogoFile(null);
      setCoverFile(null);
      setIsDirty(false);
    }
  };

  const handleSubmit = async () => {
    if (!orgData) return;
    setSaveLoading(true);
    
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
    const data = new FormData();
    
    Object.entries(formData).forEach(([key, value]) => data.append(key, String(value)));
    
    if (logoFile) data.append('logo', logoFile);
    else if (!logoPreview && orgData.logo) data.append('remove_logo', 'true');

    if (coverFile) data.append('cover', coverFile);
    else if (!coverPreview && orgData.cover) data.append('remove_cover', 'true');

    try {
      const res = await fetch(`${API_BASE_URL}/api/organizations/update`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${token}`
        },
        body: data
      });

      if (!res.ok) throw new Error('Ошибка сервера');

      setSuccess(true);
      setIsDirty(false);
      enqueueSnackbar('Профиль успешно обновлён', { variant: 'success' });
      
      refetch();
      setTimeout(() => setSuccess(false), 2500);
    } catch (err) {
      enqueueSnackbar('Не удалось сохранить изменения', { variant: 'error' });
    } finally {
      setSaveLoading(false);
    }
  };

  const isInnValid = () => {
    const innLength = formData.inn.replace(/\D/g, '').length;
    if (formData.legal_type === 'OOO') return innLength === 10;
    return innLength === 12;
  };

  if (isQueryLoading) {
    return (
      <div className="min-h-[70vh] w-full flex flex-col items-center justify-center p-8 bg-[#F8FAFC]">
        <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-center mb-4 animate-pulse">
          <Loader2 className="animate-spin text-slate-900" size={24} />
        </div>
        <p className="text-[11px] font-mono text-slate-400 uppercase tracking-widest">Загрузка данных организации...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-[60vh] w-full flex flex-col items-center justify-center p-8 text-center bg-[#F8FAFC]">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mb-4 shadow-xs">
          <AlertCircle size={26} />
        </div>
        <h3 className="text-sm font-bold text-slate-900">Ошибка подключения</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-xs">Не удалось загрузить параметры профиля из базы данных.</p>
        <button 
          onClick={() => refetch()} 
          className="mt-6 inline-flex items-center gap-2 h-11 px-6 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs sm:text-sm rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
        >
          <RefreshCw size={15} /> Повторить попытку
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-5 py-6 px-4 sm:px-6 antialiased text-slate-900 bg-[#F8FAFC] min-h-screen">
      
      {/* Скрытые инпуты для загрузки файлов */}
      <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'logo')} />
      <input type="file" ref={coverInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'cover')} />

      {/* ВЕРХНЯЯ ПАНЕЛЬ С ЗАГОЛОВКОМ И ДЕЙСТВИЯМИ */}
      <div className="bg-white rounded-[24px] p-5 sm:p-6 border border-slate-200/80 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden">
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 text-slate-900 flex items-center justify-center shrink-0 shadow-xs">
            <Command size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                {formData.name || 'Профиль организации'}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-slate-100 text-slate-600 border border-slate-200/60">
                ID: {orgData?.id || organizationId}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-normal mt-0.5">
              Настройка публичной карточки салона, контактных данных и логики бронирования
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 relative z-10">
          <button 
            onClick={() => window.open(`/b/${orgData?.short_code || ''}`, '_blank')}
            className="h-11 px-5 rounded-xl text-xs sm:text-sm font-medium text-slate-800 bg-slate-100/80 hover:bg-slate-200/70 border border-slate-200 transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
          >
            <Globe size={15} className="text-slate-500"/>
            Открыть витрину
            <ArrowUpRight size={14} className="text-slate-500" />
          </button>

          <button 
            onClick={handleSubmit}
            disabled={saveLoading || !isInnValid()}
            className={`h-11 px-6 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all active:scale-95 shadow-xs cursor-pointer ${
              success 
                ? 'bg-emerald-600 text-white' 
                : 'bg-slate-900 hover:bg-slate-800 text-white disabled:opacity-40 disabled:pointer-events-none'
            }`}
          >
            {saveLoading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : success ? (
              <>
                <Check size={16}/> Сохранено
              </>
            ) : (
              <>
                <Save size={16}/> Сохранить
              </>
            )}
          </button>
        </div>
      </div>

      {/* СЕТКА BENTO GRID */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        
        {/* BENTO 1: Логотип бренда (Col 4) */}
        <div className="md:col-span-4 bg-white rounded-[24px] p-5 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-between hover:border-slate-300 transition-all group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles size={13} className="text-slate-900" /> Логотип бренда
            </span>
            <span className="text-[10px] font-mono text-slate-400">1:1 Формат</span>
          </div>

          <div className="flex flex-col items-center my-2">
            <div 
              className="relative cursor-pointer"
              onClick={() => logoInputRef.current?.click()}
            >
              <div className="w-32 h-32 rounded-[20px] bg-slate-50 border border-dashed border-slate-200 p-2 flex items-center justify-center overflow-hidden transition-all group-hover:border-slate-400 group-hover:bg-slate-100/50">
                {logoPreview ? (
                  <img src={logoPreview} className="w-full h-full object-cover rounded-[14px]" alt="Логотип" />
                ) : (
                  <div className="text-center p-3">
                    <div className="w-10 h-10 rounded-xl bg-white text-slate-900 flex items-center justify-center mx-auto mb-2 border border-slate-200 shadow-2xs">
                      <Building2 size={20} />
                    </div>
                    <span className="text-[11px] font-medium text-slate-400 block">Загрузить лого</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-2xs rounded-[20px] flex flex-col items-center justify-center opacity-0 hover:opacity-100 transition-all text-white gap-1">
                  <Camera size={20} />
                  <span className="text-[10px] font-medium">Изменить</span>
                </div>
              </div>

              {logoPreview && (
                <button 
                  onClick={(e) => {e.stopPropagation(); setLogoPreview(null); setLogoFile(null); setIsDirty(true);}} 
                  className="absolute -top-1.5 -right-1.5 bg-rose-500 hover:bg-rose-600 text-white p-1.5 rounded-full shadow-xs transition-all cursor-pointer"
                >
                  <X size={11}/>
                </button>
              )}
            </div>
          </div>

          <p className="text-[11px] text-slate-400 text-center font-normal">
            Используется в иконке бота и шапке записи клиентов
          </p>
        </div>

        {/* BENTO 2: Обложка витрины (Col 8) */}
        <div className="md:col-span-8 bg-white rounded-[24px] p-5 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-between hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <ImageIcon size={13} className="text-slate-900" /> Обложка витрины
            </span>
            <span className="text-[10px] font-mono text-slate-400">1200 × 400 px</span>
          </div>

          <div 
            onClick={() => coverInputRef.current?.click()}
            className="relative h-36 rounded-[18px] border border-dashed border-slate-200 bg-slate-50/60 overflow-hidden flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-slate-400 hover:bg-slate-100/50 transition-all group"
          >
            {coverPreview ? (
              <>
                <img src={coverPreview} className="w-full h-full object-cover" alt="Обложка" />
                <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-2xs flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all text-white gap-1">
                  <Camera size={20} />
                  <span className="text-[10px] font-medium">Обновить обложку</span>
                </div>
              </>
            ) : (
              <>
                <div className="w-10 h-10 rounded-xl bg-white text-slate-400 flex items-center justify-center border border-slate-200 shadow-2xs">
                  <ImageIcon size={18} />
                </div>
                <span className="text-[11px] font-medium text-slate-500">Нажмите для выбора изображения обложки</span>
              </>
            )}
            
            {coverPreview && (
              <button 
                onClick={(e) => {e.stopPropagation(); setCoverPreview(null); setCoverFile(null); setIsDirty(true);}} 
                className="absolute top-2.5 right-2.5 bg-rose-500 hover:bg-rose-600 text-white p-1.5 rounded-full shadow-xs transition-all cursor-pointer"
              >
                <X size={11}/>
              </button>
            )}
          </div>

          <p className="text-[11px] text-slate-400 font-normal mt-3">
            Главный баннер вверху каталога услуг в Telegram Mini App
          </p>
        </div>

        {/* BENTO 3: Основная информация с DaData (Col 8) */}
        <div className="md:col-span-8 bg-white rounded-[24px] p-6 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-4 hover:border-slate-300 transition-all">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <Building2 size={16} className="text-slate-900" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">Основные контакты</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2 space-y-1">
              <label className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                Название организации <Lock size={10} className="text-slate-400" />
              </label>
              <input 
                name="name" 
                disabled
                value={formData.name} 
                onChange={handleChange} 
                className="w-full h-11 text-xs sm:text-sm bg-slate-100/70 border border-slate-200/60 rounded-xl px-3.5 text-slate-500 font-medium outline-none cursor-not-allowed" 
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-slate-500">Контактный телефон</label>
              <div className="relative">
                <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 z-10" />
                <input 
                  type="tel"
                  name="phone" 
                  value={formData.phone} 
                  onChange={handleChange} 
                  className="w-full h-11 text-xs sm:text-sm bg-slate-50/50 border border-slate-200 focus:bg-white rounded-xl pl-10 pr-3.5 text-slate-900 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 font-medium transition-all" 
                  placeholder="+7 (999) 000-00-00"
                />
              </div>
            </div>

            {/* Подсказки адреса через Dadata */}
            <div className="space-y-1 relative">
              <label className="text-[11px] font-medium text-slate-500">Адрес объекта / Салона</label>
              <div className="relative dadata-custom-wrapper">
                <MapPin size={15} className="absolute left-3.5 top-3.5 text-slate-400 z-20 pointer-events-none" />
                
                <AddressSuggestions
                  token={process.env.NEXT_PUBLIC_DADATA_API_KEY || ""}
                  value={formData.address ? { value: formData.address, unfiltered_value: formData.address } : undefined}
                  onChange={(suggestion?: DaDataSuggestion<DaDataAddress>) => {
                    if (suggestion) {
                      setFormData(prev => ({ ...prev, address: suggestion.value }));
                      setIsDirty(true);
                    }
                  }}
                  inputProps={{
                    placeholder: "г. Санкт-Петербург, Невский пр...",
                    className: "w-full h-11 text-xs sm:text-sm bg-slate-50/50 border border-slate-200 focus:bg-white rounded-xl pl-10 pr-3.5 text-slate-900 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 font-medium transition-all"
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* BENTO 4: Системные данные (Col 4) */}
        <div className="md:col-span-4 bg-white rounded-[24px] p-6 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-between space-y-4 hover:border-slate-300 transition-all">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Hash size={16} className="text-slate-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Идентификаторы</h2>
          </div>

          <div className="space-y-2.5">
            <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/60 flex items-center justify-between">
              <div>
                <span className="text-[9px] font-mono text-slate-400 uppercase block">Адресный Slug</span>
                <span className="font-mono text-xs font-bold text-slate-800">{orgData?.slug || '—'}</span>
              </div>
              <button 
                type="button"
                onClick={() => copyToClipboard(orgData?.slug || '', 'slug')}
                className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-200/60 rounded-lg transition-all active:scale-90 cursor-pointer"
              >
                {copiedField === 'slug' ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
              </button>
            </div>

            <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/60 flex items-center justify-between">
              <div>
                <span className="text-[9px] font-mono text-slate-400 uppercase block">Короткий код</span>
                <span className="font-mono text-xs font-bold text-slate-800">{orgData?.short_code || '—'}</span>
              </div>
              <button 
                type="button"
                onClick={() => copyToClipboard(orgData?.short_code || '', 'code')}
                className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-200/60 rounded-lg transition-all active:scale-90 cursor-pointer"
              >
                {copiedField === 'code' ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
              </button>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 leading-normal">
            Используются для формирования быстрых ссылок и QR-кодов.
          </p>
        </div>

        {/* BENTO 5: Telegram Синхронизация (Col 6) */}
        <div className="md:col-span-6 bg-slate-900 text-white rounded-[24px] p-6 border border-slate-800 shadow-[0_4px_20px_rgba(15,23,42,0.08)] flex flex-col justify-between relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-white/10 text-sky-400 flex items-center justify-center">
              <Send size={18} />
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              ● Активно
            </span>
          </div>

          <div className="my-5 space-y-1">
            <h3 className="text-sm font-bold text-white">Бот онлайн-записи Telegram</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Уведомление клиентов о записи или отмене. Напоминание о начале записи за 24 часа.
            </p>
          </div>
        </div>

        {/* BENTO 6: Правила отмены записи (Col 6) */}
        <div className="md:col-span-6 bg-white rounded-[24px] p-6 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-between space-y-4 hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Clock size={16} className="text-amber-500" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">Бесплатная отмена</h2>
            </div>
            <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 border border-slate-200 font-mono text-xs text-slate-900 font-bold">
              за {formData.cancel_window_hours} ч.
            </span>
          </div>

          <div className="space-y-2">
            <input 
              type="range" 
              name="cancel_window_hours" 
              min="0" 
              max="72" 
              step="1" 
              value={formData.cancel_window_hours} 
              onChange={handleChange}
              className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-slate-900" 
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-400">
              <span>0 ч (Без ограничений)</span>
              <span>24 ч</span>
              <span>48 ч</span>
              <span>72 ч</span>
            </div>
          </div>

          <p className="text-[11px] text-slate-400">
            Минимальный срок до визита, за который клиент может бесплатно отменить запись.
          </p>
        </div>

        {/* BENTO 7: Юридическая информация (Col 7) */}
        <div className="md:col-span-7 bg-white rounded-[24px] p-6 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-4 hover:border-slate-300 transition-all">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <ShieldCheck size={16} className="text-emerald-600" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">Юридический статус</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-slate-500">Форма деятельности</label>
              <select 
                name="legal_type" 
                value={formData.legal_type} 
                onChange={handleChange} 
                className="w-full h-11 text-xs sm:text-sm bg-slate-50/50 border border-slate-200 rounded-xl px-3.5 text-slate-900 outline-none focus:border-slate-900 font-medium transition-all cursor-pointer"
              >
                <option value="SELF">Самозанятый (ФЛ)</option>
                <option value="IP">Индивидуальный предприниматель (ИП)</option>
                <option value="OOO">Общество с ограниченной ответственностью (ООО)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-slate-500">ИНН ({formData.legal_type === 'OOO' ? '10' : '12'} цифр)</label>
              <input 
                name="inn" 
                value={formData.inn} 
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  setFormData(prev => ({ ...prev, inn: val }));
                  setIsDirty(true);
                }} 
                maxLength={12} 
                className={`w-full h-11 text-xs sm:text-sm bg-slate-50/50 border rounded-xl px-3.5 font-mono font-medium transition-all ${
                  formData.inn.length > 0 
                    ? (isInnValid() ? 'border-emerald-500 text-emerald-900' : 'border-rose-400 text-rose-900')
                    : 'border-slate-200 text-slate-900 focus:border-slate-900'
                }`}
                placeholder="000000000000"
              />
            </div>

            <div className="sm:col-span-2 space-y-1">
              <label className="text-[11px] font-medium text-slate-500">Официальное наименование</label>
              <input 
                name="legal_name" 
                value={formData.legal_name} 
                onChange={handleChange} 
                className="w-full h-11 text-xs sm:text-sm bg-slate-50/50 border border-slate-200 rounded-xl px-3.5 text-slate-900 outline-none focus:border-slate-900 font-medium" 
                placeholder="Например: ИП Иванов Иван Иванович" 
              />
            </div>
          </div>
        </div>

        {/* BENTO 8: Внешние ресурсы и соцсети (Col 5) */}
        <div className="md:col-span-5 bg-white rounded-[24px] p-6 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-4 hover:border-slate-300 transition-all">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <Link2 size={16} className="text-slate-900" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">Ссылки и соцсети</h2>
          </div>

          <div className="space-y-3">
            {/* Сайт */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-slate-500 flex items-center gap-1.5">
                <Globe size={13} className="text-slate-400" /> Веб-сайт
              </label>
              <input 
                type="url"
                name="site_url" 
                value={formData.site_url} 
                onChange={handleChange} 
                placeholder="https://mysalon.ru"
                className="w-full h-10 text-xs sm:text-sm bg-slate-50/50 border border-slate-200 focus:bg-white rounded-xl px-3.5 text-slate-900 font-medium outline-none focus:border-slate-900 transition-all" 
              />
            </div>

            {/* Telegram */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-slate-500 flex items-center gap-1.5">
                <Send size={13} className="text-sky-500" /> Telegram (Канал или Чат)
              </label>
              <input 
                type="url"
                name="telegram_url" 
                value={formData.telegram_url} 
                onChange={handleChange} 
                placeholder="https://t.me/my_salon_channel"
                className="w-full h-10 text-xs sm:text-sm bg-slate-50/50 border border-slate-200 focus:bg-white rounded-xl px-3.5 text-slate-900 font-medium outline-none focus:border-slate-900 transition-all" 
              />
            </div>

            {/* ВКонтакте */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-slate-500 flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-full bg-blue-600 text-white font-bold text-[8px] flex items-center justify-center leading-none">VK</span> Группа ВКонтакте
              </label>
              <input 
                type="url"
                name="vk_url" 
                value={formData.vk_url} 
                onChange={handleChange} 
                placeholder="https://vk.com/my_salon_page"
                className="w-full h-10 text-xs sm:text-sm bg-slate-50/50 border border-slate-200 focus:bg-white rounded-xl px-3.5 text-slate-900 font-medium outline-none focus:border-slate-900 transition-all" 
              />
            </div>

            {/* Instagram */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-slate-500 flex items-center gap-1.5">
                <Camera size={13} className="text-pink-500" /> Instagram
              </label>
              <input 
                type="url"
                name="instagram_url" 
                value={formData.instagram_url} 
                onChange={handleChange} 
                placeholder="https://instagram.com/my_salon_profile"
                className="w-full h-10 text-xs sm:text-sm bg-slate-50/50 border border-slate-200 focus:bg-white rounded-xl px-3.5 text-slate-900 font-medium outline-none focus:border-slate-900 transition-all" 
              />
            </div>
          </div>
        </div>

      </div>

      {/* ВСПЛЫВАЮЩАЯ ПАНЕЛЬ СОХРАНЕНИЯ (FLOATING DOCK) */}
      {isDirty && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 text-white px-6 py-3.5 rounded-2xl shadow-[0_20px_40px_rgba(15,23,42,0.25)] border border-slate-800 backdrop-blur-xl flex items-center gap-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-xs sm:text-sm font-medium text-slate-200">Есть несохранённые изменения</span>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleReset}
              className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-400 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw size={14} /> Сбросить
            </button>
            <button
              onClick={handleSubmit}
              disabled={saveLoading || !isInnValid()}
              className="h-10 px-5 bg-white text-slate-900 hover:bg-slate-100 font-semibold text-xs sm:text-sm rounded-xl transition-all flex items-center gap-2 active:scale-95 disabled:opacity-40 cursor-pointer shadow-xs"
            >
              {saveLoading ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Сохранить
            </button>
          </div>
        </div>
      )}

    </div>
  );
}