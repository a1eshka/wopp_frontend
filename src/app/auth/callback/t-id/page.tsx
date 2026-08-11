"use client";
import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSnackbar } from "notistack";
import CallbackLoader from "@/components/CallbackLoader";

export default function TIdCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  
  const code = searchParams.get("code");
  const errorParam = searchParams.get("error");
  
  const isSent = useRef(false);

  useEffect(() => {
    if (errorParam) {
      enqueueSnackbar("Вход через Т-ID отменен.", { variant: "warning" });
      router.push("/login");
      return;
    }

    if (!code) {
      router.push("/login");
      return;
    }

    if (isSent.current) return;
    isSent.current = true;

    // Отправляем код на Django Ninja бэкенд под Т-ID
    fetch("http://127.0.0.1:8000/api/accounts/t-id/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (res.ok && data.access) {
          localStorage.setItem("token", data.access);
          localStorage.setItem("refresh_token", data.refresh);
          router.push("/cabinet");
        } else {
          enqueueSnackbar(data.error || "Ошибка авторизации через Т-ID", { variant: "error" });
          router.push("/login");
        }
      })
      .catch((err) => {
        console.error(err);
        enqueueSnackbar("Ошибка сети при связи с сервером.", { variant: "error" });
        router.push("/login");
      });
  }, [code, errorParam, router, enqueueSnackbar]);

  return <CallbackLoader title="Вход через Т-ID" />;
}