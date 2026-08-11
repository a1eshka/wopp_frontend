"use client";

import { AlertTriangle, Loader2 } from "lucide-react";

interface ConfirmDeleteBlockModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void>;
    isDeleting: boolean;
    blockDetails?: {
        date: string;
        time: string;
    };
}

export function ConfirmDeleteBlockModal({
    isOpen,
    onClose,
    onConfirm,
    isDeleting,
    blockDetails
}: ConfirmDeleteBlockModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            {/* Бекдроп (Затемнение фона) */}
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />

            {/* Контентное окно */}
            <div className="relative w-full max-w-md bg-white border border-slate-200 shadow-[0_24px_48px_rgba(0,0,0,0.1)] rounded-2xl p-6 space-y-4 animate-in zoom-in-95 duration-150">

                <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                        <AlertTriangle size={20} />
                    </div>

                    <div className="space-y-1 flex-1">
                        <h3 className="font-bold text-slate-900 text-base tracking-tight">
                            Удалить технический перерыв?
                        </h3>
                        <p className="text-xs font-medium text-slate-500 leading-relaxed">
                            Вы собираетесь разблокировать это время для записи клиентов. Это действие нельзя отменить.
                        </p>

                        {blockDetails && (
                            <div className="mt-2.5 p-2 px-3 bg-slate-50 border border-slate-200/60 rounded-lg text-[11px] font-mono text-slate-600 space-y-0.5">
                                <div><span className="text-slate-400">Дата:</span> {blockDetails.date}</div>
                                <div><span className="text-slate-400">Время:</span> {blockDetails.time}</div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Управляющие кнопки */}
                <div className="flex gap-2.5 pt-2">
                    <button
                        onClick={onClose}
                        disabled={isDeleting}
                        className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all duration-150 text-center active:scale-[0.98] disabled:opacity-50"
                    >
                        Отмена
                    </button>

                    <button
                        onClick={onConfirm}
                        disabled={isDeleting}
                        className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-all duration-150 text-center flex items-center justify-center gap-1.5 active:scale-[0.98] disabled:opacity-50 shadow-[0_1px_2px_rgba(225,29,72,0.15)]"
                    >
                        {isDeleting ? (
                            <Loader2 size={13} className="animate-spin" />
                        ) : (
                            "Да, удалить"
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}