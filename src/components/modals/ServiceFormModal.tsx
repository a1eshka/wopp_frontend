"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, ChevronDown, Info, Upload, Trash2, Plus, Check, Tag } from "lucide-react";

export interface CategoryItem {
  id: string | number;
  name: string;
}

export interface ServiceModalProps {
  isOpen?: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void> | void;
  initialData?: any;
  categories?: CategoryItem[];
  onCategoryCreated?: () => Promise<void> | void;
  organizationId?: string | number;
}

export function ServiceModal({
  isOpen = true,
  onClose,
  onSave,
  initialData,
  categories = [],
  onCategoryCreated,
  organizationId,
}: ServiceModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    name: "",
    category_id: "",
    price: "",
    duration: 60,
    consumables_cost: "",
    description: "",
    photoFile: null as File | null,
    photoPreview: null as string | null,
  });

  // Состояния для выпадающего списка и быстрой категории
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isCategorySubmitting, setIsCategorySubmitting] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Инициализация формы
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        category_id: String(initialData.category_id || initialData.category?.id || categories[0]?.id || ""),
        price: initialData.price ? String(initialData.price) : "",
        duration: initialData.duration || 60,
        consumables_cost: initialData.consumables_cost !== null && initialData.consumables_cost !== undefined ? String(initialData.consumables_cost) : "",
        description: initialData.description || "",
        photoFile: null,
        photoPreview: initialData.photo || initialData.photo_url || null,
      });
    } else {
      setFormData({
        name: "",
        category_id: categories[0]?.id ? String(categories[0].id) : "",
        price: "",
        duration: 60,
        consumables_cost: "",
        description: "",
        photoFile: null,
        photoPreview: null,
      });
    }
  }, [initialData, isOpen, categories]);

  // Закрытие выпадающего списка при клике вне его области
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
        setIsCreatingCategory(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!isOpen) return null;

  // Создание новой категории
  const handleCreateCategory = async () => {
    if (!newCategoryName.trim() || isCategorySubmitting) return;

    const token = localStorage.getItem("token");
    try {
      setIsCategorySubmitting(true);
      const res = await fetch("https://api.wopp.ru/api/catalog/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newCategoryName.trim(),
          organization_id: organizationId,
        }),
      });

      if (res.ok) {
        const createdCategory = await res.json();
        if (onCategoryCreated) await onCategoryCreated();

        setFormData((prev) => ({
          ...prev,
          category_id: String(createdCategory.id || createdCategory.category_id),
        }));
        setNewCategoryName("");
        setIsCreatingCategory(false);
        setIsDropdownOpen(false);
      }
    } catch (err) {
      console.error("Ошибка при создании категории:", err);
    } finally {
      setIsCategorySubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        photoFile: file,
        photoPreview: URL.createObjectURL(file),
      }));
    }
  };

  const handleRemovePhoto = () => {
    setFormData((prev) => ({
      ...prev,
      photoFile: null,
      photoPreview: null,
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async () => {
    if (!isFormValid || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await onSave({
        ...formData,
        organizationId,
      });
      onClose();
    } catch (error) {
      console.error("Ошибка сохранения услуги:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCategory = categories.find((c) => String(c.id) === formData.category_id);
  const isFormValid = formData.name.trim().length > 0 && String(formData.price).trim().length > 0 && formData.category_id;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-3xl border border-slate-200/80 shadow-[0_20px_50px_rgba(0,0,0,0.12)] overflow-hidden animate-in zoom-in-98 duration-200 flex flex-col max-h-[90vh]">

        {/* Шапка модального окна */}
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/40 shrink-0">
          <div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight leading-none">
              {initialData ? "Редактировать услугу" : "Новая услуга"}
            </h3>
            <p className="text-xs text-slate-400 mt-1.5">
              Заполните параметры услуги и стоимость
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-200/60 rounded-xl transition-colors text-slate-400 hover:text-slate-800"
          >
            <X size={18} />
          </button>
        </div>

        {/* Форма с прокруткой */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">

          {/* Название услуги */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 ml-0.5">
              Название услуги <span className="text-rose-500">*</span>
            </label>
            <input
              autoFocus
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-medium focus:bg-white focus:border-slate-800 focus:ring-4 focus:ring-slate-900/5 transition-all outline-none text-slate-900 placeholder:text-slate-400"
              placeholder="Напр. Мужская стрижка"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          {/* Кастомный выпадающий список категории */}
          <div className="space-y-1.5" ref={dropdownRef}>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 ml-0.5">
              Категория <span className="text-rose-500">*</span>
            </label>

            <div className="relative">
              {/* Триггер дропдауна */}
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={`w-full bg-slate-50 border rounded-2xl px-4 py-3 text-left flex items-center justify-between transition-all outline-none ${isDropdownOpen
                    ? "bg-white border-slate-800 ring-4 ring-slate-900/5"
                    : "border-slate-200 hover:border-slate-300"
                  }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Tag size={16} className="text-slate-400 shrink-0" />
                  <span className={`text-sm font-medium truncate ${selectedCategory ? "text-slate-900" : "text-slate-400"}`}>
                    {selectedCategory ? selectedCategory.name : "Выберите категорию"}
                  </span>
                </div>
                <ChevronDown
                  size={16}
                  className={`text-slate-400 shrink-0 transition-transform duration-200 ${isDropdownOpen ? "rotate-180 text-slate-800" : ""
                    }`}
                />
              </button>

              {/* Выпадающее меню */}
              {isDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200/90 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="max-h-48 overflow-y-auto p-1.5 space-y-0.5">
                    {categories.length > 0 ? (
                      categories.map((cat) => {
                        const isSelected = String(cat.id) === formData.category_id;
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => {
                              setFormData({ ...formData, category_id: String(cat.id) });
                              setIsDropdownOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${isSelected
                                ? "bg-slate-900 text-white font-semibold"
                                : "text-slate-700 hover:bg-slate-100"
                              }`}
                          >
                            <span className="truncate">{cat.name}</span>
                            {isSelected && <Check size={16} className="shrink-0 text-white" />}
                          </button>
                        );
                      })
                    ) : (
                      <div className="px-3.5 py-3 text-xs text-slate-400 text-center">
                        Категорий пока нет
                      </div>
                    )}
                  </div>

                  {/* Секция добавления прямо в дропдауне */}
                  <div className="p-2 border-t border-slate-100 bg-slate-50/70">
                    {isCreatingCategory ? (
                      <div className="flex items-center gap-1.5 animate-in fade-in duration-150">
                        <input
                          autoFocus
                          type="text"
                          className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-medium focus:border-slate-800 outline-none text-slate-900"
                          placeholder="Имя категории..."
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleCreateCategory();
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={handleCreateCategory}
                          disabled={!newCategoryName.trim() || isCategorySubmitting}
                          className="bg-slate-900 text-white p-2 rounded-xl hover:bg-slate-800 disabled:opacity-50 transition-all shrink-0"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsCreatingCategory(false);
                            setNewCategoryName("");
                          }}
                          className="bg-slate-200 text-slate-600 p-2 rounded-xl hover:bg-slate-300 transition-all shrink-0"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsCreatingCategory(true)}
                        className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-dashed border-slate-300 text-xs font-bold text-slate-700 hover:border-slate-800 hover:bg-white transition-all"
                      >
                        <Plus size={14} /> Создать новую категорию
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Стоимость и Себестоимость */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 ml-0.5">
                Цена (₽) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                placeholder="1500"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-medium focus:bg-white focus:border-slate-800 focus:ring-4 focus:ring-slate-900/5 transition-all outline-none text-slate-900 placeholder:text-slate-400"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 ml-0.5">
                Расходники (₽)
              </label>
              <input
                type="number"
                placeholder="200"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-medium focus:bg-white focus:border-slate-800 focus:ring-4 focus:ring-slate-900/5 transition-all outline-none text-slate-900 placeholder:text-slate-400"
                value={formData.consumables_cost}
                onChange={(e) => setFormData({ ...formData, consumables_cost: e.target.value })}
              />
            </div>
          </div>

          {/* Длительность */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 ml-0.5">
              Длительность (минут)
            </label>
            <input
              type="number"
              step="5"
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-medium focus:bg-white focus:border-slate-800 focus:ring-4 focus:ring-slate-900/5 transition-all outline-none text-slate-900"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
            />
          </div>

          {/* Описание */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 ml-0.5">
              Описание
            </label>
            <textarea
              rows={3}
              placeholder="Подробности услуги для клиентов..."
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-medium focus:bg-white focus:border-slate-800 focus:ring-4 focus:ring-slate-900/5 transition-all outline-none text-slate-900 placeholder:text-slate-400 resize-none"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          {/* Загрузка фото */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 ml-0.5">
              Фотография услуги
            </label>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            {formData.photoPreview ? (
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 group h-36 bg-slate-100 flex items-center justify-center">
                <img
                  src={formData.photoPreview}
                  alt="Превью"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="absolute top-2 right-2 p-2 bg-rose-500/90 text-white rounded-xl backdrop-blur-sm opacity-90 hover:opacity-100 hover:bg-rose-600 transition-all shadow-md"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 rounded-2xl p-4 text-center hover:border-slate-400 hover:bg-slate-50/50 transition-all cursor-pointer flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-slate-600"
              >
                <Upload size={20} />
                <span className="text-xs font-semibold">Нажмите для загрузки фото</span>
              </div>
            )}
          </div>

          {/* Инфо плашка */}
          <div className="flex gap-2.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60 text-slate-600">
            <Info size={16} className="text-slate-400 shrink-0 mt-0.5" />
            <p className="text-xs text-slate-500 leading-relaxed">
              Поля со звездочкой <span className="text-rose-500">*</span> обязательны. Вся информация будет сразу синхронизирована с онлайн-записью.
            </p>
          </div>

        </div>

        {/* Подвал с кнопками */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 py-3.5 rounded-2xl font-bold text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            Отмена
          </button>
          <button
            type="button"
            disabled={!isFormValid || isSubmitting}
            onClick={handleSubmit}
            className={`flex-1 py-3.5 rounded-2xl font-bold text-sm text-center transition-all active:scale-[0.98] ${isFormValid && !isSubmitting
                ? 'bg-slate-900 text-white hover:bg-slate-800 shadow-md shadow-slate-900/10 cursor-pointer'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
          >
            {isSubmitting ? "Сохранение..." : initialData ? "Сохранить" : "Создать"}
          </button>
        </div>

      </div>
    </div>
  );
}