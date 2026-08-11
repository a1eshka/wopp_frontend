"use client";

import { useState, useEffect, useMemo } from "react";
import { X, Check, Search, Folder } from "lucide-react";

interface Service {
  id: number;
  name: string;
  price: number;
}

interface Category {
  id: number;
  name: string;
  services?: Service[];
  items?: Service[];
}

interface ServicesPickerProps {
  isOpen: boolean;
  onClose: () => void;
  catalog: Category[];
  selectedServices: { id: number }[];
  onSave: (selectedIds: number[]) => void;
}

export function ServicesPicker({ 
  isOpen, 
  onClose, 
  catalog = [], 
  selectedServices = [], 
  onSave 
}: ServicesPickerProps) {
  const [currentSelection, setCurrentSelection] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Блокировка скролла
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Синхронизация данных
  useEffect(() => {
    if (isOpen && selectedServices) {
      setCurrentSelection(selectedServices.map((s: any) => s.id || s.service_id).filter(Boolean));
      setSearchTerm("");
    }
  }, [isOpen, selectedServices]);

  const getCategoryServices = (category: Category): Service[] => {
    return category.services || category.items || [];
  };

  const filteredCatalog = useMemo(() => {
    const safeCatalog = Array.isArray(catalog) ? catalog : [];
    if (!searchTerm.trim()) return safeCatalog;

    return safeCatalog
      .map((category) => {
        const services = getCategoryServices(category);
        const matchedServices = services.filter((service) =>
          service.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        return { ...category, services: matchedServices };
      })
      .filter((category) => getCategoryServices(category).length > 0);
  }, [catalog, searchTerm]);

  if (!isOpen) return null;

  const toggleService = (id: number) => {
    setCurrentSelection((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  const getCategorySelectionStatus = (category: Category) => {
    const services = getCategoryServices(category);
    if (services.length === 0) return "none";
    
    const selectedInCategory = services.filter(s => currentSelection.includes(s.id));
    
    if (selectedInCategory.length === services.length) return "all";
    if (selectedInCategory.length > 0) return "partial";
    return "none";
  };

  const toggleCategory = (category: Category) => {
    const services = getCategoryServices(category);
    if (services.length === 0) return;

    const serviceIds = services.map(s => s.id);
    const status = getCategorySelectionStatus(category);

    if (status === "all") {
      setCurrentSelection(prev => prev.filter(id => !serviceIds.includes(id)));
    } else {
      setCurrentSelection(prev => {
        const uniqueIds = new Set([...prev, ...serviceIds]);
        return Array.from(uniqueIds);
      });
    }
  };

  const hasResults = filteredCatalog.length > 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/30 backdrop-blur-lg p-4 animate-in fade-in duration-300">
      {/* Контейнер модалки — строгая геометрия и субпиксельный бордер */}
      <div className="bg-white w-full max-w-md rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.12)] overflow-hidden animate-in zoom-in-98 duration-200 flex flex-col max-h-[80vh] border border-slate-200/60">
        
        {/* Шапка модалки */}
        <div className="px-6 pt-6 pb-4 flex justify-between items-start shrink-0">
          <div>
            <h3 className="text-[15px] font-semibold text-slate-900 tracking-tight">Настройка услуг мастера</h3>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">
              Выбрано позиций: <span className="text-slate-800 font-semibold font-mono">{currentSelection.length}</span>
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="p-1 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all duration-150"
          >
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        {/* Инпут поиска в стиле Stripe */}
        <div className="px-6 pb-3 shrink-0">
          <div className="relative flex items-center">
            <Search className="absolute left-3.5 text-slate-400/80 pointer-events-none" size={14} />
            <input 
              type="text"
              placeholder="Поиск по названию или цене..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50/50 border border-slate-200/60 p-2.5 pl-10 pr-8 rounded-xl text-xs font-medium text-slate-800 outline-none placeholder-slate-400 focus:bg-white focus:border-slate-900 focus:shadow-[0_0_0_1px_rgba(15,23,42,1)] transition-all duration-150"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm("")} 
                className="absolute right-3 p-0.5 hover:bg-slate-100 rounded-md text-slate-400 transition-all duration-150"
              >
                <X size={12} strokeWidth={2.5} />
              </button>
            )}
          </div>
        </div>

        {/* Тело списка */}
        <div className="px-6 pb-2 overflow-y-auto flex-1 space-y-6 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
          {hasResults ? (
            filteredCatalog.map((category) => {
              const services = getCategoryServices(category);
              const categoryStatus = getCategorySelectionStatus(category);

              return (
                <div key={category.id} className="space-y-2">
                  
                  {/* Заголовок категории */}
                  <div className="flex items-center justify-between sticky top-0 bg-white py-1.5 z-10">
                    <div className="flex items-center gap-1.5">
                      <Folder size={12} className="text-slate-400" strokeWidth={2} />
                      <span className="text-[11px] font-semibold tracking-tight text-slate-500">
                        {category.name}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.2 bg-slate-100/80 text-slate-500 rounded font-medium font-mono">
                        {services.length}
                      </span>
                    </div>

                    {/* Кнопка "Выбрать все" */}
                    <button
                      type="button"
                      onClick={() => toggleCategory(category)}
                      className={`text-[10px] font-medium px-2 py-1 rounded-md transition-all duration-150 border active:scale-[0.98] ${
                        categoryStatus === "all"
                          ? "bg-slate-900 border-slate-900 text-white"
                          : categoryStatus === "partial"
                          ? "bg-slate-100 border-slate-200 text-slate-700"
                          : "text-slate-500 bg-white hover:bg-slate-50 border-slate-200/80"
                      }`}
                    >
                      {categoryStatus === "all" ? "Сбросить всё" : "Выбрать все"}
                    </button>
                  </div>

                  {/* Список услуг (стильные тонкие строки-ячейки) */}
                  <div className="grid gap-1">
                    {services.map((service) => {
                      const isSelected = currentSelection.includes(service.id);
                      return (
                        <button
                          key={service.id}
                          type="button"
                          onClick={() => toggleService(service.id)}
                          className={`w-full flex items-center justify-between p-3 px-3.5 rounded-xl border text-left transition-all duration-150 active:scale-[0.99] ${
                            isSelected 
                              ? 'border-slate-900/80 bg-slate-50/50' 
                              : 'border-slate-100 hover:border-slate-200/80 hover:bg-slate-50/20 bg-white'
                          }`}
                        >
                          <div className="space-y-0.5 pr-3">
                            <p className="font-medium text-xs text-slate-800 leading-normal">
                              {service.name}
                            </p>
                            <p className="text-[10.5px] text-slate-400 font-medium font-mono">
                              {Number(service.price).toLocaleString('ru-RU')} ₽
                            </p>
                          </div>
                          
                          {/* Тонкий кастомный чекбокс без лишних градиентов */}
                          <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all duration-150 ${
                            isSelected 
                              ? 'bg-slate-900 border-slate-900 text-white' 
                              : 'border-slate-300 bg-white'
                          }`}>
                            {isSelected && <Check size={10} strokeWidth={3} />}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-slate-100 rounded-xl">
              <span className="text-xs text-slate-400 font-medium">Ничего не найдено</span>
            </div>
          )}
        </div>

        {/* Футер модалки (В стиле Stripe/Linear) */}
        <div className="p-4 px-6 bg-slate-50/50 flex gap-2.5 shrink-0 border-t border-slate-100/80 items-center justify-end">
          <button 
            type="button" 
            onClick={onClose} 
            className="px-3.5 py-2 font-medium text-slate-500 hover:text-slate-800 text-xs rounded-lg hover:bg-slate-100/50 transition-colors duration-150"
          >
            Отмена
          </button>
          <button 
            type="button" 
            onClick={() => onSave(currentSelection)} 
            className="bg-slate-900 hover:bg-slate-850 text-white px-4 py-2 rounded-lg font-medium text-xs shadow-[0_1px_2px_rgba(0,0,0,0.05)] active:scale-[0.98] transition-all duration-150"
          >
            Сохранить изменения
          </button>
        </div>
      </div>
    </div>
  );
}