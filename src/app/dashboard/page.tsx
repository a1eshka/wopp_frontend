import OrgDashboard from "@/components/dashboard/OrgDashboard";
import { Metadata } from "next";


export const metadata: Metadata = {
  title: "Панель управления | WOPP",
  description: "Управление записями, клиентами, расписанием и аналитикой организации.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function DashboardPage() {
  return <OrgDashboard/>;
}