"use client";
import { useEffect, useRef, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useSnackbar } from "notistack";
import CallbackLoader from "@/components/CallbackLoader";

function YandexCallbackCore() {
    const router = useRouter();
    const { enqueueSnackbar } = useSnackbar();
    const hasFetched = useRef(false);

    useEffect(() => {
        // Читаем параметры напрямую из браузера, чтобы не зависеть от хуков Next.js
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");
        const errorParam = params.get("error");

        if (errorParam) {
            enqueueSnackbar("Вход через Яндекс отменен.", { variant: "warning" });
            router.push("/login");
            return;
        }

        if (!code) return;

        if (hasFetched.current) return;
        hasFetched.current = true;

        const currentRedirectUri = `https://wopp.ru/auth/callback/yandex`;

        // !!! Сюда вставляем твой точный url бэкенда !!!
        const BACKEND_URL = "https://api.wopp.ru/api/accounts/yandex/";

        fetch(BACKEND_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "ngrok-skip-browser-warning": "true"
            },
            body: JSON.stringify({
                code: code,
                redirect_uri: currentRedirectUri
            }),
        })
            .then(async (res) => {
                const data = await res.json();
                if (res.ok && data.access) {
                    localStorage.setItem("token", data.access);
                    localStorage.setItem("refresh_token", data.refresh);
                    enqueueSnackbar("Успешный вход!", { variant: "success" });
                    router.push("/cabinet");
                    if (data.is_new_user) {
                        router.push("/cabinet/settings?welcome=true"); // Ведем на страницу настроек
                    } else {
                        router.push("/cabinet"); // Старый пользователь идет сразу в дашборд
                    }

                } else {
                    enqueueSnackbar(data.error || "Ошибка авторизации Яндекс ID", { variant: "error" });
                    router.push("/login");
                }
            })
            .catch((err) => {
                console.error("Критическая ошибка fetch:", err);
                enqueueSnackbar("Ошибка сети при связи с сервером.", { variant: "error" });
                router.push("/login");
            });

    }, [router, enqueueSnackbar]);

    return <CallbackLoader title="Вход через Яндекс ID" />;
}

// Единственный и чистый дефолтный экспорт, который Next.js не потеряет
export default function YandexCallbackPage() {
    return (
        <Suspense fallback={<CallbackLoader title="Загрузка компонентов..." />}>
            <YandexCallbackCore />
        </Suspense>
    );
}