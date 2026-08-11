"use client";
import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function ShortLinkRedirect() {
  const router = useRouter();
  const { id: code } = useParams();

  useEffect(() => {
    if (!code) return;

    // 1. Если это уже UUID, просто летим на страницу записи
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(code as string);
    if (isUUID) {
      router.replace(`/book/${code}`);
      return;
    }

    // 2. Если это короткий код, резолвим его
    const resolve = async () => {
      try {
        const res = await fetch(`https://api.wopp.ru/api/organizations/resolve-short-link/${code}`);
        if (res.ok) {
          const data = await res.json();
          router.replace(`/book/${data.id}`);
        } else {
          // Если код не найден — на главную или страницу ошибки
          router.replace('/');
        }
      } catch (err) {
        console.error("Redirect error:", err);
        router.replace('/');
      }
    };

    resolve();
  }, [code, router]);

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-white text-blue-600">
      <div className="relative">
        <Loader2 className="animate-spin" size={48} strokeWidth={1} />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[10px] font-black italic">W</span>
        </div>
      </div>
      <p className="mt-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
        Redirecting to booking
      </p>
    </div>
  );
}