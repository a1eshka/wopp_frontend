"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
    Building2, Landmark, Hash, Phone, ArrowLeft,
    Loader2, CheckCircle, MapPin, User, Briefcase, ChevronDown
} from "lucide-react";
import { AddressSuggestions, DaDataAddress, DaDataSuggestion } from 'react-dadata';

import 'react-dadata/dist/react-dadata.css';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.wopp.ru';

export default function CreateOrgForm() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        legal_type: "SELF",
        inn: "",
        phone: "",
        category: "beauty",
        address: "",
        owner_fullname: ""
    });

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value.replace(/\D/g, "");
        if (value.startsWith("7") || value.startsWith("8")) value = value.slice(1);

        let formatted = "+7 ";
        if (value.length > 0) formatted += "(" + value.substring(0, 3);
        if (value.length >= 4) formatted += ") " + value.substring(3, 6);
        if (value.length >= 7) formatted += "-" + value.substring(6, 8);
        if (value.length >= 9) formatted += "-" + value.substring(8, 10);

        setFormData({ ...formData, phone: formatted.substring(0, 18) });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const token = localStorage.getItem("accessToken") || localStorage.getItem("token");

        try {
            const res = await fetch(`${API_BASE_URL}/api/organizations/create`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                setSuccess(true);
                setTimeout(() => router.push("/dashboard"), 2000);
            } else {
                const err = await res.json();
                alert(err.message || "Ошибка при сохранении. Проверьте данные.");
            }
        } catch {
            alert("Ошибка соединения с сервером.");
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-700">
                <div className="w-20 h-20 bg-slate-100 text-slate-900 rounded-[2rem] flex items-center justify-center mb-6 shadow-xs border border-slate-200">
                    <CheckCircle size={40} />
                </div>
                <h1 className="text-3xl font-bold text-slate-900 mb-2">Бизнес запущен!</h1>
                <p className="text-slate-500 font-medium text-sm">Переходим в панель управления...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 flex items-center justify-center text-slate-900 antialiased">
            <div className="w-full max-w-2xl bg-white rounded-[32px] shadow-[0_4px_25px_rgba(0,0,0,0.03)] p-6 md:p-10 border border-slate-200/80">

                <button
                    type="button"
                    onClick={() => router.back()}
                    className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-900 mb-6 font-medium text-xs transition-colors cursor-pointer"
                >
                    <ArrowLeft size={16} /> Назад
                </button>

                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Регистрация организации</h1>
                    <p className="text-slate-500 text-xs mt-1">Заполните базовые данные для создания вашей бизнес-карточки</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* ФИО Владельца */}
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-medium uppercase tracking-wider text-slate-400 ml-1">ФИО Владельца / Юр. лица</label>
                        <div className="relative">
                            <input
                                required
                                type="text"
                                placeholder="Иванов Иван Иванович"
                                className="w-full h-12 bg-slate-50/60 border border-slate-200/80 focus:bg-white rounded-2xl pl-11 pr-4 text-xs sm:text-sm font-medium text-slate-900 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition-all"
                                value={formData.owner_fullname}
                                onChange={e => setFormData({ ...formData, owner_fullname: e.target.value })}
                            />
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* Название */}
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-medium uppercase tracking-wider text-slate-400 ml-1">Название бизнеса</label>
                            <div className="relative">
                                <input
                                    required
                                    type="text"
                                    placeholder="Top Gun Barbershop"
                                    className="w-full h-12 bg-slate-50/60 border border-slate-200/80 focus:bg-white rounded-2xl pl-11 pr-4 text-xs sm:text-sm font-medium text-slate-900 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition-all"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            </div>
                        </div>

                        {/* Категория */}
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-medium uppercase tracking-wider text-slate-400 ml-1">Сфера деятельности</label>
                            <div className="relative">
                                <select
                                    className="w-full h-12 bg-slate-50/60 border border-slate-200/80 focus:bg-white rounded-2xl pl-11 pr-10 text-xs sm:text-sm font-medium text-slate-900 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition-all appearance-none cursor-pointer"
                                    value={formData.category}
                                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                                >
                                    <option value="beauty">Красота и уход</option>
                                    <option value="medical">Медицина</option>
                                    <option value="auto">Автосервис</option>
                                    <option value="other">Другое</option>
                                </select>
                                <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                            </div>
                        </div>
                    </div>

                    {/* Адрес с подсказками DaData */}
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-medium uppercase tracking-wider text-slate-400 ml-1">Фактический адрес</label>
                        <div className="relative dadata-custom-wrapper">
                            <MapPin className="absolute left-4 top-3.5 text-slate-400 z-20 pointer-events-none" size={18} />

                            <AddressSuggestions
                                token={process.env.NEXT_PUBLIC_DADATA_API_KEY || ""}
                                value={formData.address ? { value: formData.address, unfiltered_value: formData.address } : undefined}
                                onChange={(suggestion?: DaDataSuggestion<DaDataAddress>) => {
                                    if (suggestion) {
                                        setFormData(prev => ({ ...prev, address: suggestion.value }));
                                    }
                                }}
                                inputProps={{
                                    required: true,
                                    placeholder: "г. Москва, ул. Арбат, 1",
                                    className: "w-full h-12 bg-slate-50/60 border border-slate-200/80 focus:bg-white rounded-2xl pl-11 pr-4 text-xs sm:text-sm font-medium text-slate-900 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition-all"
                                }}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* Тип организации */}
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-medium uppercase tracking-wider text-slate-400 ml-1">Юридический статус</label>
                            <div className="relative">
                                <select
                                    className="w-full h-12 bg-slate-50/60 border border-slate-200/80 focus:bg-white rounded-2xl pl-11 pr-10 text-xs sm:text-sm font-medium text-slate-900 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition-all appearance-none cursor-pointer"
                                    value={formData.legal_type}
                                    onChange={e => setFormData({ ...formData, legal_type: e.target.value })}
                                >
                                    <option value="SELF">Самозанятый</option>
                                    <option value="IP">ИП</option>
                                    <option value="OOO">ООО / Юр. лицо</option>
                                </select>
                                <Landmark className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                            </div>
                        </div>

                        {/* ИНН */}
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-medium uppercase tracking-wider text-slate-400 ml-1">ИНН (10 или 12 цифр)</label>
                            <div className="relative">
                                <input
                                    required
                                    type="text"
                                    maxLength={12}
                                    placeholder="0000000000"
                                    className="w-full h-12 bg-slate-50/60 border border-slate-200/80 focus:bg-white rounded-2xl pl-11 pr-4 text-xs sm:text-sm font-mono font-medium text-slate-900 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition-all"
                                    value={formData.inn}
                                    onChange={e => setFormData({ ...formData, inn: e.target.value.replace(/\D/g, '') })}
                                />
                                <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            </div>
                        </div>
                    </div>

                    {/* Телефон с маской */}
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-medium uppercase tracking-wider text-slate-400 ml-1">Контактный телефон</label>
                        <div className="relative">
                            <input
                                required
                                type="tel"
                                placeholder="+7 (999) 000-00-00"
                                className="w-full h-12 bg-slate-50/60 border border-slate-200/80 focus:bg-white rounded-2xl pl-11 pr-4 text-xs sm:text-sm font-medium text-slate-900 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition-all"
                                value={formData.phone}
                                onChange={handlePhoneChange}
                            />
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        </div>
                    </div>

                    <button
                        disabled={loading}
                        type="submit"
                        className="w-full h-13 mt-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-sm font-semibold transition-all active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-xs"
                    >
                        {loading ? <Loader2 className="animate-spin" size={18} /> : "Создать организацию"}
                    </button>
                </form>
            </div>
        </div>
    );
}