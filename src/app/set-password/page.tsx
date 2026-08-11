"use client";
import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Lock, CheckCircle2 } from "lucide-react";

function SetPasswordContent() {
  const searchParams = useSearchParams();
  const userId = searchParams.get("user_id");
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#FDFDFF] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-blue-50 text-center">
        <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={32} />
        </div>
        <h1 className="text-2xl font-black mb-2">Вы успешно записаны!</h1>
        <p className="text-slate-500 mb-8">Установите пароль, чтобы управлять своими записями в личном кабинете.</p>
        
        <input 
          type="password" 
          placeholder="Придумайте пароль" 
          className="w-full p-5 bg-slate-50 border-none rounded-2xl mb-4 outline-none focus:ring-2 focus:ring-blue-500"
        />
        
        <button 
          onClick={() => router.push("/cabinet")}
          className="w-full bg-slate-900 text-white p-5 rounded-[2rem] font-bold hover:bg-black transition-all"
        >
          Сохранить и войти
        </button>
      </div>
    </div>
  );
}

export default function SetPasswordPage() {
  return (
    <Suspense>
      <SetPasswordContent />
    </Suspense>
  );
}