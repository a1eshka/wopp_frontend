"use client";

import React, { useState, useRef, ChangeEvent, useEffect } from 'react';
import { 
  Camera, Save, Loader2, Check, AlertCircle, Info, 
  User, Phone, UserCheck, ArrowLeft, Trash2
} from 'lucide-react';
import { enqueueSnackbar } from 'notistack';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

const BASE_URL = 'https://api.wopp.ru'; 

export default function UserProfileSettings() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isWelcome = searchParams.get('welcome') === 'true';

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    patronymic: '',
    email: '',
    phone: '',
  });

  const [rawBackendData, setRawBackendData] = useState<any>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const [isQueryLoading, setIsQueryLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const photoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
        const res = await fetch(`${BASE_URL}/api/accounts/me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        });
        if (res.ok) {
          const data = await res.json();
          setRawBackendData(data);
          
          setFormData({
            first_name: data.user?.first_name || data.first_name || '',
            last_name: data.user?.last_name || data.last_name || '',
            patronymic: data.user?.patronymic || data.patronymic || '',
            email: data.user?.username || data.username || '', 
            phone: data.user?.phone || data.phone || '',
          });
          setPhotoPreview(data.user?.avatar || data.photo_url || null);
        }
      } catch (err) {
        enqueueSnackbar('Не удалось загрузить данные профиля', { variant: 'error' });
      } finally {
        setIsQueryLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      enqueueSnackbar('Файл слишком большой. Максимум 5МБ', { variant: 'error' });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoFile(file);
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!formData.first_name.trim()) {
      enqueueSnackbar('Имя обязательно для заполнения', { variant: 'error' });
      return;
    }

    setSaveLoading(true);
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
    const data = new FormData();
    data.append('first_name', formData.first_name);
    data.append('last_name', formData.last_name);
    data.append('patronymic', formData.patronymic);
    
    if (photoFile) {
      data.append('photo', photoFile);
    } else if (!photoPreview) {
      data.append('remove_photo', 'true');
    }

    try {
      const res = await fetch(`${BASE_URL}/api/accounts/profile/`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` },
        body: data
      });

      if (!res.ok) throw new Error('Ошибка сервера');
      
      const updatedData = await res.json();

      setSuccess(true);
      enqueueSnackbar('Профиль успешно обновлен!', { variant: 'success' });
      
      setRawBackendData((prev: any) => ({
        ...prev,
        user: { 
          ...prev?.user, 
          first_name: updatedData.first_name || formData.first_name, 
          avatar: updatedData.avatar || updatedData.photo_url || photoPreview 
        }
      }));

      setTimeout(() => {
        setSuccess(false);
        if (isWelcome || !isWelcome) router.push('/cabinet');
      }, 1500);
    } catch (err) {
      enqueueSnackbar('Ошибка при сохранении', { variant: 'error' });
    } finally {
      setSaveLoading(false);
    }
  };

  if (isQueryLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 text-xs tracking-widest">Загрузка профиля...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] text-slate-900 antialiased font-sans p-4 sm:p-6 md:p-10 selection:bg-blue-500/10">
      {/* Деликатные размытые свечения на фоне */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-500/[0.02] rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-indigo-500/[0.02] rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-4xl mx-auto space-y-8 relative z-10">
        <input 
          type="file" 
          ref={photoInputRef} 
          className="hidden" 
          accept="image/*" 
          onChange={handleFileChange} 
        />

        {/* ХЕДЕР НАСТРОЕК */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.push('/cabinet')}
              className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-500 hover:text-slate-900 transition-colors shadow-sm active:scale-[0.98] cursor-pointer"
              title="Назад"
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">Настройки профиля</h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Управление вашими личными данными и аккаунтом</p>
            </div>
          </div>

          {/* Унифицированная по высоте кнопка сохранения во всю ширину для мобилок */}
          <button 
            onClick={handleSubmit}
            disabled={saveLoading || !formData.first_name.trim()}
            className={`w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-bold transition-all active:scale-[0.97] cursor-pointer shadow-sm ${
              success 
                ? 'bg-emerald-500 text-white border border-emerald-500' 
                : 'bg-slate-950 hover:bg-slate-900 text-white disabled:opacity-40 disabled:pointer-events-none'
            }`}
          >
            {saveLoading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : success ? (
              <>
                <Check size={16} />
                <span>Сохранено</span>
              </>
            ) : (
              <>
                <Save size={16} />
                <span>Сохранить изменения</span>
              </>
            )}
          </button>
        </header>

        {/* ОСНОВНОЙ КОНТЕНТ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* ЛЕВАЯ КОЛОНКА: Аватар и Инфо */}
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-xl p-6 text-center shadow-[0_4px_20px_rgba(0,0,0,0.01)]">
              <div 
                className="relative inline-block group cursor-pointer" 
                onClick={() => photoInputRef.current?.click()}
              >
                <div className="w-28 h-28 rounded-full overflow-hidden border-2 bg-slate-50 flex items-center justify-center border-slate-200 ring-4 ring-slate-100/50 transition-all group-hover:ring-blue-500/10">
                  {photoPreview ? (
                    <img src={photoPreview} className="w-full h-full object-cover" alt="User Avatar" />
                  ) : (
                    <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-700 font-semibold text-2xl">
                      {formData.first_name ? formData.first_name[0] : <User size={28} />}
                    </div>
                  )}
                </div>
                <div className="absolute bottom-0 right-0 p-2 bg-slate-950 text-white rounded-full border-2 border-white shadow-md group-hover:bg-blue-600 transition-colors">
                  <Camera size={14} />
                </div>
              </div>
              
              <div className="mt-4">
                <button 
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                >
                  Обновить фото
                </button>
              </div>
              
              {photoPreview && (
                <button 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    setPhotoPreview(null); 
                    setPhotoFile(null); 
                  }} 
                  className="mt-3 inline-flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 font-bold text-[11px] uppercase tracking-wider rounded-lg hover:bg-red-100/80 transition-colors"
                >
                  <Trash2 size={12} />
                  Удалить фото
                </button>
              )}

              <div className="mt-6 pt-5 border-t border-slate-100">
                <div className="bg-blue-500/[0.01] border border-blue-500/10 rounded-xl p-4 flex gap-3 text-left">
                  <Info size={16} className="text-blue-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Профиль видят только мастера и организации, к которым вы записываетесь на сеансы.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ПРАВАЯ КОЛОНКА: Поля ввода формы */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Личные данные */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.01)] space-y-5">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="w-9 h-9 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                  <UserCheck size={18}/>
                </div>
                <h3 className="text-base font-bold text-slate-900">Личные данные</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-500 ml-0.5">Имя <span className="text-red-500">*</span></label>
                  <input 
                    name="first_name" 
                    value={formData.first_name} 
                    onChange={handleChange} 
                    className="w-full text-sm bg-white border border-slate-200 rounded-lg px-3.5 py-3 text-slate-900 outline-none focus:border-slate-400 font-medium placeholder:text-slate-400 transition-colors" 
                    placeholder="Иван"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-500 ml-0.5">Фамилия</label>
                  <input 
                    name="last_name" 
                    value={formData.last_name} 
                    onChange={handleChange} 
                    className="w-full text-sm bg-white border border-slate-200 rounded-lg px-3.5 py-3 text-slate-900 outline-none focus:border-slate-400 font-medium placeholder:text-slate-400 transition-colors" 
                    placeholder="Иванов"
                  />
                </div>

                <div className="md:col-span-2 space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-500 ml-0.5">Отчество</label>
                  <input 
                    name="patronymic" 
                    value={formData.patronymic} 
                    onChange={handleChange} 
                    className="w-full text-sm bg-white border border-slate-200 rounded-lg px-3.5 py-3 text-slate-900 outline-none focus:border-slate-400 font-medium placeholder:text-slate-400 transition-colors" 
                    placeholder="Иванович"
                  />
                </div>
              </div>
            </div>

            {/* Контакты и уведомления */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.01)] space-y-5">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="w-9 h-9 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center">
                  <Phone size={18}/>
                </div>
                <h3 className="text-base font-bold text-slate-900">Контакты и уведомления</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-500 ml-0.5">Номер телефона</label>
                  <input 
                    type="tel"
                    name="phone" 
                    disabled
                    value={formData.phone} 
                    className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-3 text-slate-400 outline-none font-medium cursor-not-allowed" 
                  />
                </div>
                
                {/* Сочный переработанный Telegram-компонент */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-500 ml-0.5">
                    Канал уведомлений WOPP
                  </label>
                  
                  {rawBackendData?.user?.telegram_id || rawBackendData?.telegram_id ? (
                    <div className="w-full flex items-center justify-between bg-emerald-500/[0.02] border border-emerald-500/30 rounded-lg px-3.5 py-2.5 h-[46px]">
                      <div className="flex items-center gap-2.5">
                        <div className="bg-emerald-50 p-1.5 rounded-md text-emerald-600">
                          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m22 2-7 20-4-9-9-4Z" />
                            <path d="M22 2 11 13" />
                          </svg>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-800">Telegram бот</span>
                          <span className="text-[11px] text-emerald-600 font-medium">Активен и подключен</span>
                        </div>
                      </div>
                      <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                    </div>
                  ) : (
                    <div className="w-full flex items-center justify-between bg-red-500/[0.01] border border-red-500/20 rounded-lg px-3.5 py-2.5 h-[46px]">
                      <div className="flex items-center gap-2.5">
                        <div className="bg-red-50 p-1.5 rounded-md text-red-500">
                          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m22 2-7 20-4-9-9-4Z" />
                            <path d="M22 2 11 13" />
                          </svg>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-800">Telegram бот</span>
                          <span className="text-[11px] text-red-500 font-medium">Не подключен</span>
                        </div>
                      </div>
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium pt-1.5">
                <AlertCircle size={14} className="text-slate-300 shrink-0" />
                <span>Номер телефона привязан при авторизации и не подлежит ручному изменению.</span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}