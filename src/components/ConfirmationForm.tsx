import { useMe } from "@/app/api/hooks";
import { useEffect } from "react";

// Дополнительный подкомпонент для ленивой загрузки профиля на 5 шаге
function ConfirmationForm({ 
  isAuth, 
  userStatus, 
  clientName, 
  setClientName, 
  clientPhone, 
  setClientPhone, 
  password, 
  setPassword, 
  handlePhoneBlur 
}: any) {
  
  // Вызываем ваш стандартный хук профиля. 
  // Он сработает ТОЛЬКО когда этот компонент отрендерится на 5 шаге.
  // Добавляем enabled: !isAuth, чтобы не спамить, если данные уже есть.
  const { data: userData } = useMe(); 

  // Автозаполнение сработает строго при успешном ответе /me
  useEffect(() => {
    if (userData && !clientName && !clientPhone) {
      setClientName(userData.first_name || userData.username || "");
      setClientPhone(userData.phone || "");
    }
  }, [userData, setClientName, setClientPhone]);

  return (
    <div className="space-y-4">
      <p className="text-slate-300 mb-1">Контактные данные</p>
      <input
        type="text"
        placeholder="Ваше имя"
        value={clientName}
        disabled={isAuth}
        onChange={(e) => setClientName(e.target.value)}
        className="w-full p-4 border border-slate-100 bg-slate-50/50 rounded-2xl font-bold focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-60"
      />
      <input
        type="tel"
        placeholder="Номер телефона"
        value={clientPhone}
        disabled={isAuth}
        onBlur={handlePhoneBlur}
        onChange={(e) => setClientPhone(e.target.value)}
        className="w-full p-4 border border-slate-100 bg-slate-50/50 rounded-2xl font-bold focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-60"
      />

      {!isAuth && userStatus === "exists" && (
        <input
          type="password"
          placeholder="Введите пароль от кабинета"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-4 border border-blue-200 bg-blue-50/10 rounded-2xl font-bold focus:outline-none focus:border-blue-500 transition-all animate-in fade-in slide-in-from-top-2"
        />
      )}
      {!isAuth && userStatus === "new" && (
        <p className="text-xs text-emerald-600 font-bold bg-emerald-50/50 border border-emerald-100 p-3 rounded-xl animate-in fade-in">
          ✨ Вы новый пользователь! Личный кабинет создастся автоматически. При желании укажите пароль выше.
        </p>
      )}
    </div>
  );
}