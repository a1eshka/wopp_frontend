import type { Metadata } from 'next';
import LoginClient from '@/components/auth/LoginClient';

export const metadata: Metadata = {
  title: 'Вход в личный кабинет',
  description: 'Авторизация в системе WOPP: электронный журнал записей, управление визитами и график мастеров.',
  keywords: ['wopp вход', 'авторизация wopp', 'личный кабинет wopp', 'вход для мастеров'],
  // Страницы авторизации/входа рекомендуется закрывать от индексации поисковыми роботами
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: 'Вход в личный кабинет WOPP',
    description: 'Войдите в систему для доступа к электронному журналу записей и расписанию.',
    images: ['/media/og_preview.png'],
  },
};

export default function LoginPage() {
  return <LoginClient />;
}