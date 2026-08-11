"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { Plus, Search, Trash2 } from "lucide-react";
import { useSnackbar } from "notistack";
import DeleteConfirmModal from "../modals/DeleteConfirmModal";

import ServiceCard from "../ServiceCard";
import { ServiceModal } from "../modals/ServiceFormModal";



export default function ServicesManager({ organizationId }: { organizationId: any }) {
  const [catalog, setCatalog] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: "service" | "category"; id: number } | null>(null);

  const [editingService, setEditingService] = useState<any>(null);
  const { enqueueSnackbar } = useSnackbar();

  const categoriesList = useMemo(() => {
    return catalog.map((c) => ({ id: c.id, name: c.name }));
  }, [catalog]);

  const loadData = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!organizationId || !token) return;
    try {
      const res = await fetch(`https://api.wopp.ru/api/catalog/showcase?organization_id=${organizationId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCatalog(data);
      }
    } catch (err) {
      console.error(err);
    }
  }, [organizationId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSave = async (data: any) => {
    const token = localStorage.getItem("token");
    const isEdit = !!editingService;
    const url = isEdit
      ? `https://api.wopp.ru/api/catalog/services/${editingService.id}`
      : `https://api.wopp.ru/api/catalog/services`;

    const formData = new FormData();
    formData.append("category_id", data.category_id);
    formData.append("name", data.name);
    formData.append("description", data.description || "");
    formData.append("price", String(data.price));
    formData.append("duration", String(data.duration));

    if (data.consumables_cost !== null && data.consumables_cost !== "") {
      formData.append("consumables_cost", String(data.consumables_cost));
    }
    if (data.photoFile) {
      formData.append("photo", data.photoFile);
    }

    try {
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (res.ok) {
        enqueueSnackbar(isEdit ? "Услуга обновлена" : "Услуга создана", { variant: "success" });
        await loadData();
        setIsModalOpen(false);
        setEditingService(null);
      } else {
        enqueueSnackbar("Ошибка при сохранении", { variant: "warning" });
      }
    } catch (err) {
      enqueueSnackbar("Ошибка сети", { variant: "error" });
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    const token = localStorage.getItem("token");

    const url =
      deleteTarget.type === "service"
        ? `https://api.wopp.ru/api/catalog/services/${deleteTarget.id}`
        : `https://api.wopp.ru/api/catalog/categories/${deleteTarget.id}`;

    try {
      const res = await fetch(url, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        enqueueSnackbar(deleteTarget.type === "service" ? "Услуга удалена" : "Категория удалена", { variant: "success" });
        await loadData();
      } else {
        const errData = await res.json().catch(() => ({}));
        enqueueSnackbar(errData.detail || "Ошибка удаления", { variant: "error" });
      }
    } catch (err) {
      enqueueSnackbar("Ошибка сети", { variant: "error" });
    } finally {
      setIsDeleteOpen(false);
      setDeleteTarget(null);
    }
  };

  const filteredCatalog = useMemo(() => {
    if (!searchTerm.trim()) return catalog;

    return catalog
      .map((cat) => {
        const filteredServices = (cat.services || []).filter((s: any) =>
          s.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        return { ...cat, services: filteredServices };
      })
      .filter((cat) => cat.services.length > 0);
  }, [catalog, searchTerm]);

  return (
    <div className="space-y-8 p-1">
      {/* ПАНЕЛЬ ПОИСКА И КНОПКА СОЗДАНИЯ */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-slate-50/50 p-4 rounded-3xl border border-slate-100">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            className="w-full p-3.5 pl-12 rounded-2xl bg-white border border-slate-200/80 shadow-sm text-slate-900 placeholder-slate-400 outline-none focus:border-blue-500/40 focus:ring-4 focus:ring-blue-500/5 transition-all text-sm font-medium"
            placeholder="Поиск по услугам..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button
          onClick={() => {
            setEditingService(null);
            setIsModalOpen(true);
          }}
          className="bg-gray-900 text-white px-6 py-3.5 rounded-2xl font-bold text-sm tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-blue-500/15 hover:bg-gray-800 hover:shadow-gray-500/25 active:scale-[0.98] transition-all shrink-0 cursor-pointer"
        >
          <Plus size={18} /> Создать услугу
        </button>
      </div>

      {/* КАТАЛОГ УСЛУГ */}
      <div className="space-y-12">
        {filteredCatalog.map((category) => (
          <div key={category.id} className="space-y-5 animate-in fade-in duration-300">
            {/* Заголовок категории */}
            <div className="flex items-center gap-4 border-b border-slate-100 pb-2">
              <h2 className="text-slate-800 font-extrabold text-xs tracking-widest uppercase bg-slate-100 px-3.5 py-1.5 rounded-xl border border-slate-200/40">
                {category.name}
              </h2>
              <div className="flex-1 h-px bg-slate-100" />
              {(!category.services || category.services.length === 0) && (
                <button
                  onClick={() => {
                    setDeleteTarget({ type: "category", id: category.id });
                    setIsDeleteOpen(true);
                  }}
                  className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                  title="Удалить пустую категорию"
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>

            {category.services && category.services.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {category.services.map((s: any) => (
                  <ServiceCard
                    key={s.id}
                    service={s}
                    categoryId={category.id}
                    onEdit={(serviceToEdit) => {
                      setEditingService(serviceToEdit);
                      setIsModalOpen(true);
                    }}
                    onDelete={(id) => {
                      setDeleteTarget({ type: "service", id });
                      setIsDeleteOpen(true);
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="text-xs font-semibold text-slate-400 italic pl-4 py-3 bg-slate-50/40 border border-dashed border-slate-200/60 rounded-2xl w-fit">
                В этой категории пока нет услуг
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Модалка Формы */}
      {isModalOpen && (
        <ServiceModal
          isOpen={isModalOpen}
          categories={categoriesList}
          initialData={editingService}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSave}
          onCategoryCreated={loadData}
          organizationId={organizationId}
        />
      )}

      {/* Модалка Удаления */}
      {isDeleteOpen && (
        <DeleteConfirmModal
          onClose={() => {
            setIsDeleteOpen(false);
            setDeleteTarget(null);
          }}
          onConfirm={handleConfirmDelete}
        />
      )}
    </div>
  );
}