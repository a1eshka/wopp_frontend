import { Metadata, ResolvingMetadata } from "next";
import BookingClient from "./BookingForm";


type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { id } = await params;

  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://api.wopp.ru";
    
    // Запрос к твоему эндпоинту с передачей organization_id
    const res = await fetch(`${apiUrl}/api/organizations/booking-init?organization_id=${id}`, {
      next: { revalidate: 60 } // кэширование ответа на 60 секунд
    });

    if (res.ok) {
      const data = await res.json();
      const orgName = data?.organization?.name;

      if (orgName) {
        return {
          title: `Онлайн-запись — ${orgName}`,
        };
      }
    }
  } catch (error) {
    console.error("Ошибка при получении метаданных:", error);
  }

  // Фоллбек, если бэкенд недоступен или имя не пришло
  return {
    title: "Онлайн-запись",
  };
}

export default async function BookingPage({ params }: Props) {
  const { id } = await params;

  return <BookingClient ORG_ID={id} />;
}