import { HelpCircle } from "lucide-react";
import React, { useState, useEffect, useRef } from "react";

export function StatCard({ title, value, icon, color, bg, suffix = "", tooltipText }: any) {
  const numericValue = typeof value === 'string'
    ? parseInt(value.replace(/[^0-9]/g, ""))
    : value;

  const [displayValue, setDisplayValue] = useState(0);
  const prevValueRef = useRef(0);

  useEffect(() => {
    const start = prevValueRef.current;
    const end = numericValue;
    const duration = 1000;
    let startTimestamp: any = null;

    const step = (timestamp: any) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);

      const current = Math.floor(progress * (end - start) + start);
      setDisplayValue(current);

      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };

    window.requestAnimationFrame(step);
    prevValueRef.current = end;
  }, [numericValue]);

  const formattedDisplay = `${displayValue.toLocaleString()}${suffix ? ' ' + suffix : ''}`;

  return (
    // Добавили relative, чтобы абсолютный тултип позиционировался ровно внутри карточки
    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-100/50 flex flex-col gap-4 transition-all duration-500 hover:scale-[1.02] relative">

      {/* 🌟 НАШ ТУЛТИП В ТОЙ ЖЕ СТИЛИСТИКЕ */}
      {tooltipText && (
        <div className="absolute top-5 right-5 z-40 flex items-center justify-center">
          <div className="relative flex items-center justify-center">
            {/* Иконка-триггер с классом peer */}
            <button
              type="button"
              className="peer p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors cursor-help relative z-30"
            >
              <HelpCircle size={14} />
            </button>

            {/* Всплывающее темное окно, завязанное на peer-hover */}
            <div className="absolute bottom-full right-0 mb-2 w-52 translate-x-[5%] scale-95 rounded-xl bg-slate-950 p-3 text-[11px] font-medium leading-relaxed text-slate-300 opacity-0 shadow-xl border border-slate-800 transition-all duration-200 pointer-events-none z-[100] backdrop-blur-md peer-hover:scale-100 peer-hover:opacity-100">
              {tooltipText}
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-start">
        <div className={`p-3 rounded-2xl ${bg} ${color}`}>
          {React.cloneElement(icon, { size: 24 })}
        </div>
      </div>
      <div>
        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">{title}</p>
        <h2 className={`text-2xl font-extrabold text-slate-900 tabular-nums`}>
          {formattedDisplay}
        </h2>
      </div>
    </div>
  );
}