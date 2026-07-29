import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// Router post-login: manda a cada rol a su superficie.
export default async function GoPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role === "ADMIN") redirect("/admin");

  // Dueño de un tenant con Cauce OS → derecho a SU sistema.
  // Los demás usuarios del cliente van al portal.
  if (session.user.clientId) {
    const tenant = await db.client.findUnique({
      where: { id: session.user.clientId },
      select: { slug: true, modules: true },
    });
    if (tenant && tenant.modules.length > 0) redirect(`/os/${tenant.slug}`);
    redirect("/portal");
  }

  redirect("/");
}
