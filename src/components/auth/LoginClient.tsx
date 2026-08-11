"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Smartphone, Lock, Loader2, ArrowLeft } from "lucide-react";
import { useSnackbar } from 'notistack';
import { PatternFormat } from "react-number-format";

const BASE_URL = 'https://api.wopp.ru';
const YANDEX_URL = 'https://wopp.ru'
type LoginStep = 'credentials' | 'password_setup';

export default function LoginClient() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [step, setStep] = useState<LoginStep>('credentials');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();

  const origin = typeof window !== "undefined" ? window.location.origin : `${YANDEX_URL}`;

  const YANDEX_CLIENT_ID = "ffa5eaad181c4b8bb132882f3cc7488c";
  const yandexRedirect = `${origin}/auth/callback/yandex`;
  const yandexOAuthUrl = `https://oauth.yandex.ru/authorize?response_type=code&client_id=${YANDEX_CLIENT_ID}&redirect_uri=${encodeURIComponent(yandexRedirect)}`;

  const getCleanPhone = () => {
    let digits = phone.replace(/\D/g, "");
    if (digits.length === 10) digits = "7" + digits;
    else if (digits.length === 11 && digits.startsWith("8")) digits = "7" + digits.substring(1);
    return "+" + digits;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const formattedUsername = getCleanPhone();
    setLoading(true);

    try {
      const res = await fetch(`${BASE_URL}/api/accounts/token/pair`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: formattedUsername, password }),
      });

      const data = await res.json();

      if (res.ok) {
        if (data.need_password_setup) {
          setStep('password_setup');
          enqueueSnackbar(data.message || 'Пожалуйста, установите ваш личный пароль.', { variant: 'info' });
        } else {
          localStorage.setItem("token", data.access);
          localStorage.setItem("refresh_token", data.refresh);
          router.push("/cabinet");
        }
      } else {
        enqueueSnackbar(data.detail || 'Неверный номер телефона или пароль.', { variant: 'error' });
      }
    } catch (err) {
      enqueueSnackbar('Ошибка подключения к серверу.', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword.length < 6) {
      enqueueSnackbar('Пароль должен быть не менее 6 символов.', { variant: 'warning' });
      return;
    }

    setLoading(true);
    const formattedUsername = getCleanPhone();

    try {
      const res = await fetch(`${BASE_URL}/api/accounts/setup-first-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: formattedUsername, password: newPassword }),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("token", data.access);
        localStorage.setItem("refresh_token", data.refresh);
        enqueueSnackbar('Пароль успешно сохранен!', { variant: 'success' });
        router.push("/cabinet");
      } else {
        enqueueSnackbar(data.message || 'Ошибка при установке пароля.', { variant: 'error' });
      }
    } catch (err) {
      enqueueSnackbar('Ошибка подключения к серверу.', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFDFF] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl shadow-slate-200/50 p-8 border border-slate-100">
        
        {step === 'password_setup' && (
          <button 
            onClick={() => setStep('credentials')} 
            className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-slate-900 transition-colors mb-4"
          >
            <ArrowLeft size={14} /> Назад
          </button>
        )}

        <div className="text-center mb-10">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            {step === 'credentials' ? "Вход" : "Новый пароль"}
          </h1>
          <p className="text-slate-400 mt-2 text-sm font-medium">
            {step === 'credentials' 
              ? "Рады видеть вас снова!" 
              : "Администратор создал ваш профиль. Придумайте пароль для входа."
            }
          </p>
        </div>

        {step === 'credentials' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative group">
              <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors z-10" size={18} />
              <PatternFormat
                format="+7 (###) ###-##-##"
                allowEmptyFormatting
                mask="_"
                type="tel"
                value={phone}
                onValueChange={(values) => setPhone(values.value)}
                placeholder="Номер телефона"
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all font-medium"
              />
            </div>

            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={18} />
              <input
                type="password"
                placeholder="Пароль"
                autoComplete="current-password"
                value={password}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all font-medium"
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-black transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-200 active:scale-[0.98]"
            >
              {loading ? <Loader2 className="animate-spin" /> : "Войти"}
            </button>
          </form>
        )}

        {step === 'password_setup' && (
          <form onSubmit={handlePasswordSetup} className="space-y-4">
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={18} />
              <input
                type="password"
                placeholder="Создайте сложный пароль"
                autoComplete="new-password"
                value={newPassword}
                required
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all font-medium"
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-100 active:scale-[0.98]"
            >
              {loading ? <Loader2 className="animate-spin" /> : "Сохранить пароль"}
            </button>
          </form>
        )}

        {step === 'credentials' && (
          <>
            <div className="relative my-8 text-center">
              <span className="bg-white px-4 text-xs font-bold text-slate-300 uppercase tracking-widest relative z-10">или</span>
              <div className="absolute top-1/2 left-0 w-full border-t border-slate-100"></div>
            </div>

            <div className="space-y-3">
              <a
                href={yandexOAuthUrl}
                suppressHydrationWarning={true}
                className="w-full bg-[#FC3F1D] text-white py-3.5 rounded-2xl font-bold hover:bg-[#e33516] transition-all flex items-center justify-center gap-2 shadow-md shadow-red-100 active:scale-[0.98] text-sm"
              >
                <span className="bg-white text-[#FC3F1D] font-black w-5 h-5 rounded-full flex items-center justify-center text-xs leading-none pt-[1px]">
                  Я
                </span>
                Войти с Яндекс ID
              </a>

              <p className="text-center text-[11px] text-slate-400 px-2 leading-relaxed pt-2">
                Вход через соцсети автоматически привязывается к вашему номеру телефона.
              </p>
            </div>

            <p className="text-center mt-8 text-slate-400 text-sm">
              Нет аккаунта?{" "}
              <button onClick={() => router.push("/register")} className="cursor-pointer font-bold hover:bg-gray-100 p-2 rounded-lg">
                Создать
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}