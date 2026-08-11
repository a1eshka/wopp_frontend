"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  Users, Calendar as CalendarIcon,
  Settings, LayoutDashboard, Database, Scissors,
  CirclePlus, BarChart3, MessageSquare, Lock,
  X
} from "lucide-react";

type UserRole = "owner" | "admin" | "master";

interface SubscriptionData {
  plan_id: number;
  current_plan?: string;
  is_active?: boolean;
  auto_renew?: boolean;
  [key: string]: any;
}

interface SidebarProps {
  userRole: UserRole | undefined;
  subscription?: SubscriptionData | null;
  isOpen?: boolean;
  setIsOpen?: (open: boolean) => void;
}

export function Sidebar({ userRole, subscription, isOpen: externalIsOpen, setIsOpen: externalSetIsOpen }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const setIsOpen = externalSetIsOpen || setInternalIsOpen;

  const activeTab = searchParams.get("tab") || "overview";

  const handleTabChange = (tabName: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tabName);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
    setIsOpen(false);
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!userRole) {
    return (
      <aside className="w-64 bg-white border-r border-slate-200 p-6 hidden lg:block shrink-0 animate-pulse">
        <div className="h-9 bg-slate-200 rounded-xl mb-10 w-36" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-11 bg-slate-100 rounded-xl w-full" />
          ))}
        </div>
      </aside>
    );
  }

  const isOwner = userRole === "owner";
  const isAdmin = userRole === "admin";
  const planId = subscription?.plan_id;
  const isAnalyticsLocked = planId === 1;

  const roleLabels: Record<UserRole, string> = {
    owner: "владелец",
    admin: "админ",
    master: "мастер",
  };

  const navContent = (
    <nav className="space-y-1">
      <NavItem
        icon={<LayoutDashboard size={20} />}
        label="Обзор"
        active={activeTab === "overview"}
        onClick={() => handleTabChange("overview")}
      />

      {isOwner && (
        <NavItem
          icon={<BarChart3 size={20} />}
          label="Аналитика"
          active={activeTab === "analytics"}
          disabled={isAnalyticsLocked}
          onClick={() => {
            if (isAnalyticsLocked) {
              handleTabChange("tariffs");
              return;
            }
            handleTabChange("analytics");
          }}
        />
      )}

      {(isOwner || isAdmin) && (
        <NavItem
          icon={<Users size={20} />}
          label="Сотрудники"
          active={activeTab === "masters" || activeTab === "schedule"}
          onClick={() => handleTabChange("masters")}
        />
      )}

      <NavItem
        icon={<CalendarIcon size={20} />}
        label="Записи"
        active={activeTab === "bookings"}
        onClick={() => handleTabChange("bookings")}
      />

      {(isOwner || isAdmin) && (
        <NavItem
          icon={<Scissors size={20} />}
          label="Услуги"
          active={activeTab === "services"}
          onClick={() => handleTabChange("services")}
        />
      )}

      {(isOwner || isAdmin) && (
        <NavItem
          icon={<Database size={20} />}
          label="Клиенты"
          active={activeTab === "clients"}
          onClick={() => handleTabChange("clients")}
        />
      )}

      {(isOwner || isAdmin) && (
        <NavItem
          icon={<MessageSquare size={20} />}
          label="Отзывы"
          active={activeTab === "reviews"}
          onClick={() => handleTabChange("reviews")}
        />
      )}

      {isOwner && (
        <NavItem
          icon={<CirclePlus size={20} />}
          label="Тарифы"
          active={activeTab === "tariffs"}
          onClick={() => handleTabChange("tariffs")}
        />
      )}

      {isOwner && (
        <NavItem
          icon={<Settings size={20} />}
          label="Настройки"
          active={activeTab === "settings"}
          onClick={() => handleTabChange("settings")}
        />
      )}
    </nav>
  );

  return (
    <>
      {/* --- МОБИЛЬНЫЙ ОВЕРЛЕЙ (Затемнение без зазоров) --- */}
      <div
        onClick={() => setIsOpen(false)}
        className={`
          fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300 ease-in-out
          ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}
        `}
      />

      {/* --- МОБИЛЬНАЯ ВЫЕЗЖАЮЩАЯ ПАНЕЛЬ --- */}
      <aside
        className={`
    fixed inset-y-0 left-0 z-50 w-72 bg-white p-6 lg:hidden flex flex-col justify-between
    transform transition-transform duration-300 ease-in-out will-change-transform
    
    ${isOpen ? "translate-x-0" : "-translate-x-full"}
  `}
      >
        <div>
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
            <div
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => handleTabChange("overview")}
            >
              <img src="https://api.wopp.ru/media/org/logo.png" width={100} alt="Logo" />
              <div className="-ml-2 font-medium text-slate-400 text-xs bg-slate-100 px-2 py-0.5 rounded-md lowercase">
                {roleLabels[userRole]}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {navContent}
        </div>
      </aside>

      {/* --- ДЕСКТОПНЫЙ САЙДБАР --- */}
      <aside className="w-64 bg-white border-r border-slate-200 p-6 hidden lg:block shrink-0">
        <div
          className="flex items-center gap-2 mb-10 px-2 cursor-pointer"
          onClick={() => handleTabChange("overview")}
        >
          <img src="https://api.wopp.ru/media/org/logo.png" width={110} alt="Logo" />
          <div className="-ml-2 font-medium text-slate-400 text-xs bg-slate-100 px-2 py-0.5 rounded-md lowercase">
            {roleLabels[userRole]}
          </div>
        </div>

        {navContent}
      </aside>
    </>
  );
}

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
}

function NavItem({ icon, label, active, disabled, onClick }: NavItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center justify-between p-3 rounded-xl transition-all cursor-pointer ${disabled
          ? 'text-slate-300 hover:bg-slate-50 hover:text-slate-400 opacity-70'
          : active
            ? 'bg-gray-900 text-white shadow-lg shadow-slate-900/10'
            : 'text-slate-400 hover:bg-slate-50 hover:text-slate-900'
        }`}
    >
      <div className="flex items-center gap-3 truncate">
        {icon}
        <span className="font-bold text-sm truncate">{label}</span>
      </div>

      {disabled && (
        <Lock size={16} className="text-slate-300 shrink-0 ml-2" />
      )}
    </button>
  );
}