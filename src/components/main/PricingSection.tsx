"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Check, User, Building2, Zap, Flame } from 'lucide-react';

const PricingSection = () => {
  const plans = [
    {
      name: "Один сотрудник",
      price: "399",
      description: "Для частных мастеров и фрилансеров",
      icon: <User className="text-slate-400" />,
      features: ["Полный CRM-функционал", "Онлайн-запись 24/7", "Уведомления клиентам", "Персональный график"],
      highlight: false
    },
    {
      name: "Организация",
      price: "899",
      description: "Для студий, клиник и больших команд",
      icon: <Building2 className="text-blue-600" />,
      features: ["Безлимит сотрудников", "Учет зарплат и смен", "Управление филиалами", "Аналитика и отчетность"],
      highlight: true
    }
  ];

  return (
    <section id="pricing" className="py-40 px-6 bg-[#FDFDFD] relative overflow-hidden">
      {/* Декоративный фон (Сетка) */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808005_1px,transparent_1px),linear-gradient(to_bottom,#80808005_1px,transparent_1px)] bg-[size:60px_60px]" />

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-28">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-[55px] md:text-[85px] font-black tracking-tighter uppercase leading-none mb-6 italic text-slate-900"
          >
            Прозрачная <span className="text-blue-600">цена.</span>
          </motion.h2>
          <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Профессиональные инструменты по доступной цене</p>
        </div>

        <div className="grid md:grid-cols-2 gap-10 items-start">
          {plans.map((plan, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.2 }}
              whileHover={{ y: -10 }}
              className={`relative p-14 rounded-[3.5rem] border transition-all duration-500 transform-gpu ${
                plan.highlight 
                ? 'bg-blue-600 border-blue-600 shadow-[0_40px_80px_rgba(37,99,235,0.3)] scale-105 z-20 text-white' 
                : 'bg-white border-slate-100 hover:border-slate-200 shadow-xl shadow-slate-100/50 z-10 text-slate-900'
              }`}
            >
              {plan.highlight && (
                <div className="flex absolute -top-5 left-1/2 -translate-x-1/2 bg-white text-blue-600 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl">
                  Популярный выбор
                </div>
              )}

              <div className="flex justify-between items-start mb-12">
                <div className={`p-4 rounded-2xl ${plan.highlight ? 'bg-white/20' : 'bg-slate-50 border border-slate-100'}`}>
                  {plan.icon}
                </div>
                <div className="text-right flex items-baseline gap-2">
                  <div className={`text-6xl font-black tracking-tighter italic ${plan.highlight ? 'text-white' : 'text-slate-900'}`}>
                    {plan.price}
                  </div>
                  <div className={`text-[10px] font-bold uppercase tracking-widest ${plan.highlight ? 'text-white/70' : 'text-slate-400'}`}>
                    ₽/мес
                  </div>
                </div>
              </div>

              <h3 className="text-3xl font-black uppercase tracking-tighter mb-4 italic leading-none">{plan.name}</h3>
              <p className={`text-sm mb-12 font-medium leading-relaxed ${plan.highlight ? 'text-white/80' : 'text-slate-500'}`}>
                {plan.description}
              </p>

              <div className="space-y-4 mb-16">
                {plan.features.map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center ${plan.highlight ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-600'}`}>
                      <Check size={12} strokeWidth={3} />
                    </div>
                    <span className={`text-[13px] font-bold ${plan.highlight ? 'text-white' : 'text-slate-600'}`}>{feature}</span>
                  </div>
                ))}
              </div>

              <button className={`w-full py-7 rounded-3xl font-black uppercase text-[10px] tracking-[0.3em] transition-all transform active:scale-95 ${
                plan.highlight 
                ? 'bg-slate-900 text-white shadow-2xl hover:scale-105' 
                : 'bg-white text-slate-900 border-2 border-slate-100 hover:bg-slate-50'
              }`}>
                Запустить Wopp
              </button>
            </motion.div>
          ))}
        </div>

        <div className="mt-20 text-center">

          <div className="inline-flex items-center gap-4 px-8 py-4 rounded-2xl bg-gray-500/20 border border-gray-200 text-[10px] font-bold uppercase tracking-widest text-gray-800">

            <Zap size={14} className="text-blue-500" />

            Нужно индивидуальное решение? <span className=" hover:text-blue-400 cursor-pointer transition-colors ml-2 underline underline-offset-4">Связаться с нами</span>

          </div>

        </div>
      </div>
    </section>
  );
};

export default PricingSection;