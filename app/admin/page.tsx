import { redirect } from "next/navigation";
import { isAdminAuthed } from "@/lib/admin-guard";
import { AdminDashboard } from "@/components/AdminDashboard";

export const dynamic = "force-dynamic";

export default function AdminPage() {
  if (!isAdminAuthed()) {
    redirect("/admin/login");
  }
  return <AdminDashboard />;
}
