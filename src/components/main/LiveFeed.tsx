"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, TrendingUp, UserCheck, MessageSquare } from 'lucide-react';

const NOTIFICATIONS = [
  { id: 1, text: "Новая запись: Маникюр + Уход", user: "Елена В.", time: "только что", icon: <UserCheck className="text-blue-500" size={14}/> },
  { id: 2, text: "Выручка за сегодня: +12 400 ₽", user: "Система", time: "2 мин. назад", icon: <TrendingUp className="text-emerald-500" size={14}/> },
  { id: 3, text: "Отзыв: «Лучший сервис в городе!»", user: "Анна К.", time: "5 мин. назад", icon: <MessageSquare className="text-amber-500" size={14}/> },
  { id: 4, text: "Мастер Игорь завершил смену", user: "Команда", time: "12 мин. назад", icon: <Bell className="text-slate-400" size={14}/> },
];

const LiveFeed = () => {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % NOTIFICATIONS.length);
        setVisible(true);
      }, 500);
    }, 5000); // Каждые 5 секунд новое уведомление

    return () => clearInterval(interval);
  }, []);

  const current = NOTIFICATIONS[index];

  return (
    <div className="fixed bottom-8 left-8 z-[110] pointer-events-none hidden md:block">
      <AnimatePresence mode="wait">
        {visible && (
          <motion.div
            key={current.id}
            initial={{ opacity: 0, x: -20, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -20, scale: 0.9 }}
            className="flex items-center gap-4 bg-white/70 backdrop-blur-xl border border-slate-200/50 p-4 pr-8 rounded-3xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]"
          >
            <div className="w-10 h-10 rounded-2xl bg-white shadow-sm flex items-center justify-center border border-slate-100">
              {current.icon}
            </div>
            
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{current.user}</span>
                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                <span className="text-[9px] font-bold text-slate-400 uppercase">{current.time}</span>
              </div>
              <p className="text-xs font-medium text-slate-600 tracking-tight">{current.text}</p>
            </div>

            {/* Индикатор прогресса до следующего уведомления */}
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ duration: 5, ease: "linear" }}
              className="absolute bottom-0 left-0 h-[2px] bg-blue-500/20 rounded-full"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LiveFeed;