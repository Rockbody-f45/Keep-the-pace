import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/supabase/server";
import AdminNav from "@/components/admin/AdminNav";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAdminSession();
  if (!user) {
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen bg-[var(--color-paper)]">
      <AdminNav />
      <div className="container-admin px-5 sm:px-8 py-8">{children}</div>
    </div>
  );
}
