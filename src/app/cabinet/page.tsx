import ClientCabinet from "@/components/cabinet/ClientCabinet";
import { Metadata } from "next";


export const metadata: Metadata = {
  title: "Личный кабинет | WOPP",
  description: "Управление записями, история визитов и любимые мастера в сервисе WOPP.",
  robots: {
    index: false, // Запрещаем индексацию поисковиками для личных кабинетов
    follow: false,
  },
};

export default function CabinetPage() {
  return <ClientCabinet />;
}