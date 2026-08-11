"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar as CalendarIcon, X, ChevronRight, Check } from 'lucide-react';

const StickyBooking = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1); // 1: Выбор даты, 2: Время, 3: Успех

  const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  const times = ['10:00', '12:30', '15:00', '18:30'];

  return (
    <div className="fixed bottom-8 right-8 z-[110]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="absolute bottom-20 right-0 w-[350px] bg-white/80 backdrop-blur-2xl border border-slate-200 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] rounded-[2.5rem] overflow-hidden p-8"
          >
            <div className="flex justify-between items-center mb-8">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">Демо-запись</span>
              <button onClick={() => { setIsOpen(false); setStep(1); }} className="text-slate-400 hover:text-slate-900 transition-colors">
                <X size={18} />
              </button>
            </div>

            {step === 1 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h4 className="text-xl font-black text-slate-900 mb-6 tracking-tight">Выберите день</h4>
                <div className="grid grid-cols-7 gap-2 mb-8">
                  {days.map((d, i) => (
                    <div key={d} className="text-center">
                      <span className="text-[9px] font-bold text-slate-400 uppercase mb-2 block">{d}</span>
                      <button 
                        onClick={() => setStep(2)}
                        className={`w-9 h-9 rounded-xl text-xs font-bold transition-all ${i === 2 ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'hover:bg-slate-100 text-slate-600'}`}
                      >
                        {18 + i}
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                <h4 className="text-xl font-black text-slate-900 mb-6 tracking-tight">Доступное время</h4>
                <div className="grid grid-cols-2 gap-3 mb-8">
                  {times.map((t) => (
                    <button 
                      key={t}
                      onClick={() => setStep(3)}
                      className="py-4 border border-slate-100 rounded-2xl text-xs font-black text-slate-600 hover:border-blue-600 hover:text-blue-600 transition-all bg-white/50"
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }} 
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-4"
              >
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Check className="text-blue-600" size={30} />
                </div>
                <h4 className="text-xl font-black text-slate-900 mb-2">Готово!</h4>
                <p className="text-sm text-slate-500 font-medium mb-8">Клиент получит уведомление <br/> в Telegram через 1 секунду.</p>
                <button 
                  onClick={() => { setIsOpen(false); setStep(1); }}
                  className="w-full py-4 bg-slate-900 text-white rounded-full text-[10px] font-black uppercase tracking-widest"
                >
                  Закрыть демо
                </button>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-4 px-8 py-5 rounded-full shadow-2xl transition-all duration-500 ${
          isOpen ? 'bg-slate-900 text-white' : 'bg-blue-600 text-white shadow-blue-300'
        }`}
      >
        <CalendarIcon size={20} />
        <span className="text-xs font-black uppercase tracking-[0.2em]">Попробовать запись</span>
        {!isOpen && <ChevronRight size={16} className="animate-pulse" />}
      </motion.button>
    </div>
  );
};

export default StickyBooking;