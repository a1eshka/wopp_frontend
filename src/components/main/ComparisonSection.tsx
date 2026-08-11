"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion'; // Используем framer-motion для стабильности
import { XCircle, CheckCircle2, AlertCircle, Sparkles, PhoneOff, Calendar as CalendarIcon, ArrowRight } from 'lucide-react';

const ComparisonSection = () => {
  const [mode, setMode] = useState<'chaos' | 'flow'>('chaos');

  const content = {
    chaos: {
      title: "Старый метод",
      subtitle: "Хаос и убытки",
      color: "text-red-400",
      accent: "bg-red-500",
      bg: "bg-red-500/5",
      border: "border-red-500/20",
      items: [
        { icon: <PhoneOff size={18} />, text: "Пропущенные звонки и записи в блокнотах" },
        { icon: <AlertCircle size={18} />, text: "Клиенты забывают о визите без напоминаний" },
        { icon: <XCircle size={18} />, text: "Ошибки в расписании и накладки мастеров" },
      ],
      imageContent: (
        <div className="relative p-8 bg-[#1A1D23] border border-red-500/30 rounded-[2.5rem] rotate-2 shadow-2xl shadow-red-900/20">
          <div className="space-y-4 opacity-40 italic text-xs text-red-200">
            <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20"><s>Стрижка 14:00 (не пришел)</s></div>
            <div className="p-3 bg-slate-800 rounded-xl border border-white/5 w-3/4">Перенос на ???</div>
            <div className="h-16 w-full border border-red-500/10 rounded-xl bg-red-950/20 p-3 flex items-center justify-center">
               <span className="text-[10px] uppercase tracking-widest opacity-30">Клиент потерян</span>
            </div>
          </div>
          <div className="absolute -top-4 -right-4 bg-red-600 text-white px-4 py-2 rounded-xl font-black text-[9px] uppercase tracking-tighter shadow-lg">
            Убытки
          </div>
        </div>
      )
    },
    flow: {
      title: "С Wopp",
      subtitle: "Система и рост",
      color: "text-blue-400",
      accent: "bg-blue-600",
      bg: "bg-blue-600/5",
      border: "border-blue-600/20",
      items: [
        { icon: <CalendarIcon size={18} />, text: "Онлайн-запись 24/7 по ссылке в соцсетях" },
        { icon: <Sparkles size={18} />, text: "Авто-напоминания в WhatsApp и Telegram" },
        { icon: <CheckCircle2 size={18} />, text: "Прозрачный учет доходов и каждого визита" },
      ],
      imageContent: (
        <div className="relative p-8 bg-[#1A1D23] border border-blue-500/40 rounded-[2.5rem] -rotate-2 shadow-2xl shadow-blue-500/20">
          <div className="space-y-5">
            <div className="flex justify-between items-center">
              <div className="px-4 py-2 bg-blue-600 rounded-xl flex items-center justify-center text-[10px] text-white font-black uppercase tracking-widest">
                Визит подтвержден
              </div>
              <span className="text-emerald-400 font-black text-sm">+3 500 ₽</span>
            </div>
            <div className="space-y-2">
               <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest text-white/40">
                  <span>Загрузка филиала</span>
                  <span>94%</span>
               </div>
               <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }} 
                    whileInView={{ width: "94%" }} 
                    className="h-full bg-gradient-to-r from-blue-600 to-indigo-400" 
                  />
               </div>
            </div>
            <div className="flex -space-x-2">
              {[1,2,3].map(i => <div key={i} className="w-8 h-8 rounded-full border-2 border-[#1A1D23] bg-slate-700" />)}
              <div className="w-8 h-8 rounded-full border-2 border-[#1A1D23] bg-blue-600 flex items-center justify-center text-[8px] font-black">+12</div>
            </div>
          </div>
          <div className="absolute -top-4 -right-4 bg-blue-500 text-white px-4 py-2 rounded-xl font-black text-[9px] uppercase tracking-tighter shadow-xl">
            Профит
          </div>
        </div>
      )
    }
  };

  return (
    <section className="py-44 px-6 relative overflow-hidden">
      {/* Декоративный фон для секции */}
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] blur-[150px] transition-colors duration-1000 opacity-20 ${mode === 'chaos' ? 'bg-red-900/40' : 'bg-blue-900/40'}`} />

      <div className="max-w-6xl mx-auto relative z-10">
        
        {/* Переключатель в стиле Premium Glass */}
        <div className="flex flex-col items-center mb-24">
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30 mb-8 italic">Сравнение эффективности</span>
          <div className="inline-flex p-1.5 bg-white/5 backdrop-blur-xl rounded-full border border-white/10">
            <button 
              onClick={() => setMode('chaos')}
              className={`px-10 py-4 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 ${mode === 'chaos' ? 'bg-red-500 text-white shadow-[0_10px_20px_rgba(239,68,68,0.3)]' : 'text-white/40 hover:text-white'}`}
            >
              Как сейчас
            </button>
            <button 
              onClick={() => setMode('flow')}
              className={`px-10 py-4 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 ${mode === 'flow' ? 'bg-blue-600 text-white shadow-[0_10px_20px_rgba(37,99,235,0.3)]' : 'text-white/40 hover:text-white'}`}
            >
              С Wopp
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-16 md:gap-32 items-center">
          <AnimatePresence mode="wait">
            <motion.div 
              key={mode}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 30 }}
              transition={{ duration: 0.5, ease: "circOut" }}
              className="space-y-10"
            >
              <div className="space-y-4">
                <h2 className={`text-5xl md:text-7xl font-black tracking-tighter uppercase italic leading-[0.85] ${content[mode].color}`}>
                  {content[mode].title}
                </h2>
                <h3 className="text-3xl md:text-4xl font-black text-white/90 tracking-tighter uppercase italic">
                   {content[mode].subtitle}
                </h3>
              </div>
              
              <ul className="space-y-6">
                {content[mode].items.map((item, i) => (
                  <motion.li 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 + 0.3 }}
                    key={i} 
                    className="flex items-center gap-5 group"
                  >
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all duration-500 ${mode === 'chaos' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-blue-500/10 border-blue-500/20 text-blue-400'}`}>
                      {item.icon}
                    </div>
                    <span className="text-white/60 font-medium text-lg leading-tight tracking-tight italic">{item.text}</span>
                  </motion.li>
                ))}
              </ul>

              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="pt-8"
              >
                <button className={`flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] transition-colors ${mode === 'chaos' ? 'text-red-400 hover:text-red-300' : 'text-blue-400 hover:text-blue-300'}`}>
                  {mode === 'chaos' ? 'Узнать, как исправить' : 'Начать рост сейчас'} <ArrowRight size={14} />
                </button>
              </motion.div>
            </motion.div>
          </AnimatePresence>

          <div className="relative group">
             {/* Фоновое свечение за карточкой */}
             <div className={`absolute inset-0 blur-[100px] opacity-30 transition-colors duration-1000 ${mode === 'chaos' ? 'bg-red-600' : 'bg-blue-600'}`} />
             
             <AnimatePresence mode="wait">
                <motion.div
                  key={mode}
                  initial={{ opacity: 0, scale: 0.8, rotateY: mode === 'chaos' ? -15 : 15 }}
                  animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                  exit={{ opacity: 0, scale: 0.8, rotateY: mode === 'chaos' ? 15 : -15 }}
                  transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
                  className={`relative z-10 aspect-square rounded-[4rem] border ${content[mode].border} ${content[mode].bg} backdrop-blur-sm flex items-center justify-center p-6 md:p-12 overflow-hidden`}
                >
                  {/* Декоративный "шум" на карточке */}
                  <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none" />
                  
                  {content[mode].imageContent}
                </motion.div>
             </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ComparisonSection;