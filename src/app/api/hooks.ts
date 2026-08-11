import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { enqueueSnackbar } from 'notistack';
import { useCallback, useEffect, useState } from 'react';

const API_URL = "https://api.wopp.ru/api";

// Вспомогательная функция для сборки авторизационных заголовков
const getHeaders = () => ({
  "Authorization": `Bearer ${localStorage.getItem("token")}`,
  "Content-Type": "application/json"
});

/**
 * УМНАЯ ОБЕРТКА НАД FETCH С АВТООБНОВЛЕНИЕМ ТОКЕНА
 */
const apiFetch = async (url: string, options: RequestInit = {}) => {
  // 1. Делаем первый запрос с текущим access-токеном
  let res = await fetch(url, {
    ...options,
    headers: {
      ...getHeaders(),
      ...options.headers,
    },
  });

  if (res.status === 401) {
    // КРИТИЧЕСКОЕ ИСКЛЮЧЕНИЕ ДЛЯ КЛИЕНТСКОЙ ЗАПИСИ:
    // Проверяем, идет ли запрос на публичные эндпоинты бронирования
    const isBookingEndpoint = url.includes('/booking/') || url.includes('/slots/') || url.includes('/staff/');

    const refreshToken = localStorage.getItem("refresh_token");

    if (!refreshToken) {
      // Если это виджет записи — НЕ редиректим, а выкидываем кастомную ошибку для формы
      if (isBookingEndpoint) {
        throw new Error("Неверный пароль");
      }

      // Для обычных админских страниц оставляем жесткий редирект
      window.location.href = "/login";
      throw new Error("Unauthorized: Нет refresh-токена");
    }

    try {
      // 3. Отправляем скрытый запрос на обновление токена
      const refreshRes = await fetch(`${API_URL}/token/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      if (!refreshRes.ok) {
        throw new Error("Refresh-токен тоже недействителен");
      }

      const refreshData = await refreshRes.json();

      // 4. Сохраняем новый access-токен в localStorage
      localStorage.setItem("token", refreshData.access);
      console.log("Токен успешно обновлен, повторяю запрос!");

      // 5. Повторяем ИЗНАЧАЛЬНЫЙ запрос с новым токеном
      res = await fetch(url, {
        ...options,
        headers: {
          ...getHeaders(),
          ...options.headers,
        },
      });

    } catch (err) {
      // Если упал даже refresh-токен (сессия полностью истекла)
      localStorage.removeItem("token");
      localStorage.removeItem("refresh_token");

      // Снова проверяем: если это клиент в виджете — не уводим его на /login
      if (isBookingEndpoint) {
        throw new Error("SESSION_EXPIRED_BOOKING");
      }

      window.location.href = "/login";
      throw new Error("Сессия истекла. Пожалуйста, войдите снова.");
    }
  }

  // Если сервер вернул любую другую ошибку (400, 403, 500 и т.д.)
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Ошибка сервера: ${res.status}`);
  }

  // Если всё отлично — возвращаем распарсенный JSON
  return res.json();
};


// ==========================================
// --- QUERIES (Запросы данных) ---
// ==========================================

export const useMe = () => {
  // 1. Проверяем токен локально (безопасно для SSR в Next.js)
  const hasToken = typeof window !== 'undefined' ? !!localStorage.getItem('token') : false;

  return useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      try {
        // Используем твой стандартный apiFetch или fetch
        const response = await fetch(`${API_URL}/accounts/me`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        // Если токен протух (бэк вернул 401)
        if (response.status === 401) {
          localStorage.removeItem('token'); // чистим невалидный токен
          return null; // юзер стал гостем
        }

        if (!response.ok) throw new Error('Ошибка сервера');
        return await response.json();
      } catch (error) {
        return null; // в случае падения сети отдаем null (считаем гостем)
      }
    },
    // 2. ГЛАВНАЯ ОПТИМИЗАЦИЯ: если токена нет, запрос в сеть ДАЖЕ НЕ ПОЙДЕТ
    enabled: hasToken,
    // 3. Если токена нет, React Query сразу вернет data: null (уже не loading)
    initialData: hasToken ? undefined : null,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 минут данные считаются свежими
  });
};



export const useStats = (period: string, options = {}) => {
  return useQuery({
    queryKey: ['stats', period],
    queryFn: () => apiFetch(`${API_URL}/staff/stats?period=${period}`),
    
    staleTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
    ...options // 🌟 Позволяет прокидывать enabled снаружи
  });
};

export const useAdvancedStats = (
  period: string,
  enabled: boolean = true,
  startDate?: string,
  endDate?: string
) => useQuery({
  queryKey: ['organizations', 'stats', 'advanced', period, startDate || '', endDate || ''],
  queryFn: () => {
    const params = new URLSearchParams({ period });
    
    // Заменили start_date -> date_from и end_date -> date_to
    if (period === 'custom' && startDate && endDate) {
      params.append('date_from', startDate);
      params.append('date_to', endDate);
    }
    
    return apiFetch(`${API_URL}/organizations/stats/advanced?${params.toString()}`);
  },
  enabled: enabled && !!period && (period !== 'custom' || (!!startDate && !!endDate)),
  staleTime: 1000 * 60 * 5,
});

export const useStaffList = () => useQuery({
  queryKey: ['staff'],
  queryFn: () => apiFetch(`${API_URL}/staff/list`)
});

export const useOrganizationInfo = (organizationId: string | number | undefined) => useQuery({
  queryKey: ['organization', 'public-info', organizationId],
  queryFn: () => apiFetch(`${API_URL}/organizations/public-info?organization_id=${organizationId}`),
  enabled: !!organizationId,
  // Сколько времени (в мс) данные считаются абсолютно "свежими".
  // В течение этого времени React Query вообще не будет делать никаких сетевых запросов.
  staleTime: 1000 * 60 * 60, // 1 час (поставьте больше, если данные меняются раз в день)
  // Сколько времени данные лежат в памяти после того, как хук перестал использоваться.
  gcTime: 1000 * 60 * 60 * 24, // 24 часа кэша в памяти
  // Отключаем лишние фоновые запросы, которые срабатывают при «жизненных событиях» приложения
  refetchOnWindowFocus: false, // Не перезапрашивать, когда пользователь вернулся на вкладку браузера
  refetchOnReconnect: true,    // Перезапросить только если пропал и снова появился интернет
  refetchOnMount: false,       // Не делать фоновый запрос при повторном открытии компонента
});



export const useDashboardInit = () => {
  const queryClient = useQueryClient();
  const hasToken = typeof window !== 'undefined' ? !!localStorage.getItem('token') : false;

  return useQuery({
    queryKey: ['dashboard-init'],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/organizations/dashboard/init`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        return null;
      }

      if (!response.ok) throw new Error('Ошибка инициализации рабочего пространства');

      const data = await response.json();

      // Раскладываем всё по полочкам кэша:
      if (data.user) {
        queryClient.setQueryData(['me'], data.user);

        const orgId = data.user.organization_id;
        const orgIdStr = String(orgId);

        if (data.organization && orgId) {
          queryClient.setQueryData(['organization', 'public-info', orgIdStr], data.organization);
        }

        if (data.stats_today) {
          queryClient.setQueryData(['stats', 'today'], data.stats_today);
        }

        // 🌟 НАБИВАЕМ КЭШ ПОДПИСКИ СРАЗУ
        if (data.subscription && orgId) {
          // Ключ 'subscription-info' и ID строго в String, чтобы сматчиться с хуком!
          queryClient.setQueryData(['subscription-info', String(orgId)], data.subscription);
        }
      }

      return data;
    },
    enabled: hasToken,
    staleTime: 1000 * 60 * 5,
  });
};


// 2. Получение категорий и услуг для витрины (Showcase)
export const useOrgShowcase = (orgId: string | number | undefined) => useQuery({
  queryKey: ['org', 'showcase', orgId],
  queryFn: () => apiFetch(`${API_URL}/catalog/showcase?organization_id=${orgId}`),
  enabled: !!orgId,
  staleTime: 1000 * 60 * 5,
});

export const useSpecialistsByServices = (serviceIdsStr: string, enabled: boolean) => useQuery({
  queryKey: ['staff', 'specialists-by-services', serviceIdsStr],
  queryFn: async () => {
    const data = await apiFetch(`${API_URL}/staff/specialists-by-service?service_ids=${serviceIdsStr}`);
    // Подстраховка маппинга полей, которую ты делал в useEffect
    return data.map((s: any) => ({
      ...s,
      display_name: s.name || s.display_name,
      avatar_url: s.avatar_url || s.photo || null,
      rating_avg: s.rating_avg ? parseFloat(s.rating_avg) : 0.0,
      reviews_count: s.reviews_count || 0,
    }));
  },
  enabled: enabled && !!serviceIdsStr,
});


// 4. Загрузка рабочих дней мастера для календаря на конкретный месяц
export const useWorkingDays = (specialistId: number | string | undefined, month: number, year: number, enabled: boolean) => {
  return useQuery({
    queryKey: ['booking', 'working-days', specialistId, month, year],
    queryFn: () => apiFetch(`${API_URL}/staff/get-working-days/${specialistId}?month=${month}&year=${year}`),
    enabled: enabled && !!specialistId,
    staleTime: 1000 * 60 * 5, // График на месяц меняется редко, кэшируем на 5 минут
  });
};

export const useMasterSlotsForClient = (masterId: number | string | undefined, dateStr: string, enabled: boolean) => {
  return useQuery({
    queryKey: ['booking', 'client-slots', masterId, dateStr],
    queryFn: () => apiFetch(`${API_URL}/staff/get-slots-for-client/${masterId}?date=${dateStr}`),
    enabled: enabled && !!masterId && !!dateStr,
    staleTime: 1000 * 30, // Кэшируем на 30 секунд, так как данные реалтаймовые
  });
};




export interface BookingInitData {
  organization: any; // Сюда прилетит OrganizationPublicOut
  showcase: any[];   // Сюда прилетят категории с услугами
  user: any | null;  // Данные пользователя (или null, если гость)
}

export const useBookingInit = (organizationId: string, enabled: boolean) => {
  return useQuery<BookingInitData>({
    queryKey: ['booking', 'init', organizationId],
    queryFn: async () => {
      // Делаем ОДИН запрос к новому фасадному эндпоинту
      const data = await apiFetch(`${API_URL}/organizations/booking-init?organization_id=${organizationId}`);

      // Здесь же подстраховываем маппинг полей для витрины, как в вашем старом хуке
      if (data && data.showcase) {
        data.showcase = data.showcase.map((category: any) => ({
          ...category,
          services: category.services?.map((s: any) => ({
            ...s,
            // Подстраховка полей, если на бэке что-то отличается
            display_name: s.name || s.display_name,
            avatar_url: s.avatar_url || s.photo || null,
            rating_avg: s.rating_avg ? parseFloat(s.rating_avg) : 0.0,
            reviews_count: s.reviews_count || 0,
          })) || []
        }));
      }

      return data;
    },
    // Запрос пойдет, только если передан ID организации и хук активен
    enabled: enabled && !!organizationId,
    // Кэшируем данные на 3 минуты, чтобы при переходах назад-вперед всё открывалось за 0 мс
    staleTime: 3 * 60 * 1000,
  });
};



/**
 * 5. РЕАКТИВНЫЙ ХУК ЖИВЫХ СЛОТОВ С ПОДПИСКОЙ НА SSE
 * Автоматически убирает занятые слоты с экрана «на лету» без перезагрузки страницы
 
export const useAvailableSlots = (
  orgId: number | string | undefined,
  specialistId: number | string | undefined,
  serviceIdsStr: string,
  dateStr: string
) => {
  const queryClient = useQueryClient();
  const queryKey = ['booking', 'slots', specialistId, serviceIdsStr, dateStr];

  const queryResult = useQuery({
    queryKey,
    queryFn: () => apiFetch(`${API_URL}/booking/slots?specialist_id=${specialistId}&service_ids=${serviceIdsStr}&date=${dateStr}`),
    enabled: !!specialistId && !!serviceIdsStr && !!dateStr,
    staleTime: 10 * 1000, // Слоты считаются свежими 10 секунд
  });

  useEffect(() => {
    if (!specialistId || !dateStr || !serviceIdsStr) return;

    // Подключаемся к общему потоку уведомлений организации бронирования
    // Браузер сам добавит Cookie/Учетные данные, либо используем открытый эндпоинт стрима слотов
    const eventSource = new EventSource(`${API_URL}/booking/slots/stream?org_id=${orgId}`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        // Ловим создание записи или изменение её статуса (например, отмену)
        if (data.event_type === 'BOOKING_CREATED' || data.event_type === 'BOOKING_UPDATED') {
          const app = data.calendar_event;
          if (!app) return;

          const appDate = app.start_time.split('T')[0]; // Достаем "YYYY-MM-DD"

          // Проверяем, коснулись ли изменения именно ТЕКУЩЕГО мастера и ТЕКУЩЕЙ даты
          if (String(app.master_id) === String(specialistId) && appDate === dateStr) {
            console.log("[SSE SLOT PROTECTION]: Слот заняли, сбрасываем кэш...");
            // Форсируем тихий фоновый перезапрос сетки времени
            queryClient.invalidateQueries({ queryKey });
          }
        }
      } catch (err) {
        console.error("Ошибка парсинга SSE для живых слотов:", err);
      }
    };

    eventSource.onerror = () => {
      console.warn("Потеряно соединение с SSE потоком слотов. Ожидание авто-переподключения...");
    };

    return () => {
      eventSource.close();
    };
  }, [queryClient, queryKey, specialistId, dateStr, serviceIdsStr]);

  return queryResult;
};
*/

interface UseMasterSlotsStreamProps {
  orgId: string;
  masterId: number | string | undefined;
  dateStr: string;
  serviceIdsStr: string;
  enabled: boolean;
}

export function useMasterSlotsStream({ orgId, masterId, dateStr, serviceIdsStr, enabled }: UseMasterSlotsStreamProps) {
  const queryClient = useQueryClient();

  // 1. Обычный быстрый GET-запрос слотов (поддерживает кэширование из коробки)
  const { data, isLoading: loadingSlots, isFetching } = useQuery({
    queryKey: ['slots', masterId, dateStr, serviceIdsStr],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/staff/get-slots-for-client/${masterId}?date=${dateStr}&services=${serviceIdsStr}`);
      if (!res.ok) throw new Error('Ошибка при получении слотов');
      return res.json(); // Ожидаем структуру { is_working: true, slots: [...] }
    },
    // Включаем запрос только если все параметры на месте и шаг равен 4
    enabled: enabled && !!masterId && !!dateStr,
    staleTime: 30000, // Данные считаются свежими 30 секунд (снижает нагрузку при тыканьи дат туда-сюда)
    placeholderData: (previousData) => previousData,
  });

  // Вытаскиваем массив слотов, если мастер работает, иначе пустой массив
  const liveSlots: string[] = data?.is_working ? data.slots : [];

  // 2. Долговременная SSE подписка на сигналы обновлений от Redis
  useEffect(() => {
    if (!enabled || !orgId) return;

    // Открываем ОДИН стрим на всю страницу организации
    const eventSource = new EventSource(`${API_URL}/booking/slots/stream?org_id=${orgId}`);

    eventSource.onmessage = (event) => {
      if (event.data === 'refresh') {
        console.log('Кто-то записался! Сбрасываем кэш слотов...');
        // Сбрасываем кэш всех запросов, у которых queryKey начинается с 'slots'
        queryClient.invalidateQueries({ queryKey: ['slots'] });
      }
    };

    eventSource.onerror = () => {
      console.log('SSE отключен. Переподключение...');
    };

    return () => {
      eventSource.close(); // Закрываем соединение, когда пользователь ушел с шага 4
    };
  }, [orgId, enabled, queryClient]);

  return { liveSlots, loadingSlots, isFetching };
}

export const useBookings = (
  masterId: string,
  start: string,
  end: string,
  enabled: boolean
) => {
  const queryClient = useQueryClient();
  const queryKey = ['bookings', masterId, start, end];

  // 1. Загружаем первичную сетку записей
  const queryResult = useQuery({
    queryKey,
    queryFn: () => {
      if (!start || !end || start.trim() === "" || end.trim() === "") {
        return [];
      }

      const params = new URLSearchParams();
      params.append("start", start);
      params.append("end", end);

      if (masterId && masterId !== "all") {
        params.append("specialist_id", masterId);
      }

      return apiFetch(`${API_URL}/booking/calendar/events?${params.toString()}`);
    },
    enabled: enabled && !!start && !!end,
    // Данные считаются свежими всегда, фоновые авто-запросы нам больше не нужны
    staleTime: Infinity,
  });

  // 2. Подключаем независимый real-time поток для календаря
  useEffect(() => {
    if (!enabled || !start || !end) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    console.log(`[FRONTEND SSE]: Подключаем календарный стрим для мастера: ${masterId}`);
    const eventSource = new EventSource(`${API_URL}/booking/calendar/stream?token=${token}`);

    eventSource.onmessage = (event) => {
      try {
        const rawData = JSON.parse(event.data);
        console.log("[FRONTEND SSE]: Получили событие из канала календаря:", rawData);

        // Если в JSON есть event_type (create, update, delete) — значит на бэке что-то изменилось!
        if (rawData && rawData.event_type) {
          console.log(`[FRONTEND SSE]: Фиксируем изменение "${rawData.event_type}". Форсируем рефетч сетки...`);

          // Жестко обновляем активный запрос
          queryClient.refetchQueries({
            queryKey: ['bookings'],
            exact: false,
            type: 'active'
          });
        }
      } catch (err) {
        // На случай, если бэкенд отправил чистую строку (например, "ping" или "system_refresh")
        if (event.data === "system_refresh" || event.data.includes("system_refresh")) {
          console.log("[FRONTEND SSE]: Поймали текстовый system_refresh. Обновляем сетку...");
          queryClient.refetchQueries({ queryKey: ['bookings'], exact: false, type: 'active' });
        }
      }
    };

    eventSource.onerror = (err) => {
      console.error("[FRONTEND SSE]: Ошибка соединения с календарным стримом.", err);
    };

    return () => {
      console.log("[FRONTEND SSE]: Закрываем соединение стрима календаря");
      eventSource.close();
    };
  }, [enabled, start, end, masterId, queryClient]);

  return queryResult;
};

export const useServices = (enabled: boolean) => useQuery({
  queryKey: ['services'],
  queryFn: () => apiFetch(`${API_URL}/catalog/services`),
  enabled
});

/**
 * РЕАКТИВНЫЙ ХУК УВЕДОМЛЕНИЙ (SSE + REDIS PUB/SUB)
 */
export const useNotifications = () => {
  const queryClient = useQueryClient();
  const queryKey = ['notifications'];

  // 1. Загружаем из базы последние 20 штук всего 1 раз
  const queryResult = useQuery<any[]>({
    queryKey,
    queryFn: () => apiFetch(`${API_URL}/notifications`),
    staleTime: Infinity, // Предотвращаем автоматический фоновый рефетч со стороны React Query
  });

  // 2. Слушаем живой поток событий от Django Ninja через EventSource
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    // Передаем токен в query-параметрах для ручной проверки на бэкенде
    const eventSource = new EventSource(`${API_URL}/notifications/stream?token=${token}`);

    eventSource.onmessage = (event) => {
      try {
        const newNotification = JSON.parse(event.data);
        if (newNotification.type === 'system_refresh') {
          console.log("[FRONTEND SSE]: Поймали system_refresh, запускаем тотальный рефетч...");

          queryClient.refetchQueries({
            predicate: (query) => {
              // Превращаем весь массив ключей в строку, например: "organizations,stats,advanced,month"
              const keyString = query.queryKey.join(',').toLowerCase();

              // Ищем вхождения ключевых слов
              const matches = keyString.includes('advanced') || keyString.includes('stats');

              if (matches) {
                console.log(`[FRONTEND REFETCH]: Форсируем обновление для ключа:`, query.queryKey);
              }
              return matches;
            },
            type: 'active' // Обновляет только то, что сейчас отрендерено на экране
          });

          return;
        }
        // Мгновенно обновляем стейт React Query без запросов к PostgreSQL
        queryClient.setQueryData(queryKey, (oldData: any[] = []) => {
          // Защита от дублей
          if (oldData.some(n => n.id === newNotification.id)) return oldData;
          // Добавляем новое событие вверх списка и держим лимит в 20 записей
          return [newNotification, ...oldData].slice(0, 20);
        });

        // Опционально: можно вызывать всплывашку при новом уведомлении
        //if (newNotification.type === 'new') {
        //  enqueueSnackbar(newNotification.message, { variant: 'success' });
        //} else if (newNotification.type === 'cancel') {
        //  enqueueSnackbar(newNotification.message, { variant: 'error' });
        //}

      } catch (err) {
        console.error("Ошибка парсинга данных из SSE:", err);
      }
    };

    eventSource.onerror = () => {
      console.warn("Разрыв SSE-соединения. Попытка автоматического переподключения браузером...");
    };

    // Закрываем стрим при размонтировании (когда пользователь выходит из системы/закрывает страницу)
    return () => {
      eventSource.close();
    };
  }, [queryClient]);

  return queryResult;
};

export const useClients = () => useQuery({
  queryKey: ['clients'],
  queryFn: () => apiFetch(`${API_URL}/booking/clients`)
});

export const useClientRecords = (clientId: string | null) => useQuery({
  queryKey: ['client-records', clientId],
  queryFn: () => {
    if (!clientId) return null;
    return apiFetch(`${API_URL}/booking/${encodeURIComponent(clientId)}/records`);
  },
  enabled: !!clientId
});

export const useSubscriptionInfo = (organizationId: string | number | null | undefined) => {
  return useQuery({
    queryKey: ['subscription-info', organizationId],
    queryFn: () => {
      if (!organizationId) return null;
      return apiFetch(`${API_URL}/organizations/${organizationId}/subscription-info`);
    },
    enabled: !!organizationId,
    staleTime: 1000 * 60 * 5,
  });
};


// ==========================================
// --- MUTATIONS (Изменения данных) ---
// ==========================================

export const useCreatePayment = () => {
  return useMutation({
    mutationFn: (payload: { plan_id: number; coupon_code?: string | null }) =>
      apiFetch(`${API_URL}/finance/payment/create`, {
        method: "POST",
        body: JSON.stringify(payload)
      })
  });
};

export const useToggleAutoRenew = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiFetch(`${API_URL}/finance/subscription/toggle-auto-renew`, { method: "POST" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['subscription-info'] })
  });
};

export const useApplyCoupon = () => {
  return useMutation({
    mutationFn: ({ code, orgId }: { code: string; orgId: string }) =>
      apiFetch(`${API_URL}/finance/apply-coupon?code=${encodeURIComponent(code)}&org_id=${encodeURIComponent(orgId)}`, {
        method: "POST"
      })
  });
};

//export const useUpdateSchedule = () => {
//  const queryClient = useQueryClient();
//  return useMutation({
//    mutationFn: ({ masterId, data }: { masterId: string, data: any }) =>
//      apiFetch(`${API_URL}/staff/update-schedule/${masterId}`, {
//        method: "POST",
//        body: JSON.stringify(data)
//      }),
//    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['staff'] })
//  });
//};

export const useUpdateSchedule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    // Меняем тип masterId на string/number, а data теперь — это наш BulkScheduleData (объект с месяцами)
    mutationFn: ({ masterId, data }: { masterId: string | number, data: any }) =>
      apiFetch(`${API_URL}/staff/update-schedule/${masterId}`, {
        method: "POST",
        body: JSON.stringify(data) // Сюда улетает объект { "2026-06": { work_days: [...], time_slots: [...] } }
      }),
    onSuccess: (_, variables) => {
      // Сбрасываем кэш именно расписания для этого мастера
      queryClient.invalidateQueries({ queryKey: ['monthSchedule', variables.masterId] });
      queryClient.invalidateQueries({ queryKey: ['workingDays', variables.masterId] });
    }
  });
};


export const useConfirmBooking = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (bookingId: number) =>
      apiFetch(`${API_URL}/staff/bookings/${bookingId}/confirm`, { method: "POST" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bookings'] })
  });
};

export const useUpdateBookingStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action, ...data }: { id: string; action: string; [key: string]: any }) =>
      apiFetch(`${API_URL}/booking/${id}/${action}`, {
        method: "POST",
        body: JSON.stringify(data)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      queryClient.invalidateQueries({ queryKey: ['organizations', 'stats', 'advanced'] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    }
  });
};

export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();
  const queryKey = ['notifications'];

  return useMutation({
    mutationFn: (id: number) =>
      apiFetch(`${API_URL}/notifications/${id}/read`, { method: "POST" }),

    // Оптимистичный UI: отмечаем прочитанным в кэше сразу, не дожидаясь ответа сервера
    onMutate: async (notificationId) => {
      await queryClient.cancelQueries({ queryKey });
      const previousNotifications = queryClient.getQueryData(queryKey);

      queryClient.setQueryData<any[]>(queryKey, (old = []) =>
        old.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );

      return { previousNotifications };
    },
    // Если сервер ответил ошибкой — откатываем кэш назад
    onError: (err, notificationId, context) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData(queryKey, context.previousNotifications);
      }
      enqueueSnackbar("Не удалось прочитать уведомление", { variant: "error" });
    },
    // В любом случае синхронизируем данные с сервером
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    }
  });
};


export const useCheckPhone = () => useMutation({
  mutationFn: (phone: string) =>
    apiFetch(`${API_URL}/booking/check-phone?phone=${encodeURIComponent(phone)}`)
});

// Создание бронирования на Шаге 5
export const useCreateBooking = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: any) => apiFetch(`${API_URL}/booking/create`, {
      method: "POST",
      body: JSON.stringify(payload)
    }),
    onSuccess: () => {
      // Сразу чистим кэш слотов и календаря, так как мы только что совершили запись
      queryClient.invalidateQueries({ queryKey: ['booking', 'slots'] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    }
  });
};



export const useUpdateClientDiscount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ phone, discount }: { phone: string; discount: number }) => {
      // Больше никаких проверок на "current" и dynamic ID — шлем запрос напрямую
      const response = await apiFetch(`${API_URL}/accounts/clients/set-discount`, {
        method: "POST",
        body: JSON.stringify({ phone, discount }),
      });
      return response;
    },
    onSuccess: () => {
      // 🌟 Теперь ключи идеально совпадают! Инвалидируем ровно тот кэш, который использует useClients
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });
};
// ==========================================
// --- STAFF MANAGER (Действия сотрудников) ---
// ==========================================

export const useStaff = (onRefresh: any) => {
  const queryClient = useQueryClient();

  // Общий хэндлер запросов менеджера на базе нашего apiFetch
  const executeRequest = useCallback(async (url: string, method: string, body?: any, successMsg?: string) => {
    try {
      const result = await apiFetch(`${API_URL}/${url}`, {
        method,
        body: body ? JSON.stringify(body) : undefined
      });

      if (successMsg) enqueueSnackbar(successMsg, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['staff'] });

      return result;
    } catch (err: any) {
      enqueueSnackbar(err.message || 'Ошибка при выполнении операции', { variant: 'error' });
      return null;
    }
  }, [queryClient]);

  return {
    updateColor: (id: number, color: string) =>
      executeRequest(`staff/specialist/${id}/update-color`, "PATCH", { color }, "Цвет обновлен"),

    updateServices: (id: number, serviceIds: number[]) =>
      executeRequest(`staff/update-master-services/${id}`, "POST", serviceIds, "Услуги обновлены"),

    deleteMaster: (id: string) =>
      executeRequest(`staff/specialist/${id}`, "DELETE", null, "Сотрудник удален"),

    toggleActive: (id: string) =>
      executeRequest(`staff/specialist/${id}/toggle-active`, "PATCH"),

    addMaster: (data: any) =>
      executeRequest("staff/add-specialist-org", "POST", data, "Мастер добавлен"),

    saveVacation: (id: string, start: string | null, end: string | null) =>
      executeRequest(`staff/specialist/${id}/vacation`, "POST", { start_date: start, end_date: end }, "Отпуск сохранен"),

    //getSchedule: (id: string) => {
    //  const today = new Date().toISOString().split('T')[0];
    //  return apiFetch(`${API_URL}/staff/get-schedule/${id}?date=${today}`);
    //},

    saveSchedule: async (id: string | number, monthlyData: any) => {
      console.log("=== [ДИАГНОСТИКА: НАЧАЛО ЗАПРОСА] ===");

      // 1. Проверяем, что за тип данных пришел в функцию
      console.log("Тип monthlyData:", typeof monthlyData);
      console.log("Является ли массивом?:", Array.isArray(monthlyData));

      // 2. Сериализуем вручную и смотрим на результат строки
      const jsonString = JSON.stringify(monthlyData);
      console.log("Итоговая JSON-строка, которая уйдет в сеть:\n", jsonString);

      try {
        // 3. Вызываем базовый apiFetch
        const result = await apiFetch(`${API_URL}/staff/update-schedule/${id}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json", // Принудительно ставим заголовок
          },
          body: jsonString, // Отправляем подготовленную строку
        });

        console.log("=== [ДИАГНОСТИКА: УСПЕХ!] ===");
        console.log("Ответ сервера:", result);
        return result;

      } catch (error: any) {
        console.error("=== [ДИАГНОСТИКА: ОШИБКА ЗАПРОСА] ===");
        console.error("Текст пойманной ошибки:", error.message);

        // Пытаемся понять, это ошибка валидации Pydantic или Bad Request
        if (error.message.includes("{") || error.message.includes("[")) {
          try {
            console.error("Распарсенный объект ошибки бэкенда:", JSON.parse(error.message));
          } catch (e) {
            console.error("Не удалось распарсить текст ошибки как JSON");
          }
        }
        throw error;
      }
    },

    getMonthSchedule: (id: string | number) => {
      return apiFetch(`${API_URL}/staff/get-month-schedule/${id}`);
    },
  };
};

export interface ReviewData {
  id: string;              // UUID
  client_name: string;     // Имя клиента из визита
  specialist_id: string;   // int ID мастера (строкой из сериализатора)
  specialist_name: string; // r.specialist.display_name
  specialist_avatar: string | null;
  rating: number;          // 1-5
  comment: string;         // Текст отзыва
  created_at: string;      // ISO дата
}

// ==========================================
// --- QUERIES (Запросы данных) ---
// ==========================================

/**
 * Получение всех отзывов организации (или с фильтром по специалисту)
 */
export const useReviews = (specialistId: string = "all") => {
  return useQuery<ReviewData[]>({
    queryKey: ['reviews', specialistId],
    queryFn: () => apiFetch(`${API_URL}/booking/dashboard/reviews/list?specialist_id=${specialistId}`),
    placeholderData: keepPreviousData, // Предотвращает моргание интерфейса при смене фильтра мастера
    staleTime: 3 * 60 * 1000,          // 3 минуты кэш держится свежим
  });
};

// ==========================================
// --- MUTATIONS (Изменение данных) ---
// ==========================================

export interface CreateReviewInput {
  appointment_id: string;  // UUID визита
  specialist_id: number;   // int ID мастера
  rating: number;          // 1-5
  comment?: string;        // Необязательный комментарий
}

/**
 * Создание нового отзыва со стороны клиента
 */
export const useCreateReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateReviewInput) => 
      apiFetch(`${API_URL}/booking/reviews`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: (response) => {
      // Инвалидируем кэш отзывов, чтобы админка сразу подтянула изменения
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      // Если у тебя кэшируются данные мастеров/сотрудников — сбросим и их, так как у мастера обновился рейтинг
      queryClient.invalidateQueries({ queryKey: ['masters'] });
      
      enqueueSnackbar(response.detail || 'Отзыв успешно добавлен!', { variant: 'success' });
    },
    onError: (error: any) => {
      enqueueSnackbar(error.message || 'Не удалось оставить отзыв', { variant: 'error' });
    }
  });
};

export interface ReplyReviewInput {
  reviewId: string;
  reply_text: string;
}

export const useReplyToReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ reviewId, reply_text }: ReplyReviewInput) => 
      apiFetch(`${API_URL}/booking/dashboard/reviews/${reviewId}/reply`, {
        method: "POST",
        body: JSON.stringify({ reply_text }),
      }),
    onSuccess: (response) => {
      // ИНВАЛИДИРУЕМ ВСЕ КЛЮЧИ, КОТОРЫЕ НАЧИНАЮТСЯ С 'reviews'
      queryClient.invalidateQueries({ 
        queryKey: ['reviews'] 
        // В зависимости от версии React Query, по умолчанию поиск идет по префиксу.
        // Если не обновляется, можно явно указать: exact: false
      });
      
      // Если используешь snackbar:
      // enqueueSnackbar(response.detail || 'Ответ сохранен', { variant: 'success' });
    },
    onError: (error: any) => {
      // enqueueSnackbar(error.message || 'Ошибка', { variant: 'error' });
    }
  });
};


export interface ReviewDataBooking {
  id: string;
  client_name: string;
  specialist_id: string;
  specialist_name: string;
  specialist_avatar: string | null;
  rating: number;
  comment: string;
  created_at: string;
  // Добавляем новые поля ответа организации
  reply_text?: string;
  reply_created_at?: string;
}

/**
 * Хук для получения отзывов (с поддержкой ленивой загрузки)
 */
export const useReviewsBooking = (specialistId: string = "all", options?: { enabled?: boolean }) => {
  return useQuery<ReviewDataBooking[]>({
    queryKey: ['reviews', specialistId],
    // Если в CRM используется публичный префикс для этой модалки, оставь /booking/reviews/list
    queryFn: () => apiFetch(`${API_URL}/booking/reviews/list?specialist_id=${specialistId}`),
    placeholderData: keepPreviousData,
    staleTime: 3 * 60 * 1000,
    enabled: options?.enabled ?? true, // Важно: предотвращает запросы при закрытой модалке
  });
};

// ==========================================
// 1. ЖИВОЙ ГРАФИК РАБОТЫ МАСТЕРА
// ==========================================
export const useMasterSchedule = (masterId: string, startStr: string, endStr: string) => {
  // Увеличиваем конечную дату на 1 день для режима "День", если даты совпали
  let finalEndStr = endStr;
  if (startStr && endStr && startStr === endStr) {
    const startDateObj = new Date(startStr);
    const nextDateObj = new Date(startDateObj.getTime() + 24 * 60 * 60 * 1000);
    const pad = (n: number) => n.toString().padStart(2, '0');
    finalEndStr = `${nextDateObj.getFullYear()}-${pad(nextDateObj.getMonth() + 1)}-${pad(nextDateObj.getDate())}`;
  }

  return useQuery({
    queryKey: ["master-schedule", masterId, startStr, finalEndStr],
    queryFn: () => 
      apiFetch(`${API_URL}/booking/specialists/${masterId}/fullcalendar-schedule?start=${startStr}&end=${finalEndStr}`),
    enabled: !!masterId && masterId !== "all" && !!startStr,
    staleTime: 5 * 60 * 1000,
  });
};

// ==========================================
// 2. УПРАВЛЕНИЕ ФОТОГРАФИЯМИ ЗАПИСИ
// ==========================================
export const useUploadBookingPhoto = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ bookingId, file }: { bookingId: string; file: File }) => {
      const formData = new FormData();
      formData.append("file", file);
      // Передаем как FormData, apiFetch внутри должен уметь не совать JSON-заголовки, если идет FormData
      return fetch(`${API_URL}/api/booking/${bookingId}/upload-photo`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` },
        body: formData,
      }).then(res => res.ok ? res.json() : Promise.reject(res));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] }); // или как у тебя называется ключ списка событий
    }
  });
};

export const useDeleteBookingPhoto = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (photoId: string) =>
      apiFetch(`${API_URL}/booking/photos/${photoId}/delete`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
    }
  });
};

// ==========================================
// 3. ТЕХНИЧЕСКИЕ ПЕРЕРЫВЫ (БЛОКИРОВКА ВРЕМЕНИ)
// ==========================================
export const useCreateTimeBlock = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { specialist_id: number; start_datetime: string; end_datetime: string; reason: string }) =>
      apiFetch(`${API_URL}/booking/schedule/block/`, {
        method: "POST",
        body: JSON.stringify(payload)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
    }
  });
};

export const useDeleteTimeBlock = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (cleanBlockId: string) =>
      apiFetch(`${API_URL}/booking/schedule/block/${cleanBlockId}/delete`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
    }
  });
};

// ==========================================
// 4. ОПЕРАЦИИ НАД ЗАПИСЯМИ (ОБНОВЛЕНИЕ, ОТМЕНА, БЫСТРОЕ СОЗДАНИЕ)
// ==========================================
export const useUpdateBooking = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ bookingId, ...payload }: { bookingId: string; specialist_id?: number | null; start_time: string; end_time: string | null; comment?: string }) =>
      apiFetch(`${API_URL}/booking/${bookingId}/update`, {
        method: "POST",
        body: JSON.stringify(payload)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
    }
  });
};

export const useCancelBooking = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (bookingId: string) =>
      apiFetch(`${API_URL}/booking/${bookingId}/cancel`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
    }
  });
};

export const useQuickCreateBooking = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { services_ids: number[]; specialist_id: number | null; client_name: string; client_phone: string; start_time: string }) =>
      apiFetch(`${API_URL}/booking/quick-create`, {
        method: "POST",
        body: JSON.stringify(payload)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
    }
  });
};

export interface NewsItem {
  id: number;
  title: string;
  content: string;
  news_type: 'info' | 'promo' | 'promocode' | 'maintenance' | 'update';
  news_type_display: string;
  image?: string | null;
  promocode?: string | null;
  action_url?: string | null;
  action_text?: string | null;
  is_read: boolean;
}

export interface UnreadNewsCount {
  unread_count: number;
}

// --- ХУКИ ---

/**
 * Хук для получения списка новостей организации
 */
export const useOrganizationNews = (enabled: boolean = true) => {
  return useQuery<NewsItem[]>({
    queryKey: ['organization', 'news'],
    queryFn: () => apiFetch(`${API_URL}/organizations/news`),
    enabled,
    staleTime: 1000 * 60 * 5, // 5 минут
  });
};

/**
 * Хук для получения количества непрочитанных новостей (для бейджа в меню)
 */
export const useUnreadNewsCount = (enabled: boolean = true) => {
  return useQuery<UnreadNewsCount>({
    queryKey: ['organization', 'news', 'unread-count'],
    queryFn: () => apiFetch(`${API_URL}/organizations/news/unread-count`),
    enabled,
    refetchInterval: 1000 * 60 * 3, // Обновляем раз в 3 минуты
  });
};

/**
 * Хук-мутация для отметки новости как прочитанной
 */
export const useMarkNewsAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (newsId: number) =>
      apiFetch(`${API_URL}/organizations/news/${newsId}/read`, {
        method: 'POST',
      }),
    onSuccess: (_, newsId) => {
      // 1. Оптимистично/быстро обновляем локальный кеш списка новостей
      queryClient.setQueryData<NewsItem[]>(['organization', 'news'], (oldNews) => {
        if (!oldNews) return [];
        return oldNews.filter((item) => item.id !== newsId);
      });

      // 2. Инвалидируем счетчик непрочитанных новостей, чтобы перезапросить актуальный count
      queryClient.invalidateQueries({ queryKey: ['organization', 'news', 'unread-count'] });
    },
  });
};