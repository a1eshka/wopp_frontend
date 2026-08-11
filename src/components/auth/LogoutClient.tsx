"use client";

import { useEffect } from "react";
import { Loader2, LogOut } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export default function LogoutContent() {
  const queryClient = useQueryClient();

  useEffect(() => {
    queryClient.clear();
    localStorage.clear();
    sessionStorage.clear();

    const timer = setTimeout(() => {
      window.location.href = "/";
    }, 1200);

    return () => clearTimeout(timer);
  }, [queryClient]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FDFDFF]">
      <div className="text-center space-y-4 animate-in fade-in zoom-in duration-500">
        <div className="w-20 h-20 bg-red-50 text-red-500 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 shadow-lg shadow-red-100/50">
          <LogOut size={40} />
        </div>
        <h1 className="text-2xl font-black text-slate-900">Выходим из аккаунта...</h1>
        <p className="text-slate-400 font-medium">Возвращайтесь скорее! ✨</p>
        <div className="flex justify-center pt-4">
          <Loader2 className="animate-spin text-blue-600" size={32} />
        </div>
      </div>
    </div>
  );
}