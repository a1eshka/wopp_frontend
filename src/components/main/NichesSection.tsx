"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Scissors, Sparkles, Stethoscope, Dumbbell, Car, Camera } from 'lucide-react';

const niches = [
  { name: "Beauty-сфера", icon: <Scissors />, desc: "Салоны красоты и барбершопы" },
  { name: "Медицина", icon: <Stethoscope />, desc: "Клиники и стоматологии" },
  { name: "Спорт", icon: <Dumbbell />, desc: "Фитнес-клубы и йога-студии" },
  { name: "Автосервис", icon: <Car />, desc: "Детейлинг и СТО" },
  { name: "Обучение", icon: <Camera />, desc: "Фотостудии и школы танцев" },
  { name: "Услуги", icon: <Sparkles />, desc: "Любой бизнес по записи" },
];

const NichesSection = () => {
  return (
    <section className="py-32 px-6 bg-[#0F1115]">
      <div className="max-w-7xl mx-auto text-center">
        <div className="mb-20">
          <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter mb-6 text-white">
            Идеально для <span className="text-blue-500">вашей</span> ниши
          </h2>
          <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.4em]">
            Адаптируем функционал под специфику вашего дела
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          {niches.map((niche, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -10, backgroundColor: "rgba(255,255,255,0.05)" }}
              className="p-8 rounded-[2rem] border border-white/5 bg-white/[0.02] transition-all group"
            >
              <div className="w-12 h-12 bg-blue-500/10 text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                {React.cloneElement(niche.icon as React.ReactElement)}
              </div>
              <h3 className="text-[13px] font-black uppercase tracking-tight text-white mb-2 italic">
                {niche.name}
              </h3>
              <p className="text-[10px] text-white/30 font-medium leading-tight">
                {niche.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default NichesSection;