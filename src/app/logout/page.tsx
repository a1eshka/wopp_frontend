import LogoutClient from "@/components/auth/LogoutClient";
import type { Metadata } from "next";


export const metadata: Metadata = {
  title: "Выход из системы WOPP",
  // Запрещаем индексацию страницы выхода поисковиками
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function LogoutPage() {
  return <LogoutClient />;
}