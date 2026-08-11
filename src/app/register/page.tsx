import RegisterClient from '@/components/auth/RegisterClient';
import type { Metadata } from 'next';


export const metadata: Metadata = {
  title: 'Регистрация нового пользователя',
  description: 'Присоединяйтесь к сервису WOPP: создайте аккаунт для онлайн-записи клиентов и управления рабочим графиком.',
  keywords: ['wopp регистрация', 'создать аккаунт wopp', 'подключить онлайн запись'],
  // Служебные формы закрываем от краулеров поисковиков
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: 'Регистрация в сервисе WOPP',
    description: 'Создайте профиль и начните вести электронный журнал записей клиентов за пару минут.',
    images: ['/media/og_preview.png'],
  },
};

export default function RegisterPage() {
  return <RegisterClient />;
}