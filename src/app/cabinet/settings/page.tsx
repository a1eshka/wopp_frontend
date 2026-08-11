import UserProfileSettings from "@/components/cabinet/UserProfileSettings";
import { Metadata } from "next";


export const metadata: Metadata = {
  title: "Настройки профиля | WOPP",
  description: "Редактирование личных данных, управление аватаром и контактами в сервисе WOPP.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function SettingsPage() {
  return <UserProfileSettings />;
}