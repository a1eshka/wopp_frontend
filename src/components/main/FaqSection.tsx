"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Minus, HelpCircle } from 'lucide-react';

const FAQS = [
  {
    q: "Насколько сложно перейти с YCLIENTS?",
    a: "Это займет не более 15 минут. Наша служба заботы бесплатно перенесет вашу базу клиентов, историю визитов и справочник услуг. Вы не потеряете ни одной записи."
  },
  {
    q: "Нужно ли скачивать приложение?",
    a: "Wopp Flow работает в облаке. Вы и ваши мастера можете заходить в систему через любой браузер на смартфоне, планшете или ПК. Также доступно PWA-приложение для мгновенного доступа с рабочего стола."
  },
  {
    q: "Есть ли бесплатный пробный период?",
    a: "Да, мы даем 14 дней полного доступа ко всем функциям бизнес-тарифа. Никаких привязок карт — просто зарегистрируйтесь и начните работать."
  },
  {
    q: "Как клиенты узнают о записи?",
    a: "Система автоматически отправляет элегантные уведомления в WhatsApp, Telegram или по SMS. Вы сами настраиваете время напоминания (например, за 2 часа и за сутки)."
  }
];

const FaqSection = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="py-44 bg-white border-t border-slate-100">
      <div className="max-w-4xl mx-auto px-6">
        
        <div className="text-center mb-24">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-50 border border-slate-100 rounded-full mb-6">
            <HelpCircle size={14} className="text-blue-600" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Центр поддержки</span>
          </div>
          <h2 className="text-5xl font-black text-slate-900 tracking-tighter uppercase leading-none">
            Остались <span className="text-blue-600">вопросы?</span>
          </h2>
        </div>

        <div className="space-y-4">
          {FAQS.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <motion.div 
                key={i}
                className={`rounded-[2.5rem] border transition-all duration-500 ${
                  isOpen ? 'border-blue-200 bg-blue-50/30' : 'border-slate-100 bg-white hover:border-slate-200'
                }`}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="w-full flex items-center justify-between p-8 text-left"
                >
                  <span className={`text-lg font-bold tracking-tight transition-colors ${isOpen ? 'text-blue-600' : 'text-slate-900'}`}>
                    {faq.q}
                  </span>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isOpen ? 'bg-blue-600 text-white rotate-180' : 'bg-slate-50 text-slate-400'}`}>
                    {isOpen ? <Minus size={18} /> : <Plus size={18} />}
                  </div>
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.4, ease: [0.04, 0.62, 0.23, 0.98] }}
                      className="overflow-hidden"
                    >
                      <div className="px-8 pb-8 text-slate-500 font-medium leading-relaxed max-w-2xl">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        {/* CTA под FAQ */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="mt-20 p-10 bg-slate-900 rounded-[3rem] text-center relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-blue-600 opacity-0 group-hover:opacity-10 transition-opacity duration-700"></div>
          <h3 className="text-2xl font-black text-white mb-6 uppercase tracking-tight">Не нашли свой вопрос?</h3>
          <p className="text-slate-400 mb-10 text-sm font-medium">Напишите нам в Telegram — мы отвечаем за 60 секунд.</p>
          <button className="px-10 py-5 bg-white text-black rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform">
            Связаться с поддержкой
          </button>
        </motion.div>

      </div>
    </section>
  );
};

export default FaqSection;