"use client";
import { Loader2 } from "lucide-react";

interface CallbackLoaderProps {
  title: string;
}

export default function CallbackLoader({ title }: CallbackLoaderProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FDFDFF] gap-4 p-4">
      <div className="bg-white px-8 py-10 rounded-[2.5rem] shadow-xl shadow-slate-100 border border-slate-50 flex flex-col items-center max-w-xs w-full text-center">
        <div className="relative flex items-center justify-center mb-4">
          <Loader2 className="animate-spin text-slate-900" size={38} />
        </div>
        <p className="text-slate-900 font-bold text-base tracking-tight">{title}</p>
        <p className="text-slate-400 text-xs mt-1 font-medium leading-relaxed">
          Проверяем данные безопасности и входим в аккаунт...
        </p>
      </div>
    </div>
  );
}