"use client";

import React from 'react';
import { motion } from 'motion/react';
import { TrendingUp, Users, Calendar, ArrowUpRight } from 'lucide-react';

const InterfacePreview = () => {
  return (
    <section className="py-44 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col lg:flex-row gap-20 items-center">
          
          {/* ТЕКСТОВАЯ ЧАСТЬ */}
          <div className="flex-1 space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] font-black uppercase tracking-widest">Live Аналитика</span>
            </div>
            <h2 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tighter leading-[0.9] uppercase">
              Сложное — <br /> <span className="text-blue-600">сделали простым</span>
            </h2>
            <p className="text-slate-500 font-medium text-lg max-w-md">
              Мы убрали сотни лишних кнопок YCLIENTS, оставив только то, что помогает вам зарабатывать. Контролируйте загрузку и финансы в один тап.
            </p>
            
            <ul className="space-y-4 pt-4">
              {['Авто-расчет зарплат', 'История визитов 360°', 'Умный склад'].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm font-black text-slate-900 uppercase tracking-tight">
                  <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                  </div>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* ВИЗУАЛЬНАЯ ЧАСТЬ (Имитация интерфейса) */}
          <div className="flex-1 relative w-full">
            {/* Фоновое свечение */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-blue-400/10 blur-[120px] rounded-full"></div>
            
            <div className="relative grid grid-cols-2 gap-4">
              
              {/* Карточка 1: Выручка */}
              <motion.div 
                whileHover={{ y: -10 }}
                className="col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40"
              >
                <div className="flex justify-between items-end mb-6">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Выручка за март</p>
                    <h3 className="text-4xl font-black text-slate-900 tracking-tighter">1 420 000 ₽</h3>
                  </div>
                  <div className="flex items-center gap-1 text-emerald-500 font-black text-sm">
                    <TrendingUp size={16} /> +12%
                  </div>
                </div>
                <div className="flex gap-2 items-end h-24">
                  {[40, 70, 45, 90, 65, 80, 100].map((h, i) => (
                    <motion.div 
                      key={i}
                      initial={{ height: 0 }}
                      whileInView={{ height: `${h}%` }}
                      transition={{ delay: i * 0.1, duration: 1 }}
                      className="flex-1 bg-slate-50 rounded-t-lg hover:bg-blue-600 transition-colors cursor-pointer"
                    />
                  ))}
                </div>
              </motion.div>

              {/* Карточка 2: Мастера */}
              <motion.div 
                whileHover={{ y: -10 }}
                transition={{ delay: 0.1 }}
                className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40"
              >
                <Users className="text-blue-600 mb-4" size={24} />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Мастера</p>
                <h4 className="text-xl font-black text-slate-900">12 активных</h4>
              </motion.div>

              {/* Карточка 3: Записи */}
              <motion.div 
                whileHover={{ y: -10 }}
                transition={{ delay: 0.2 }}
                className="bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl shadow-blue-900/20"
              >
                <Calendar className="text-blue-400 mb-4" size={24} />
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Записей сегодня</p>
                <h4 className="text-xl font-black text-white">48 визитов</h4>
                <div className="mt-4 flex -space-x-2">
                  {[1,2,3].map(i => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-slate-900 bg-slate-700 flex items-center justify-center text-[8px] font-bold text-white">U{i}</div>
                  ))}
                  <div className="w-8 h-8 rounded-full border-2 border-slate-900 bg-blue-600 flex items-center justify-center text-[8px] font-bold text-white">+45</div>
                </div>
              </motion.div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
export default InterfacePreview;