import CreateOrgForm from "@/components/dashboard/CreateOrgForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Регистрация организации",
  description: "Заполните данные для создания и настройки вашего бизнеса.",
  // Приватные формы создания бизнеса не нужно индексировать
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function CreateOrgPage() {
  return <CreateOrgForm />;
}