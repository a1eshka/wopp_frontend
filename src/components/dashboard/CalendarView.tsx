"use client";

import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import ruLocale from "@fullcalendar/core/locales/ru";
import { Plus, Lock, Filter, CalendarIcon, User, X, Settings2, Trash2, ChevronDown, Check, Briefcase, Camera, Image as ImageIcon, Loader2 } from "lucide-react";
import QuickBookingModal from "./QuickBookingModal";
import { useSnackbar } from 'notistack';
import { useStaffList, useUpdateBookingStatus } from "@/app/api/hooks";
import { ConfirmDeleteBlockModal } from "../modals/ConfirmDeleteBlockModal";



interface CalendarViewProps {
  events: any[];
  services: any[];
  onConfirm: (info: any) => void;
  onRefresh: () => void;
  filterMasterId: string;
  setFilterMasterId: (id: string) => void;
  setCalendarDates: (dates: { start: string; end: string }) => void;
}

export default function CalendarView({ events, services, onRefresh, setCalendarDates, filterMasterId, setFilterMasterId }: CalendarViewProps) {
  const { data: masters = [], isLoading: mastersLoading } = useStaffList();
  const { enqueueSnackbar } = useSnackbar();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const filterDropdownRef = useRef<HTMLDivElement>(null);
  const editMasterDropdownRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<any>(null);
  const updateStatusMutation = useUpdateBookingStatus();
  // Состояния интерфейса
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isMasterDropdownOpen, setIsMasterDropdownOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  // === НОВЫЕ СОСТОЯНИЯ ДЛЯ БЛОКИРОВКИ ВРЕМЕНИ ===
  const [isChoiceMenuOpen, setIsChoiceMenuOpen] = useState(false);
  const [rawSelectedSlot, setRawSelectedSlot] = useState<any>(null);
  const [timeBlocks, setTimeBlocks] = useState<any[]>([]);
  // Состояния редактирования
  const [editMasterId, setEditMasterId] = useState("");
  const [editComment, setEditComment] = useState("");
  const [editStart, setEditStart] = useState("");
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isEnteringReason, setIsEnteringReason] = useState(false);
  const [breakReason, setBreakReason] = useState("");
  // Состояния для динамического графика (businessHours)
  const [businessHours, setBusinessHours] = useState<any[]>([]);
  const [isManualPriceMode, setIsManualPriceMode] = useState(false);
  const [customPrice, setCustomPrice] = useState("");
  const [customDiscount, setCustomDiscount] = useState("");
  // Для подтверждения переноса
  const [isDropModalOpen, setIsDropModalOpen] = useState(false);
  const [pendingChangeInfo, setPendingChangeInfo] = useState<any>(null);
  // Список фото для текущей выбранной записи
  const [currentPhotos, setCurrentPhotos] = useState<any[]>([]);
  const isUpdatingEventRef = useRef(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedBlockId, setSelectedBlockId] = useState<number | null>(null);
  const [blockInfo, setBlockInfo] = useState<any>(null);
  // Закрытие дропдаунов по клику вне их области
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target as Node)) {
        setIsFilterDropdownOpen(false);
      }
      if (editMasterDropdownRef.current && !editMasterDropdownRef.current.contains(event.target as Node)) {
        setIsMasterDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);



  // Функция получения и обновления бизнес-часов (рабочего графика)
  const loadBusinessHours = useCallback(async (masterId: string, startStr: string, endStr: string) => {
    if (!masterId || masterId === "all") {
      setBusinessHours([]); // Если выбраны все мастера, очищаем ограничения
      return;
    }

    // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ ДЛЯ РЕЖИМА "ДЕНЬ":
    // Если даты начала и конца совпали, увеличиваем конечную дату на 1 день,
    // чтобы бэкенд выдал расписание на полные сутки.
    let finalEndStr = endStr;
    if (startStr === endStr) {
      const startDateObj = new Date(startStr);
      const nextDateObj = new Date(startDateObj.getTime() + 24 * 60 * 60 * 1000);

      const pad = (n: number) => n.toString().padStart(2, '0');
      finalEndStr = `${nextDateObj.getFullYear()}-${pad(nextDateObj.getMonth() + 1)}-${pad(nextDateObj.getDate())}`;
    }

    try {
      // Отправляем запрос с гарантированным интервалом минимум в 1 день
      const res = await fetch(`https://api.wopp.ru/api/booking/specialists/${masterId}/fullcalendar-schedule?start=${startStr}&end=${finalEndStr}`);

      if (res.ok) {
        const data = await res.json();
        setBusinessHours(data.businessHours);
      }
    } catch (e) {
      console.error("Ошибка при получении живого графика:", e);
    }
  }, []);
  useEffect(() => {
    if (selectedEvent && isDetailOpen) {
      // Безопасно парсим дату старта для datetime-local инпута
      const startIso = selectedEvent.startStr ||
        (selectedEvent.start ? new Date(selectedEvent.start).toISOString().slice(0, 16) : "");

      setEditStart(startIso);
      setEditMasterId(String(selectedEvent.extendedProps?.masterId || selectedEvent.extendedProps?.master_id || ""));
      setEditComment(selectedEvent.extendedProps?.comment || "");
    }
  }, [selectedEvent, isDetailOpen]);
  // Вызывается принудительно при смене фильтра мастера
  const handleMasterFilterChange = useCallback((masterId: string) => {
    setFilterMasterId(masterId);
    setIsFilterDropdownOpen(false);

    const calendarApi = calendarRef.current?.getApi();
    if (calendarApi) {
      const start = calendarApi.view.currentStart.toISOString().split('T')[0];
      const end = calendarApi.view.currentEnd.toISOString().split('T')[0];
      loadBusinessHours(masterId, start, end);
    }
    // ДОБАВИЛИ setFilterMasterId СЮДА:
  }, [loadBusinessHours, setFilterMasterId]);

  // 1. Нормализация данных для FullCalendar
  const calendarEvents = useMemo(() => {
    if (!events || !Array.isArray(events)) return [];
    return events.map((event) => {
      const isBlock = String(event.id).startsWith("block_");

      // Проверяем, завершена ли запись. 
      // Предположим, у тебя в БД статус называется event.status === "completed" или event.is_completed.
      // Если запись завершена, двигать её НЕЛЬЗЯ. Если не завершена (или это блок) — МОЖНО.
      const isCompleted = event.status === "completed" || event.is_completed === true;

      return {
        id: String(event.id),
        title: isBlock ? (event.title || "Технический перерыв") : (event.client_name || "Без имени"),
        start: event.start || event.start_time,
        end: event.end || event.end_time,
        display: isBlock ? "background" : "auto",
        backgroundColor: event.backgroundColor,

        // КРИТИЧЕСКИ ВАЖНО ДЛЯ ПЕРЕМЕЩЕНИЯ:
        // Технические перерывы (блоки) делать неперемещаемыми, а записи клиентов — перемещаемыми, только если они не завершены.
        editable: !isBlock && !isCompleted,

        extendedProps: {
          ...event,
          type: isBlock ? "block" : "appointment",
          masterId: String(event.master_id || event.specialist_id || ""),
          // ... твои остальные свойства
        }
      };
    });
  }, [events]);

  useEffect(() => {
    // Проверяем, что событие есть и это именно запись клиента, а не технический блок
    if (selectedEvent && selectedEvent.extendedProps?.type === "appointment") {
      setEditMasterId(String(selectedEvent.extendedProps?.masterId || ""));
      setEditComment(selectedEvent.extendedProps?.comment || "");
      setCurrentPhotos(selectedEvent.extendedProps?.photos || []);

      const date = new Date(selectedEvent.start);
      const pad = (n: number) => n.toString().padStart(2, '0');
      const localISOTime = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;

      setEditStart(localISOTime);
    }
  }, [selectedEvent]);

  // Функция загрузки фотографии на бэкенд
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const token = localStorage.getItem("token");
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`https://api.wopp.ru/api/booking/${selectedEvent.id}/upload-photo`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData,
      });

      if (res.ok) {
        const newPhoto = await res.json();
        setCurrentPhotos((prev) => [newPhoto, ...prev]);
        enqueueSnackbar("Фото успешно загружено", { variant: "success" });
        if (onRefresh) onRefresh();
      } else {
        enqueueSnackbar("Ошибка при загрузке файла", { variant: "error" });
      }
    } catch {
      enqueueSnackbar("Ошибка сервера при загрузке", { variant: "error" });
    } finally {
      setIsUploading(false);
    }
  };

  // Функция удаления фотографии
  const handlePhotoDelete = async (photoId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Удалить это фото?")) return;

    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`https://api.wopp.ru/api/booking/photos/${photoId}/delete`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` },
      });

      if (res.ok) {
        setCurrentPhotos((prev) => prev.filter((p) => p.id !== photoId));
        enqueueSnackbar("Фото удалено", { variant: "success" });
        if (onRefresh) onRefresh();
      }
    } catch {
      enqueueSnackbar("Ошибка при удалении", { variant: "error" });
    }
  };

  const flatServices = useMemo(() => {
    if (!services || !Array.isArray(services)) return [];
    return services.map((s: any) => ({ ...s, categoryName: s.category_name || 'Общее' }));
  }, [services]);

  //const filteredEvents = useMemo(() => {
  //  if (filterMasterId === "all") return calendarEvents;
  //  return calendarEvents.filter(ev => String(ev.extendedProps.masterId) === filterMasterId);
  //}, [calendarEvents, filterMasterId]);

  // Обработчик клика по событию календаря
  const handleOpenDetail = async (event: any) => {
    // 1. Проверяем, кликнули ли мы на блок
    if (event.extendedProps?.type === "block" || String(event.id).startsWith("block_")) {

      // Отрезаем префикс "block_", получая чистый ID для БД
      const cleanBlockId = event.id.replace("block_", "");

      // Форматируем время для отображения в модалке (извлекаем из event)
      const startTime = event.start ? new Date(event.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "";
      const endTime = event.end ? new Date(event.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "";
      const blockDate = event.start ? new Date(event.start).toLocaleDateString() : "";

      // Запускаем открытие модалки удаления вместо старого confirm!
      setSelectedBlockId(cleanBlockId);
      setBlockInfo({
        date: blockDate,
        time: startTime && endTime ? `${startTime} — ${endTime}` : event.title || "Технический перерыв",
        reason: event.extendedProps?.reason || event.title // если у тебя передается причина блокировки
      });
      setIsDeleteModalOpen(true);

      return; // Прерываем выполнение, чтобы не открывать сайдбар клиента
    }

    // 2. Обычная логика для записей клиентов (открытие сайдбара/деталей)
    setSelectedEvent(event);
    setIsDetailOpen(true);
  };


  const handleCreateTimeBlock = async () => {
    if (!rawSelectedSlot) return;

    // 1. Защитная проверка: если мастер не выбран, функция просто не должна выполняться
    if (!filterMasterId || filterMasterId === "all") {
      enqueueSnackbar("Выберите конкретного мастера для установки перерыва!", { variant: "warning" });
      return;
    }

    const token = localStorage.getItem("token");

    // Улучшенная функция форматирования с защитой от "Invalid Date"
    const formatToLocalISO = (dateValue: any) => {
      const d = new Date(dateValue);
      if (isNaN(d.getTime())) {
        console.error("Неверный формат даты в rawSelectedSlot:", dateValue);
        return null;
      }
      const pad = (n: number) => n.toString().padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    const startStr = formatToLocalISO(rawSelectedSlot.start);
    const endStr = formatToLocalISO(rawSelectedSlot.end);

    // Если даты не распарсились, прерываем выполнение, чтобы не слать на бэкенд NaN-строки
    if (!startStr || !endStr) {
      enqueueSnackbar("Ошибка обработки временного интервала", { variant: "error" });
      return;
    }

    try {
      const res = await fetch("https://api.wopp.ru/api/booking/schedule/block/", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          specialist_id: parseInt(filterMasterId, 10),
          start_datetime: startStr,
          end_datetime: endStr,
          reason: breakReason.trim() || "Технический перерыв" // Твоя причина из инпута
        })
      });

      if (res.ok) {
        enqueueSnackbar("Время успешно заблокировано", { variant: "success" });
        setIsChoiceMenuOpen(false);
        setIsEnteringReason(false); // Сбрасываем режим ввода (прячем инпут блокировки)
        setBreakReason(""); // Очищаем инпут причины для следующего раза
        if (onRefresh) onRefresh(); // Перезагружаем сетку календаря
      } else {
        const errData = await res.json().catch(() => ({}));
        enqueueSnackbar(errData.error || "Ошибка при блокировке времени", { variant: "error" });
      }
    } catch (e) {
      console.error(e);
      enqueueSnackbar("Ошибка соединения с сервером", { variant: "error" });
    }
  };

  const handleRequestDelete = (block: any) => {
    setSelectedBlockId(block.id);
    setBlockInfo({
      date: block.block_date,
      time: `${block.start_time} — ${block.end_time}`
    });
    setIsDeleteModalOpen(true);
  };

  // Вызывается при подтверждении в модалке
  const handleConfirmDelete = async () => {
    if (!selectedBlockId) return;
    setIsDeleting(true);
    try {
      const response = await fetch(`https://api.wopp.ru/api/booking/schedule/block/${selectedBlockId}/`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) {
        throw new Error("Не удалось удалить перерыв");
      }

      setIsDeleteModalOpen(false);

      // Здесь обновляешь стейт расписания локально или дергаешь onRefresh
      if (onRefresh) onRefresh();

    } catch (error) {
      alert("Ошибка при удалении технического перерыва");
      console.error(error);
    } finally {
      setIsDeleting(false);
      setSelectedBlockId(null);
    }
  };

  const handleSaveEdit = useCallback(async () => {
    const token = localStorage.getItem("token");

    // 1. Динамически вычисляем ИСХОДНУЮ длительность сессии в минутах напрямую из дат
    let durationMinutes = 60; // дефолт на крайний случай
    if (selectedEvent?.start) {
      const origStart = new Date(selectedEvent.start).getTime();
      // Если у события есть явный end, берем его, иначе ищем в extendedProps
      const origEndStr = selectedEvent.end || selectedEvent.extendedProps?.end_time || selectedEvent.extendedProps?.end;

      if (origEndStr) {
        const origEnd = new Date(origEndStr).getTime();
        const diffMs = origEnd - origStart;
        if (diffMs > 0) {
          durationMinutes = Math.round(diffMs / 60000);
        }
      } else if (selectedEvent.extendedProps?.duration) {
        // Резервный вариант, если бэкенд присылал готовое поле duration
        durationMinutes = parseInt(selectedEvent.extendedProps.duration, 10);
      }
    }

    // 2. Рассчитываем новое время завершения на основе измененного старта
    const startDate = new Date(editStart);
    const endDate = new Date(startDate.getTime() + durationMinutes * 60000);

    const pad = (n: number) => n.toString().padStart(2, '0');
    const formattedEndTime = `${endDate.getFullYear()}-${pad(endDate.getMonth() + 1)}-${pad(endDate.getDate())}T${pad(endDate.getHours())}:${pad(endDate.getMinutes())}`;

    try {
      const res = await fetch(`https://api.wopp.ru/api/booking/${selectedEvent.id}/update`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          specialist_id: editMasterId ? parseInt(editMasterId, 10) : null,
          start_time: editStart,
          end_time: formattedEndTime, // Теперь здесь всегда оригинальная длительность сессии
          comment: editComment
        })
      });
      if (res.ok) {
        enqueueSnackbar("Запись успешно обновлена", { variant: "success" });
        setIsEditing(false);
        setIsDetailOpen(false);
        if (onRefresh) onRefresh();
      } else {
        const errData = await res.json().catch(() => ({}));
        enqueueSnackbar(errData.detail || "Ошибка валидации времени на сервере", { variant: "error" });
      }
    } catch {
      enqueueSnackbar("Ошибка сохранения", { variant: "error" });
    }
  }, [selectedEvent, editMasterId, editStart, editComment, onRefresh, enqueueSnackbar]);

  const handleCancelBooking = useCallback(async () => {
    if (!confirm("Вы действительно хотите отменить запись?")) return;
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`https://api.wopp.ru/api/booking/${selectedEvent.id}/cancel`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        enqueueSnackbar("Запись отменена", { variant: "success" });
        setIsDetailOpen(false);
        if (onRefresh) onRefresh();
      }
    } catch { enqueueSnackbar("Ошибка при отмене", { variant: "error" }); }
  }, [selectedEvent, onRefresh, enqueueSnackbar]);
  const handleQuickSave = async (newBookingData: any) => {
    const token = localStorage.getItem("token");

    const dataSrc = newBookingData?.data ? newBookingData.data : newBookingData;

    // 1. Извлекаем и парсим ВЕСЬ массив ID услуг
    const rawServiceIds = dataSrc?.services_ids || [];
    const parsedServiceIds = Array.isArray(rawServiceIds)
      ? rawServiceIds.map((id: any) => parseInt(id, 10)).filter((id: number) => !isNaN(id))
      : [];

    // Если массив пустой, проверяем старое одиночное поле на всякий случай
    if (parsedServiceIds.length === 0 && dataSrc?.service_id) {
      const singleParsed = parseInt(dataSrc.service_id, 10);
      if (!isNaN(singleParsed)) {
        parsedServiceIds.push(singleParsed);
      }
    }

    // Если в итоге ничего не выбрали — ругаемся
    if (parsedServiceIds.length === 0) {
      enqueueSnackbar("Пожалуйста, выберите корректную услугу из списка", { variant: "error" });
      return;
    }

    // 2. Нормализуем номер телефона
    const rawPhone = dataSrc?.client_phone || "";
    let digits = rawPhone.replace(/\D/g, "");

    if (digits.length === 11 && digits.startsWith("8")) {
      digits = "7" + digits.slice(1);
    } else if (digits.length === 10 && !digits.startsWith("7") && !digits.startsWith("8")) {
      digits = "7" + digits;
    }

    const finalPhoneWithPlus = `+${digits}`;

    if (finalPhoneWithPlus.length !== 12 || !finalPhoneWithPlus.startsWith("+7")) {
      enqueueSnackbar("Введите корректный номер телефона (11 цифр)", { variant: "error" });
      return;
    }

    // 3. Формируем финальный payload с ПОЛНЫМ массивом услуг
    const finalPayload = {
      services_ids: parsedServiceIds, // <-- ТЕПЕРЬ ТУТ ВСЕ ВЫБРАННЫЕ УСЛУГИ!
      specialist_id: dataSrc?.specialist_id ? parseInt(dataSrc.specialist_id, 10) : null,
      client_name: dataSrc?.client_name || "Без имени",
      client_phone: finalPhoneWithPlus,
      start_time: dataSrc?.start_time || ""
    };

    try {
      const res = await fetch("https://api.wopp.ru/api/booking/quick-create", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(finalPayload)
      });

      if (res.ok) {
        enqueueSnackbar("Запись создана!", { variant: "success" });
        setIsModalOpen(false);
        if (onRefresh) onRefresh();
      } else {
        const errorData = await res.json().catch(() => ({}));
        console.error("Бэкенд отклонил запрос. Ответ сервера:", errorData);

        const errorMsg = errorData.detail?.[0]?.msg || "Ошибка валидации на сервере";
        enqueueSnackbar(errorMsg, { variant: "error" });
      }
    } catch (e) {
      console.error("Сетевой краш fetch:", e);
      enqueueSnackbar("Ошибка сервера", { variant: "error" });
    }
  };

  const handleEventChange = useCallback((changeInfo: any) => {
    if (isUpdatingEventRef.current) return;

    const { event } = changeInfo;

    // Твоя проверка на завершенные записи (если нужно)
    if (event.extendedProps?.is_completed || event.extendedProps?.currentPhotos?.length > 0) {
      enqueueSnackbar("Нельзя переносить завершенные записи", { variant: "error" });
      changeInfo.revert();
      return;
    }

    // Защита от багов отображения "Дня" (из твоего кода)
    const d = new Date(event.start);
    const pad = (n: number) => n.toString().padStart(2, '0');
    const startStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

    if (startStr.endsWith("T00:00") && !changeInfo.oldEvent.start.toISOString().includes("T00:00")) {
      enqueueSnackbar("Ошибка сетки дня FullCalendar. Попробуйте переместить еще раз", { variant: "warning" });
      changeInfo.revert();
      return;
    }

    // Вместо отправки запроса — сохраняем инфо и открываем модалку
    setPendingChangeInfo(changeInfo);
    setIsDropModalOpen(true);
  }, [enqueueSnackbar]);

  const confirmEventChange = async () => {
    if (!pendingChangeInfo) return;

    const token = localStorage.getItem("token");
    const { event } = pendingChangeInfo;

    const formatLocal = (dateObj: Date | null) => {
      if (!dateObj) return null;
      const d = new Date(dateObj);
      const pad = (n: number) => n.toString().padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    const startStr = formatLocal(event.start);
    const endStr = event.end ? formatLocal(event.end) : null;

    try {
      isUpdatingEventRef.current = true;

      const res = await fetch(`https://api.wopp.ru/api/booking/${event.id}/update`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          start_time: startStr,
          end_time: endStr,
          specialist_id: event.extendedProps?.masterId ? parseInt(event.extendedProps.masterId) : null
        })
      });

      if (res.ok) {
        enqueueSnackbar("Время записи успешно изменено", { variant: "success" });
        setIsDropModalOpen(false);
        setPendingChangeInfo(null);
        if (onRefresh) await onRefresh();
      } else {
        const errData = await res.json().catch(() => ({}));
        enqueueSnackbar(errData.detail || "Не удалось сохранить изменения", { variant: "error" });
        pendingChangeInfo.revert();
        setIsDropModalOpen(false);
      }
    } catch {
      enqueueSnackbar("Ошибка сети при сохранении", { variant: "error" });
      pendingChangeInfo.revert();
      setIsDropModalOpen(false);
    } finally {
      setTimeout(() => {
        isUpdatingEventRef.current = false;
      }, 300);
    }
  };

  const cancelEventChange = () => {
    if (pendingChangeInfo) {
      pendingChangeInfo.revert(); // Возвращаем карточку назад на сетку
    }
    setIsDropModalOpen(false);
    setPendingChangeInfo(null);
  };
  if (mastersLoading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }
  return (
    <div className="relative overflow-hidden bg-white rounded-2xl md:rounded-[2rem] p-3 sm:p-6 md:p-8 border border-slate-200 min-h-[600px] md:min-h-[800px]">
      <style>{`
    ${calendarStyles}
    /* Мобильные оптимизации для FullCalendar */
    @media (max-width: 640px) {
      .fc .fc-toolbar {
        flex-direction: column;
        gap: 0.75rem;
        align-items: stretch;
      }
      .fc .fc-toolbar-title {
        font-size: 1.125rem !important;
        text-align: center;
      }
      .fc .fc-button {
        padding: 0.4rem 0.6rem !important;
        font-size: 0.75rem !important;
      }
      .fc-timegrid-slot {
        height: 50px !important; /* Увеличиваем высоту слота для удобного тапа пальцем */
      }
      .fc-timegrid-axis-frame {
        font-size: 10px !important;
      }
    }
  `}</style>

      {/* ================= ШАПКА ================= */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 md:mb-8">
        {/* Иконка + Заголовок */}
        <div className="flex items-center gap-3 md:gap-4">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-olive-50 text-olive-400 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0">
            <CalendarIcon size={20} className="md:w-6 md:h-6" />
          </div>
          <div>
            <h2 className="text-lg md:text-xl font-black text-slate-900 leading-tight">Журнал записей</h2>
            <p className="text-slate-500 text-xs md:text-sm font-medium">Управление временем и мастерами</p>
          </div>
        </div>

        {/* Кнопки действия и Фильтр */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* ФИЛЬТР МАСТЕРОВ */}
          <div className="relative flex-1 sm:flex-initial" ref={filterDropdownRef}>
            <button
              type="button"
              onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
              className="w-full sm:w-auto flex items-center justify-between gap-2 px-3 sm:pl-4 sm:pr-10 py-2.5 bg-slate-50 text-slate-800 rounded-xl text-xs sm:text-sm font-bold border border-slate-200/60 hover:bg-slate-100 transition-all cursor-pointer outline-none relative h-[44px]"
            >
              <div className="flex items-center gap-2 truncate">
                <Filter size={16} className="text-slate-500 shrink-0" />
                {filterMasterId === "all" ? (
                  "Все мастера"
                ) : (
                  <>
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: masters?.find((m: any) => String(m.id) === filterMasterId)?.color || '#3b82f6' }}
                    />
                    <span className="truncate max-w-[90px] sm:max-w-[120px]">
                      {masters?.find((m: any) => String(m.id) === filterMasterId)?.display_name}
                    </span>
                  </>
                )}
              </div>
              <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 shrink-0 ${isFilterDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isFilterDropdownOpen && (
              <div className="absolute top-full left-0 sm:left-auto sm:right-0 w-full sm:w-52 mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 p-1.5 animate-in fade-in slide-in-from-top-3 duration-150">
                <button
                  onClick={() => handleMasterFilterChange("all")}
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-between transition-colors ${filterMasterId === "all" ? "bg-blue-50 text-blue-600" : "text-slate-700 hover:bg-slate-50"}`}
                >
                  <span>Все мастера</span>
                  {filterMasterId === "all" && <Check size={14} />}
                </button>
                {masters?.map((m: any) => {
                  const isSelected = filterMasterId === String(m.id);
                  return (
                    <button
                      key={m.id}
                      onClick={() => handleMasterFilterChange(String(m.id))}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-left transition-colors ${isSelected ? "bg-blue-50 text-blue-600" : "text-slate-700 hover:bg-slate-50"}`}
                    >
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: m.color || '#3b82f6' }} />
                      <span className="truncate flex-1">{m.display_name}</span>
                      {isSelected && <Check size={14} />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* КНОПКА "НОВАЯ ЗАПИСЬ" */}
          <button
            onClick={() => {
              const now = new Date();
              const offset = now.getTimezoneOffset() * 60000;
              const localISOTime = new Date(now.getTime() - offset).toISOString().slice(0, 16);
              setSelectedSlot(localISOTime);
              setIsModalOpen(true);
            }}
            className="flex items-center justify-center gap-2 bg-gray-900 text-white px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold hover:bg-gray-800 transition-all shadow-lg shadow-blue-600/10 cursor-pointer shrink-0 h-[44px]"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">Новая запись</span>
            <span className="sm:hidden">Запись</span>
          </button>
        </div>
      </div>
      <div className={`transition-all duration-300 ${isDetailOpen ? "blur-xs opacity-60 pointer-events-none select-none" : ""}`}>
        {/* ================= СЕТКА КАЛЕНДАРЯ ================= */}
        <FullCalendar
          ref={calendarRef}
          plugins={[timeGridPlugin, interactionPlugin]}
          initialView="timeGridDay"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'timeGridDay,timeGridWeek'
          }}
          select={(info) => {
            setRawSelectedSlot(info);
            setSelectedSlot(info.startStr.substring(0, 16));

            if (filterMasterId === "all") {
              setIsModalOpen(true);
            } else {
              setIsChoiceMenuOpen(true);
            }
          }}
          locale={ruLocale}
          selectable={true}
          editable={true}
          eventStartEditable={true}
          eventDurationEditable={true}
          events={calendarEvents}
          eventChange={handleEventChange}
          eventDrop={handleEventChange}
          eventResize={handleEventChange}
          eventClick={(info) => handleOpenDetail(info.event)}
          slotMinTime="09:00:00"
          slotMaxTime="23:00:00"
          slotDuration="00:30:00"
          allDaySlot={false}
          height="auto"
          nowIndicator={true}
          expandRows={true}
          slotLabelFormat={{ hour: '2-digit', minute: '2-digit', meridiem: false }}
          firstDay={1}

          businessHours={businessHours}

          selectOverlap={(event) => event.display !== 'background'}
          eventOverlap={(stillEvent, movingEvent) => stillEvent.display !== 'background'}
          eventAllow={(dropInfo, draggedEvent) => true}

          datesSet={(dateInfo) => {
            let start = dateInfo.startStr.split('T')[0];
            let end = dateInfo.endStr.split('T')[0];

            if (dateInfo.view.type === 'timeGridDay' || dateInfo.view.type === 'dayGridDay' || start === end) {
              const startDateObj = new Date(dateInfo.startStr);
              const nextDateObj = new Date(startDateObj.getTime() + 24 * 60 * 60 * 1000);

              const pad = (n: number) => n.toString().padStart(2, '0');
              end = `${nextDateObj.getFullYear()}-${pad(nextDateObj.getMonth() + 1)}-${pad(nextDateObj.getDate())}`;
            }

            setCalendarDates((prev: any) => {
              if (prev.start === start && prev.end === end) return prev;
              return { start, end };
            });

            if (filterMasterId && filterMasterId !== "all") {
              loadBusinessHours(filterMasterId, start, end);
            }
          }}

          /* ================= КОНТЕНТ КАРТОЧКИ (АДАПТИВНЫЙ) ================= */
          eventContent={(eventInfo) => {
            const master = masters?.find((m: any) => String(m.id) === String(eventInfo.event.extendedProps.masterId));
            const eventColor = master?.color || "#3b82f6";
            const serviceName = eventInfo.event.extendedProps?.serviceName ||
              eventInfo.event.extendedProps?.service_name ||
              "Услуга";

            return (
              <div
                className="p-1 sm:p-1.5 overflow-hidden h-full flex flex-col justify-between rounded-lg sm:rounded-xl transition-all"
                style={{ backgroundColor: eventColor, borderLeft: '3px solid rgba(0,0,0,0.25)' }}
              >
                <div>
                  <div className="text-[8px] sm:text-[9px] font-black opacity-80 uppercase leading-none mb-0.5 sm:mb-1 text-white">
                    {eventInfo.timeText}
                  </div>
                  <div className="font-black text-[10px] sm:text-[11px] truncate leading-tight text-white mb-0.5">
                    {eventInfo.event.title}
                  </div>
                  <div className="text-[9px] sm:text-[10px] text-white/90 font-medium truncate italic leading-none">
                    {serviceName}
                  </div>
                </div>

                <div className="flex items-center gap-1 mt-0.5 sm:mt-1 pt-0.5 sm:pt-1 border-t border-white/20">
                  <User size={9} className="text-white/80 shrink-0 sm:w-2.5 sm:h-2.5" />
                  <span className="text-[9px] sm:text-[10px] font-bold text-white/90 truncate">
                    {master?.display_name || master?.name || "Мастер"}
                  </span>
                </div>
              </div>
            );
          }}
        />
      </div>

      {/* ================= МОДАЛЬНОЕ ОКНО (BOTTOM SHEET НА МОБИЛКАХ) ================= */}
      {isChoiceMenuOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-[100] animate-in fade-in duration-150 text-slate-900 p-0 sm:p-4">
          <div className="bg-white p-5 sm:p-6 rounded-t-[2rem] sm:rounded-[2.5rem] shadow-2xl max-w-sm w-full border border-slate-50 transform animate-in slide-in-from-bottom-5 sm:zoom-in-95 duration-150">

            {/* Индикатор свайпа/ручки для мобильных устройств */}
            <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-4 sm:hidden" />

            {/* Шапка */}
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg sm:text-xl font-black tracking-tight">Выберите действие</h3>
              <button
                type="button"
                onClick={() => {
                  setIsChoiceMenuOpen(false);
                  setIsEnteringReason(false);
                  setBreakReason("");
                }}
                className="p-1.5 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            {/* Отображение текущего интервала */}
            <p className="text-xs font-bold text-slate-500 mb-4 sm:mb-5 bg-slate-50 p-3.5 sm:p-4 rounded-2xl border border-slate-100/50 flex flex-col gap-0.5">
              <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Выбранный интервал</span>
              <span className="text-xs sm:text-sm font-black text-slate-800">
                {rawSelectedSlot ? (
                  `${new Date(rawSelectedSlot.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – ${new Date(rawSelectedSlot.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                ) : ""}
              </span>
            </p>

            <div className="flex flex-col gap-3">
              {!isEnteringReason ? (
                <>
                  {/* Кнопка: Записать клиента */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsChoiceMenuOpen(false);
                      setIsModalOpen(true);
                    }}
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-black py-3.5 sm:py-4 px-4 rounded-2xl transition-all shadow-xl shadow-blue-100 active:scale-95 text-xs uppercase tracking-wider"
                  >
                    <User size={14} strokeWidth={3} /> Записать клиента
                  </button>

                  <hr className="border-slate-100 my-0.5" />

                  {/* Кнопка перехода в режим перерыва */}
                  <button
                    type="button"
                    onClick={() => setIsEnteringReason(true)}
                    className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-black py-3.5 sm:py-4 px-4 rounded-2xl transition-all active:scale-95 text-xs uppercase tracking-wider"
                  >
                    <Lock size={14} /> Заблокировать (Перерыв)
                  </button>
                </>
              ) : (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
                  {/* Кнопки быстрого выбора минут */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Длительность перерыва</label>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { label: "10 мин", value: 10 },
                        { label: "15 мин", value: 15 },
                        { label: "30 мин", value: 30 },
                        { label: "45 мин", value: 45 },
                        { label: "1 час", value: 60 },
                      ].map((item) => {
                        const currentDurationMin = rawSelectedSlot
                          ? Math.round((new Date(rawSelectedSlot.end).getTime() - new Date(rawSelectedSlot.start).getTime()) / 60000)
                          : 0;
                        const isSelected = currentDurationMin === item.value;

                        return (
                          <button
                            key={item.value}
                            type="button"
                            onClick={() => {
                              if (!rawSelectedSlot) return;
                              const startTime = new Date(rawSelectedSlot.start).getTime();
                              const newEndTime = new Date(startTime + item.value * 60000);

                              setRawSelectedSlot({
                                ...rawSelectedSlot,
                                end: newEndTime
                              });
                            }}
                            className={`px-3 py-2 text-xs font-black rounded-xl border transition-all active:scale-95 ${isSelected
                              ? "bg-blue-50 border-blue-200 text-blue-700 shadow-sm"
                              : "bg-slate-50 border-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                              }`}
                          >
                            {item.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* ПОЛЕ ВВОДА ПРИЧИНЫ */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center ml-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Причина блокировки</label>
                      <button
                        type="button"
                        onClick={() => {
                          setIsEnteringReason(false);
                          setBreakReason("");
                        }}
                        className="text-[10px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest"
                      >
                        Назад
                      </button>
                    </div>

                    <div className="w-full relative flex items-center">
                      <button
                        type="button"
                        onClick={handleCreateTimeBlock}
                        className="absolute left-2 z-10 p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all active:scale-95 shadow-md shadow-blue-100"
                        title="Сохранить перерыв"
                      >
                        <Check size={14} strokeWidth={3} />
                      </button>

                      <input
                        autoFocus
                        type="text"
                        placeholder="Обед, личное время..."
                        value={breakReason}
                        onChange={(e) => setBreakReason(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleCreateTimeBlock();
                          if (e.key === 'Escape') {
                            setIsEnteringReason(false);
                            setBreakReason("");
                          }
                        }}
                        className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl py-3.5 sm:py-4 pl-12 pr-4 font-bold text-xs text-slate-800 placeholder:text-slate-400 focus:ring-0 transition-all outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- ВСПЛЫВАЮЩЕЕ ОКНО ДЕТАЛЕЙ (SIDEBAR) --- */}
      {isDetailOpen && selectedEvent && (() => {
        const isCompleted = selectedEvent.extendedProps?.status === "completed";
        const isCancelled = selectedEvent.extendedProps?.status === "cancelled";

        // --- ЛОГИКА ЦЕНООБРАЗОВАНИЯ ---
        // Базовая (исходная) цена услуги
        const basePrice = Number(selectedEvent.extendedProps?.base_price || selectedEvent.extendedProps?.price || 0);

        // Фактическая финальная цена, сохраненная в БД для закрытых чеков
        const savedFinalPrice = selectedEvent.extendedProps?.final_price || selectedEvent.extendedProps?.price;

        // Процент скидки
        const clientPersonalDiscount = isCompleted
          ? Number(selectedEvent.extendedProps?.discount || 0)
          : Number(selectedEvent.extendedProps?.client_discount || selectedEvent.extendedProps?.discount || 0);

        // Вычисляемая авто-цена для незакрытого визита
        const autoFinalPrice = basePrice - (basePrice * (clientPersonalDiscount / 100));

        // Итоговое отображаемое значение надписи "К оплате"
        const displayPrice = isCompleted
          ? Number(savedFinalPrice || 0)
          : autoFinalPrice;

        // Вытаскиваем имя клиента (у FullCalendar это может быть selectedEvent.title или внутри extendedProps)
        const clientName = selectedEvent.title || selectedEvent.extendedProps?.client_name || "Клиент";

        return (
          <div className="absolute top-0 right-0 w-85 h-full bg-white border-l border-slate-100 shadow-[-20px_0_50px_rgba(0,0,0,0.02)] z-50 animate-in slide-in-from-right duration-300 p-6 flex flex-col font-sans select-none">

            {/* Шапка сайдбара */}
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 shrink-0">
              <div className="space-y-0.5">
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  {isEditing ? "Редактирование" : "Детали записи"}
                </h3>
                {!isEditing && (
                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide ${isCompleted ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                      isCancelled ? "bg-rose-50 text-rose-700 border border-rose-100" :
                        selectedEvent.extendedProps?.status === "confirmed" ? "bg-blue-50 text-blue-700 border border-blue-100" :
                          "bg-amber-50 text-amber-700 border border-amber-100"
                    }`}>
                    <span className={`w-1 h-1 rounded-full ${isCompleted ? "bg-emerald-500" : isCancelled ? "bg-rose-500" : "bg-blue-500"
                      }`} />
                    {isCompleted ? "Выполнено" : isCancelled ? "Отменено" : "Подтверждено"}
                  </span>
                )}
              </div>
              <button
                onClick={() => {
                  setIsDetailOpen(false);
                  setIsEditing(false);
                  setIsManualPriceMode(false);
                  setCustomPrice("");
                  setCustomDiscount("");
                }}
                className="p-2 hover:bg-slate-50 rounded-xl transition-all text-slate-400 hover:text-slate-800"
              >
                <X size={18} />
              </button>
            </div>

            {/* Контентная часть */}
            <div className="flex-1 overflow-y-auto pt-4 space-y-5 pb-6 scrollbar-none">

              {/* Карточка Клиента */}
              <div className="space-y-1 px-1">
                <p className="text-[9px] font-bold uppercase text-slate-400 tracking-widest">Клиент</p>
                <div className="flex items-center justify-between">
                  {/* Защита: даже если идет редактирование, имя клиента должно отображаться стабильно */}
                  <p className="font-semibold text-slate-900 text-base tracking-tight">{clientName}</p>
                  {clientPersonalDiscount > 0 && (
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-50 text-indigo-600 rounded-md border border-indigo-100/40">
                      Дисконт {clientPersonalDiscount}%
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 font-medium tracking-wide">
                  {selectedEvent.extendedProps?.client_phone || selectedEvent.extendedProps?.phone || "Телефон не указан"}
                </p>
              </div>

              {/* Услуга и Стоимость */}
              <div className="space-y-1.5">
                <p className="text-[9px] font-bold uppercase text-slate-400 tracking-widest px-1">Услуга и чек визита</p>
                <div className="p-3 bg-slate-50/50 rounded-xl flex items-center justify-between border border-slate-100/80">
                  <div className="flex items-center gap-2 truncate">
                    <Briefcase size={14} className="text-slate-400 shrink-0" />
                    <p className="text-xs font-semibold text-slate-800 truncate">
                      {selectedEvent.extendedProps?.serviceName || selectedEvent.extendedProps?.service_name || "Услуга не указана"}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${isCompleted ? 'bg-emerald-50 text-emerald-700 border border-emerald-100/50' : 'bg-slate-100 text-slate-600'}`}>
                      {displayPrice.toLocaleString('ru-RU')} ₽
                    </span>
                    {clientPersonalDiscount > 0 && (
                      <p className="text-[9px] text-slate-400 line-through mt-0.5 font-medium">{basePrice.toLocaleString('ru-RU')} ₽</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Результат работы (Фотофиксация) */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center px-1">
                  <p className="text-[9px] font-bold uppercase text-slate-400 tracking-widest">Результат работы</p>
                  {!isCompleted && !isCancelled && (
                    <>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handlePhotoUpload}
                      />
                      <button
                        type="button"
                        disabled={isUploading}
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-1 text-[10px] font-bold text-blue-600 uppercase tracking-wider hover:text-blue-700 transition-colors cursor-pointer bg-transparent border-none"
                      >
                        <Camera size={11} /> {isUploading ? "Загрузка..." : "Добавить фото"}
                      </button>
                    </>
                  )}
                </div>

                <div className="relative rounded-xl border border-transparent transition-all duration-200">
                  {currentPhotos && currentPhotos.length > 0 ? (
                    <div className="grid grid-cols-3 gap-1.5 p-1.5 bg-slate-50/40 rounded-xl border border-slate-100/80">
                      {currentPhotos.map((photo: any) => (
                        <div key={photo.id} className="relative aspect-square rounded-lg overflow-hidden border border-slate-200/60 bg-white group">
                          <img
                            src={photo.image}
                            alt="Результат"
                            className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-200"
                            onClick={() => window.open(photo.image, '_blank')}
                          />
                          {!isCompleted && (
                            <button
                              type="button"
                              onClick={(e) => handlePhotoDelete(photo.id, e)}
                              className="absolute top-1 right-1 p-1 bg-slate-900/80 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                            >
                              <X size={8} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 border border-dashed border-slate-200/80 rounded-xl flex flex-col items-center justify-center text-center text-slate-400 bg-slate-50/10">
                      <ImageIcon size={16} className="mb-1 opacity-50" />
                      <span className="text-[10px] font-medium tracking-wide">Фотофиксация отсутствует</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Мастер / Специалист */}
              <div className="space-y-1.5">
                <p className="text-[9px] font-bold uppercase text-slate-400 tracking-widest px-1">Специалист</p>
                {isEditing ? (
                  <div className="relative" ref={editMasterDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setIsMasterDropdownOpen(!isMasterDropdownOpen)}
                      className="w-full flex items-center justify-between p-3 bg-slate-50/80 rounded-xl text-xs font-semibold text-slate-800 border border-slate-100 hover:bg-slate-100/50 focus:border-slate-300 transition-all text-left outline-none"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: masters.find((m: any) => String(m.id) === editMasterId)?.color || '#3b82f6' }} />
                        <span className="truncate">{masters.find((m: any) => String(m.id) === editMasterId)?.display_name || "Выберите мастера"}</span>
                      </div>
                      <ChevronDown size={14} className={`text-slate-400 transition-transform ${isMasterDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isMasterDropdownOpen && (
                      <div className="absolute top-full left-0 w-full mt-1.5 bg-white border border-slate-100 rounded-xl shadow-xl z-50 p-1 max-h-40 overflow-y-auto">
                        {masters.map((m: any) => {
                          const isSelected = String(m.id) === editMasterId;
                          return (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => { setEditMasterId(String(m.id)); setIsMasterDropdownOpen(false); }}
                              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-left transition-colors ${isSelected ? "bg-blue-50 text-blue-600" : "text-slate-600 hover:bg-slate-50"}`}
                            >
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: m.color }} />
                              <span className="truncate flex-1">{m.display_name}</span>
                              {isSelected && <Check size={12} />}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-3 bg-slate-50/50 rounded-xl flex items-center gap-2 border border-slate-100/80">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: masters.find((m: any) => String(m.id) === editMasterId)?.color || '#3b82f6' }} />
                    <p className="text-xs font-semibold text-slate-800 truncate">{masters.find((m: any) => String(m.id) === editMasterId)?.display_name || "Не назначен"}</p>
                  </div>
                )}
              </div>

              {/* Время проведения */}
              <div className="space-y-1.5">
                <p className="text-[9px] font-bold uppercase text-slate-400 tracking-widest px-1">Время проведения</p>
                {isEditing ? (
                  <input
                    type="datetime-local"
                    value={editStart || ""}
                    onChange={(e) => setEditStart(e.target.value)}
                    className="w-full bg-slate-50/80 p-3 rounded-xl font-semibold border border-slate-100 text-slate-800 text-xs focus:border-slate-300 focus:bg-white transition-all outline-none"
                  />
                ) : (
                  <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-100/80">
                    <p className="text-xs font-semibold text-slate-800 tracking-wide">
                      {editStart ? new Date(editStart).toLocaleString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }) : "Время не указано"}
                    </p>
                  </div>
                )}
              </div>

              {/* Комментарий к записи */}
              <div className="space-y-1.5">
                <p className="text-[9px] font-bold uppercase text-slate-400 tracking-widest px-1">Комментарий</p>
                {isEditing ? (
                  <textarea
                    value={editComment || ""}
                    onChange={(e) => setEditComment(e.target.value)}
                    className="w-full bg-slate-50/80 p-3 rounded-xl font-semibold border border-slate-100 text-slate-800 text-xs focus:border-slate-300 focus:bg-white transition-all resize-none outline-none"
                    rows={2}
                    placeholder="Добавьте комментарий..."
                  />
                ) : (
                  <div className="p-3 bg-slate-50/50 rounded-xl text-xs text-slate-500 min-h-[46px] border border-slate-100/80 font-medium">
                    {editComment || "Нет комментария"}
                  </div>
                )}
              </div>

              {/* ⚡️ ULTRA-CLEAN SAAS BILLING CARD */}
              {!isEditing && selectedEvent.extendedProps?.status === "confirmed" && (
                <div className="pt-3 font-sans select-none animate-in fade-in duration-200">
                  <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] space-y-4">

                    {/* 1. Заголовок и текущая скидка */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
                        <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                          Расчет стоимости
                        </span>
                      </div>

                      {/* Индикатор примененной скидки */}
                      {(Number(customDiscount || clientPersonalDiscount) > 0) && (
                        <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100/80 px-2 py-0.5 rounded-md">
                          Скидка {isManualPriceMode ? (customDiscount || 0) : clientPersonalDiscount}%
                        </span>
                      )}
                    </div>

                    {/* 2. Блок ввода итоговой суммы (Автоматически пересчитывается) */}
                    <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100/80 focus-within:bg-white focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/10 transition-all">
                      <div className="flex justify-between items-center text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                        <span>Сумма к оплате</span>
                        {isManualPriceMode && (
                          <button
                            type="button"
                            onClick={() => {
                              setCustomPrice("");
                              setCustomDiscount("0");
                              setIsManualPriceMode(false);
                            }}
                            className="text-indigo-600 hover:underline font-bold normal-case tracking-normal"
                          >
                            Сбросить
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          placeholder={autoFinalPrice.toString()}
                          /* Если включен ручной режим и вбита цена руками — показываем её.
                            Если включен ручной режим и выбран процент — рассчитываем цену от базовой на лету.
                            Иначе — показываем автоматическую цену визита.
                          */
                          value={
                            isManualPriceMode
                              ? customPrice || (customDiscount ? Math.max(0, basePrice - (basePrice * (Number(customDiscount) / 100))) : "")
                              : autoFinalPrice
                          }
                          onChange={(e) => {
                            setCustomPrice(e.target.value);
                            setCustomDiscount(""); // При прямом вводе цены сбрасываем проценты, чтобы не путать расчет
                            setIsManualPriceMode(true);
                          }}
                          className="w-full bg-transparent text-2xl font-bold text-slate-900 focus:outline-none placeholder-slate-400 tabular-nums"
                        />
                        <span className="text-lg font-bold text-slate-400">₽</span>
                      </div>

                      {/* Старая зачеркнутая цена для наглядности */}
                      {basePrice > 0 && (Number(customDiscount || clientPersonalDiscount) > 0 || customPrice) && (
                        <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                          Базовая цена: <span className="line-through">{basePrice.toLocaleString('ru-RU')} ₽</span>
                        </p>
                      )}
                    </div>

                    {/* 3. Быстрый выбор скидки (Чипсы) */}
                    <div className="space-y-2 pt-1">
                      <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <span>Быстрый дисконт</span>
                        <span className="text-slate-600 font-mono">
                          {isManualPriceMode ? `${customDiscount || 0}%` : `${clientPersonalDiscount}%`}
                        </span>
                      </div>

                      {/* Пресеты процентов */}
                      <div className="grid grid-cols-5 gap-1.5">
                        {[0, 5, 10, 15, 20].map((pct) => {
                          const activePct = isManualPriceMode ? Number(customDiscount || 0) : Number(clientPersonalDiscount);
                          // Кнопка активна, если процент совпадает И при этом не вписана кастомная статичная сумма
                          const isSelected = activePct === pct && !customPrice;

                          return (
                            <button
                              key={pct}
                              type="button"
                              onClick={() => {
                                setIsManualPriceMode(true);
                                setCustomDiscount(pct.toString());

                                // МГНОВЕННЫЙ ПЕРЕСЧЕТ: Считаем новую цену от базовой и обновляем поле цены
                                const calculatedPrice = Math.max(0, basePrice - (basePrice * (pct / 100)));
                                setCustomPrice(calculatedPrice.toString());
                              }}
                              className={`py-1.5 text-xs font-bold rounded-lg transition-all border ${isSelected
                                  ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                                  : "bg-slate-50 border-slate-200/60 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                                }`}
                            >
                              {pct === 0 ? "0%" : `-${pct}%`}
                            </button>
                          );
                        })}
                      </div>

                      {/* 4. Ползунок для точной настройки процента */}
                      <div className="pt-2">
                        <input
                          type="range"
                          min="0"
                          max="50"
                          step="5"
                          value={isManualPriceMode ? (customDiscount || 0) : clientPersonalDiscount}
                          onChange={(e) => {
                            const pct = Number(e.target.value);
                            setIsManualPriceMode(true);
                            setCustomDiscount(e.target.value);

                            // МГНОВЕННЫЙ ПЕРЕСЧЕТ ДЛЯ СЛАЙДЕРА:
                            const calculatedPrice = Math.max(0, basePrice - (basePrice * (pct / 100)));
                            setCustomPrice(calculatedPrice.toString());
                          }}
                          className="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-slate-900 transition-all dynamic-light-slider"
                          style={{
                            background: `linear-gradient(to right, #0f172a 0%, #0f172a ${((isManualPriceMode ? (customDiscount || 0) : clientPersonalDiscount) / 50) * 100}%, #f1f5f9 ${((isManualPriceMode ? (customDiscount || 0) : clientPersonalDiscount) / 50) * 100}%, #f1f5f9 100%)`
                          }}
                        />
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {/* --- ЗОНА КНОПОК УПРАВЛЕНИЯ --- */}
              <div className="pt-4 border-t border-slate-100 space-y-2 shrink-0">
                {isEditing ? (
                  <>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleSaveEdit(); }}
                      className="w-full py-3 bg-emerald-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xs"
                    >
                      Сохранить изменения
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setIsEditing(false); }}
                      className="w-full py-3 bg-slate-50 text-slate-500 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-100 transition-all"
                    >
                      Отмена
                    </button>
                  </>
                ) : (
                  <>
                    {selectedEvent.extendedProps?.status === "pending" && (
                      <button
                        disabled={updateStatusMutation.isPending}
                        onClick={(e) => {
                          e.stopPropagation();
                          const bookingId = String(selectedEvent.id || (selectedEvent as any)._def?.publicId || selectedEvent.extendedProps?.id);
                          updateStatusMutation.mutate(
                            { id: bookingId, action: "confirm" },
                            {
                              onSuccess: () => {
                                setSelectedEvent((prev: any) => ({
                                  ...prev,
                                  id: bookingId,
                                  extendedProps: { ...prev.extendedProps, status: 'confirmed' }
                                }));
                                enqueueSnackbar("Запись успешно подтверждена", { variant: "success" });
                              },
                              onError: (err: any) => enqueueSnackbar(err.message || "Ошибка подтверждения", { variant: "error" })
                            }
                          );
                        }}
                        className="w-full flex items-center justify-center gap-1.5 py-3.5 bg-blue-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xs"
                      >
                        <Plus size={11} strokeWidth={2.5} />
                        {updateStatusMutation.isPending ? "Обработка..." : "Подтвердить запись"}
                      </button>
                    )}

                    {selectedEvent.extendedProps?.status === "confirmed" && (
                      <button
                        disabled={updateStatusMutation.isPending}
                        onClick={(e) => {
                          e.stopPropagation();
                          const bookingId = String(selectedEvent.id || (selectedEvent as any)._def?.publicId || selectedEvent.extendedProps?.id);

                          let calculatedFinalPrice = autoFinalPrice;
                          let calculatedDiscountPercent = clientPersonalDiscount;

                          if (isManualPriceMode) {
                            const priceStr = String(customPrice || "").trim();
                            const discountStr = String(customDiscount || "").trim();

                            if (priceStr !== "") {
                              calculatedFinalPrice = Number(priceStr);
                              calculatedDiscountPercent = basePrice > 0 ? Math.round(((basePrice - calculatedFinalPrice) / basePrice) * 100) : 0;
                            } else if (discountStr !== "") {
                              calculatedDiscountPercent = Number(discountStr);
                              calculatedFinalPrice = basePrice - (basePrice * (calculatedDiscountPercent / 100));
                            }
                          }

                          updateStatusMutation.mutate(
                            {
                              id: bookingId,
                              action: "complete",
                              success: true,
                              base_price: basePrice,
                              applied_discount_percent: calculatedDiscountPercent,
                              final_price: calculatedFinalPrice
                            },
                            {
                              onSuccess: () => {
                                setSelectedEvent((prev: any) => ({
                                  ...prev,
                                  id: bookingId,
                                  extendedProps: {
                                    ...prev.extendedProps,
                                    status: 'completed',
                                    discount: calculatedDiscountPercent,
                                    base_price: basePrice,
                                    final_price: calculatedFinalPrice
                                  }
                                }));
                                setIsManualPriceMode(false);
                                setCustomPrice("");
                                setCustomDiscount("");
                                enqueueSnackbar("Запись успешно выполнена и закрыта", { variant: "success" });
                              },
                              onError: (err: any) => enqueueSnackbar(err.message || "Ошибка закрытия записи", { variant: "error" })
                            }
                          );
                        }}
                        className="w-full flex items-center justify-center gap-1.5 py-3.5 bg-slate-900 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-black transition-all shadow-xs"
                      >
                        <Check size={11} strokeWidth={2.5} />
                        {updateStatusMutation.isPending ? "Обработка..." : "Закрыть запись"}
                      </button>
                    )}

                    {/* Кнопка Редактирования */}
                    <button
                      onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
                      className="w-full flex items-center justify-center gap-1.5 py-3 bg-slate-50 text-slate-600 border border-slate-100 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-100 transition-all"
                    >
                      <Settings2 size={12} /> Редактировать запись
                    </button>

                    {/* Кнопка отмены визита */}
                    {!isCompleted && !isCancelled && (
                      <button
                        disabled={updateStatusMutation.isPending}
                        onClick={(e) => {
                          e.stopPropagation();
                          const bookingId = String(selectedEvent.id || (selectedEvent as any)._def?.publicId || selectedEvent.extendedProps?.id);
                          updateStatusMutation.mutate(
                            { id: bookingId, action: "cancel" },
                            {
                              onSuccess: () => {
                                setSelectedEvent((prev: any) => ({
                                  ...prev,
                                  id: bookingId,
                                  extendedProps: { ...prev.extendedProps, status: 'cancelled' }
                                }));
                                enqueueSnackbar("Запись отменена", { variant: "info" });
                              },
                              onError: (err: any) => enqueueSnackbar(err.message || "Ошибка отмены", { variant: "error" })
                            }
                          );
                        }}
                        className="w-full flex items-center justify-center gap-1.5 py-3 border border-red-50 text-red-500 bg-red-50/10 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-red-50/50 transition-all"
                      >
                        <X size={12} /> Отменить визит
                      </button>
                    )}
                  </>
                )}
              </div>

            </div>
          </div>
        );
      })()}

      {/* МОДАЛЬНОЕ ОКНО ПОДТВЕРЖДЕНИЯ ПЕРЕНОСА */}
      {/* ДОБАВИЛИ ПРОВЕРКУ: Модалка откроется ТОЛЬКО если старое время в oldEvent не совпадает с новым */}
      {
        isDropModalOpen && pendingChangeInfo && String(pendingChangeInfo.oldEvent?.start) !== String(pendingChangeInfo.event?.start) && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-[2.5rem] p-6 max-w-sm w-full shadow-2xl border border-slate-100 space-y-6 animate-in zoom-in-95 duration-200">

              <div className="text-center space-y-2">
                <h3 className="text-xl font-black text-slate-900 tracking-tight">
                  Подтвердите перенос
                </h3>
                <p className="text-sm text-slate-500 font-medium">
                  Вы действительно хотите перенести запись клиента{" "}
                  <span className="font-bold text-slate-800">
                    {pendingChangeInfo.event.title}
                  </span>?
                </p>
              </div>

              {/* Новое время */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center space-y-1">
                <p className=" text-slate-400">
                  Новое время записи
                </p>
                <p className="text-sm font-black text-blue-600">
                  {pendingChangeInfo.event.start ? new Date(pendingChangeInfo.event.start).toLocaleString("ru-RU", {
                    day: "numeric",
                    month: "long",
                    hour: "2-digit",
                    minute: "2-digit",
                  }) : ""}
                </p>
              </div>

              {/* Кнопки */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={cancelEventChange}
                  className="w-full py-3.5 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95"
                >
                  Отмена
                </button>
                <button
                  onClick={confirmEventChange}
                  className="w-full py-3.5 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all active:scale-95 shadow-md shadow-blue-600/10"
                >
                  Перенести
                </button>
              </div>

            </div>
          </div>
        )
      }
      <QuickBookingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedDate={selectedSlot}
        masters={masters}
        services={flatServices}
        onSave={handleQuickSave}
        currentMasterId={filterMasterId}
      />
      <ConfirmDeleteBlockModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
        blockDetails={blockInfo}
      />
    </div >
  );
}

const calendarStyles = `
  .fc { border: none !important; font-family: inherit; }
  .fc-theme-standard td, .fc-theme-standard th { border-color: #f1f5f9 !important; }
  .fc-col-header-cell { background: #f8fafc; padding: 12px 0 !important; border-radius: 12px 12px 0 0; }
  .fc-col-header-cell-cushion { color: #64748b; font-size: 0.75rem; font-weight: 800; text-transform: uppercase; text-decoration: none !important; }
  .fc-timegrid-slot { height: 5rem !important; border-bottom: 1px dashed #f1f5f9 !important; }
  .fc-timegrid-slot-label-cushion { color: #94a3b8; font-weight: 700; font-size: 0.75rem; }
  .fc-v-event { background-color: #3b82f6 !important; border: none !important; border-radius: 12px !important; padding: 0 !important; box-shadow: 0 4px 12px -2px rgba(59, 130, 246, 0.25); cursor: pointer; transition: all 0.2s ease; }
  .fc-v-event:hover { opacity: 0.9; transform: translateY(-1px); }
  .fc-timegrid-now-indicator-line { border-color: #ef4444 !important; border-width: 2px 0 0 !important; }
  .fc-timegrid-now-indicator-arrow { border-color: #ef4444 !important; border-width: 5px 0 5px 6px !important; }
  .fc-button-primary { background-color: #fff !important; border: 1px solid #e2e8f0 !important; color: #475569 !important; font-weight: 700 !important; text-transform: capitalize !important; padding: 10px 16px !important; border-radius: 12px !important; transition: all 0.15s ease !important; cursor: pointer; font-size: 13px !important; box-shadow: none !important; }
  .fc-button-primary:hover { background-color: #f8fafc !important; border-color: #cbd5e1 !important; color: #1e293b !important; }
  .fc-button-primary:disabled { background-color: #f1f5f9 !important; border-color: #e2e8f0 !important; color: #94a3b8 !important; opacity: 1 !important; }
  .fc-button-active { background-color: #f1f5f9 !important; border-color: #cbd5e1 !important; color: #0f172a !important; }
  .fc-button-group { gap: 4px; }
  .fc-toolbar-title { font-size: 1.125rem !important; font-weight: 900 !important; color: #0f172a !important; text-transform: capitalize; }
  .fc-nonbusiness { background: repeating-linear-gradient(45deg, #f8fafc, #f8fafc 10px, #f1f5f9 10px, #f1f5f9 20px) !important; opacity: 1 !important; }
  .fc-timegrid-col.fc-day-today {
  background-color: rgb(242 242 242 /45%) !important;
}
  .fc-non-business {
  background: repeating-linear-gradient(
    45deg,
    rgba(241, 245, 249, 0.8),       /* slate-100 */
    rgba(241, 245, 249, 0.8) 10px,
    rgba(226, 232, 240, 0.8) 10px,   /* slate-200 */
    rgba(226, 232, 240, 0.8) 20px
  ) !important;
  opacity: 0.7;
}
  .fc-bg-event {
  background: repeating-linear-gradient(
    -45deg,
    rgba(254, 226, 226, 0.6),       /* red-100 */
    rgba(254, 226, 226, 0.6) 10px,
    rgba(254, 202, 202, 0.6) 10px,   /* red-200 */
    rgba(254, 202, 202, 0.6) 20px
  ) !important;
  opacity: 0.8;
}
  
`;