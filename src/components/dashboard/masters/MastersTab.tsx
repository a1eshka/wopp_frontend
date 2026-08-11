"use client";

import { useState, useMemo, useEffect } from "react";
import { Plus, Users, UserCheck } from "lucide-react";
import { MasterCard } from "./MasterCard";
import { ServicesPicker } from "./ServicesPicker";
import { useStaff, useStaffList, useOrgShowcase } from "@/app/api/hooks";
import { AddMasterModal } from "../../modals/AddMasterModal";
import ScheduleTab from "./ScheduleTab";
import { useQueryClient } from "@tanstack/react-query";

export default function MastersTab({ onRefresh }: any) {
  const queryClient = useQueryClient();

  // Извлекаем данные пользователя напрямую из кэша
  const me: any = queryClient.getQueryData(['me']);
  const orgId = me?.organization_id || me?.organization?.id;

  // Получаем список мастеров и каталог услуг для этой организации
  const { data: masters = [], isLoading, error } = useStaffList();
  const { data: catalog = [] } = useOrgShowcase(orgId);

  // Состояния навигации и модалок
  const [activeMaster, setActiveMaster] = useState<any | null>(null);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [scheduleData, setScheduleData] = useState<any>(null);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isVacationOpen, setIsVacationOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const {
    getMonthSchedule, updateColor, deleteMaster, toggleActive, addMaster, updateServices, saveSchedule
  } = useStaff(onRefresh);

  // Хэндлеры с оптимистичным обновлением
  const handleUpdateColor = async (id: number, color: string) => {
    queryClient.setQueryData(['staff'], (oldData: any[]) => {
      if (!oldData) return oldData;
      return oldData.map((m: any) => m.id === id ? { ...m, color } : m);
    });
    await updateColor(id, color);
    if (onRefresh) onRefresh();
  };

  const handleToggleActive = async (id: string) => {
    await toggleActive(id);
    if (onRefresh) onRefresh();
  };

  const handleSave = async (formData: any) => {
    setIsAddModalOpen(false);
    const newMaster = await addMaster(formData);

    if (newMaster) {
      const fullMaster = {
        id: newMaster.id,
        display_name: newMaster.display_name || formData.display_name,
        phone: newMaster.phone || formData.phone,
        position: newMaster.position || formData.position,
        color: newMaster.color || "#3b82f6",
        services: newMaster.services || [],
        is_active: newMaster.is_active ?? true,
        slot_interval: newMaster.slot_interval ?? formData.slot_interval ?? 30,
      };

      queryClient.setQueryData(['staff'], (oldData: any[] | undefined) => {
        return oldData ? [...oldData, fullMaster] : [fullMaster];
      });
    } else {
      setIsAddModalOpen(true);
    }
  };

  const handleOpenSchedule = async (master: any) => {
    setActiveMaster(master);
    setScheduleData(null);
    try {
      const fetchedData = await getMonthSchedule(master.id);
      setScheduleData(fetchedData);
      setIsScheduleOpen(true);
    } catch (error) {
      console.error("Ошибка при получении расписания:", error);
    }
  };

  // Полноэкранный рендер компонента графика работы
  if (isScheduleOpen && activeMaster) {
    return (
      <ScheduleTab
        selectedMaster={activeMaster}
        scheduleData={scheduleData}
        setScheduleData={setScheduleData}
        onSave={async (data) => {
          await saveSchedule(activeMaster.id, data);
          setIsScheduleOpen(false);
          if (onRefresh) onRefresh();
        }}
        onBack={() => setIsScheduleOpen(false)}
      />
    );
  }
  const handleUpdateMaster = async (masterId: string | number, formData: FormData) => {
    try {
      const response = await fetch(`https://api.wopp.ru/api/staff/update-specialist-org/${masterId}`, {
        method: "POST",
        headers: {
          // 'Content-Type' указывать НЕ нужно! 
          // Браузер сам выставит multipart/form-data и добавит правильный boundary.
          "Authorization": `Bearer ${localStorage.getItem("token")}`, // Если используешь JWT токен
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Ошибка при обновлении данных");
      }

      // Обновляем состояние мастеров напрямую в кэше react-query
      queryClient.setQueryData(['staff'], (oldData: any[] | undefined) => {
        if (!oldData) return oldData;
        return oldData.map((m: any) =>
          m.id === masterId
            ? { ...m, ...data.master }
            : m
        );
      });

      // Если в родительском компоненте передан коллбэк общего обновления, вызываем его
      if (onRefresh) onRefresh();

    } catch (error: any) {
      alert(error.message || "Произошла ошибка");
      throw error; // Пробрасываем ошибку дальше, чтобы в MasterCard сбросился лоадер сохранения
    }
  };
  // Скелетон загрузки списка мастеров (подогнан под новые размеры MasterCard)
  if (isLoading) {
    return (
      <div className="space-y-5">
        <div className="h-14 bg-slate-50 border border-slate-200/60 rounded-xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-[260px] bg-white border border-slate-200/60 rounded-2xl p-6 space-y-6 flex flex-col justify-between animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-slate-100 rounded-xl" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-slate-100 rounded w-2/3" />
                  <div className="h-3 bg-slate-100 rounded w-1/3" />
                </div>
              </div>
              <div className="space-y-2.5">
                <div className="h-3 bg-slate-50 rounded w-full" />
                <div className="h-3 bg-slate-50 rounded w-full" />
              </div>
              <div className="flex gap-2.5">
                <div className="h-9 bg-slate-100 rounded-xl flex-1" />
                <div className="h-9 bg-slate-100 rounded-xl w-24" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const activeCount = masters.filter((m: any) => m.is_active).length;

  return (
    <div className="space-y-5 p-0.5">

      {/* ИНФОРМАЦИОННАЯ СТАТИСТИКА (Сдержанная плашка в стиле Stripe) */}
      <div className="flex flex-wrap items-center gap-3 bg-slate-50/40 border border-slate-200/60 p-3 rounded-2xl shrink-0">
        <div className="flex items-center gap-3 px-3.5 py-2 bg-white border border-slate-200/50 rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
          <div className="text-slate-400">
            <Users size={15} />
          </div>
          <div>
            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block">Всего мастеров</span>
            <span className="text-[13px] font-bold text-slate-800 font-mono leading-tight">{masters.length}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 px-3.5 py-2 bg-white border border-slate-200/50 rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
          <div className="text-slate-400">
            <UserCheck size={15} />
          </div>
          <div>
            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block">В штате (активны)</span>
            <span className="text-[13px] font-bold text-slate-800 font-mono leading-tight">{activeCount}</span>
          </div>
        </div>
      </div>

      {/* СЕТКА С МАСТЕРАМИ */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 animate-in fade-in slide-in-from-bottom-2 duration-200">
        {masters.map((master: any) => (
          <MasterCard
            key={master.id}
            master={master}
            onOpenSchedule={handleOpenSchedule}
            onDelete={async (id: any) => { await deleteMaster(id); if (onRefresh) onRefresh(); }}
            onToggle={handleToggleActive}
            onUpdateColor={handleUpdateColor}
            onUpdateMaster={handleUpdateMaster}
            onOpenVacation={(m: any) => { setActiveMaster(m); setIsVacationOpen(true); }}
            onOpenServices={() => { setActiveMaster(master); setIsPickerOpen(true); }}
          />
        ))}

        {/* КНОПКА ДОБАВЛЕНИЯ НОВОГО СОТРУДНИКА (Прецизионный диджитал-дизайн) */}
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="group h-full min-h-[260px] border border-dashed border-slate-200 hover:border-slate-900 rounded-2xl bg-white flex flex-col items-center justify-center gap-4 p-6 transition-all duration-150 active:scale-[0.99] relative overflow-hidden"
        >
          <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200/60 text-slate-400 flex items-center justify-center group-hover:bg-slate-950 group-hover:text-white group-hover:border-slate-950 transition-all duration-150">
            <Plus size={20} className="transition-transform group-hover:rotate-90 duration-200" />
          </div>

          <div className="text-center space-y-0.5">
            <span className="font-semibold text-xs text-slate-800 group-hover:text-slate-950 transition-colors block tracking-tight">
              Добавить сотрудника
            </span>
            <span className="text-[11px] text-slate-400 font-medium block">
              Регистрация нового мастера и услуг
            </span>
          </div>
        </button>
      </div>

      {/* МОДАЛКА ДОБАВЛЕНИЯ МАСТЕРА */}
      <AddMasterModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleSave}
      />

      {/* КАТЕГОРИЙНЫЙ ПИКЕР УСЛУГ */}
      {isPickerOpen && activeMaster && (
        <ServicesPicker
          isOpen={isPickerOpen}
          onClose={() => { setIsPickerOpen(false); setActiveMaster(null); }}
          catalog={catalog}
          selectedServices={activeMaster.services || []}
          onSave={async (ids) => {
            // Оптимистичное обновление выбранных услуг у мастера
            queryClient.setQueryData(['staff'], (oldData: any[]) => {
              if (!oldData) return oldData;
              return oldData.map((m: any) => {
                if (m.id === activeMaster.id) {
                  const flatServices = catalog.flatMap((cat: any) => cat.services || cat.items || []);
                  const updatedServices = flatServices.filter((s: any) => ids.includes(s.id));
                  return { ...m, services: updatedServices };
                }
                return m;
              });
            });

            await updateServices(activeMaster.id.toString(), ids);
            setIsPickerOpen(false);
            if (onRefresh) onRefresh();
          }}
        />
      )}
    </div>
  );
}