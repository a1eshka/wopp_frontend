"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { User, Smartphone, Lock, ArrowRight, Loader2 } from "lucide-react";
import { PatternFormat } from "react-number-format";
import { useSnackbar } from "notistack";
import Image from "next/image";

// Константа для адреса бэкенда
const BACKEND_URL = "https://api.wopp.ru";

export default function RegisterClient() {
  const [formData, setFormData] = useState({ firstName: "", phone: "", password: "" });
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    let digits = formData.phone.replace(/\D/g, "");

    if (digits.length < 10 || (digits.length === 11 && !digits.startsWith("7") && !digits.startsWith("8"))) {
      enqueueSnackbar("Пожалуйста, введите номер телефона полностью.", { variant: "warning" });
      return;
    }

    if (digits.length === 10) {
      digits = "7" + digits;
    } 
    else if (digits.length === 11 && digits.startsWith("8")) {
      digits = "7" + digits.substring(1);
    }

    const formattedPhone = "+" + digits;
    setLoading(true);

    try {
      const res = await fetch(`${BACKEND_URL}/api/accounts/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: formattedPhone,
          password: formData.password,
          first_name: formData.firstName
        }),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("token", data.access);
        localStorage.setItem("refresh_token", data.refresh);
        enqueueSnackbar("Регистрация успешна! Добро пожаловать.", { variant: "success" });
        router.push("/cabinet");
      } else {
        enqueueSnackbar(data.message || data.detail || "Ошибка регистрации.", { variant: "error" });
      }
    } catch (err) {
      enqueueSnackbar("Ошибка сервера или проблемы с сетью.", { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-xl p-8 border border-slate-100">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-slate-900">Создать аккаунт</h1>
          <p className="text-slate-500 mt-2">Присоединяйтесь к нам за пару кликов</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          {/* Поле Имени */}
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Ваше имя"
              required
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              onChange={(e) => setFormData({...formData, firstName: e.target.value})}
            />
          </div>

          {/* Поле Номера телефона с маской */}
          <div className="relative group">
            <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors z-10" size={20} />
            <PatternFormat
              format="+7 (###) ###-##-##"
              allowEmptyFormatting
              mask="_"
              type="tel"
              value={formData.phone}
              onValueChange={(values) => setFormData({...formData, phone: values.value})}
              placeholder="Номер телефона"
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
            />
          </div>

          {/* Поле Пароля */}
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="password"
              placeholder="Придумайте пароль"
              required
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              onChange={(e) => setFormData({...formData, password: e.target.value})}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-slate-700 transition-all flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" /> : <>Зарегистрироваться <ArrowRight size={20}/></>}
          </button>
        </form>

        <p className="text-center mt-6 text-slate-500 text-sm">
          Уже есть аккаунт?{" "}
          <button onClick={() => router.push("/login")} className="font-bold hover:underline">
            Войти
          </button>
        </p>

        {/* --- БЛОК С ЛОГОТИПОМ ИЗ БЭКЕНДА --- */}
        <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-center">
          <Image 
            src={`${BACKEND_URL}/media/org/logo.png`}          
            alt="WOPP Logo" 
            width={80}              
            height={32}              
            unoptimized
            className="opacity-40 object-contain grayscale hover:opacity-60 transition-opacity" 
          />
        </div>

      </div>
    </div>
  );
}