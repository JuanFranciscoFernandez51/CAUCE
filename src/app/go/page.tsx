import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

// Router post-login: manda a cada rol a su superficie.
export default async function GoPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role === "ADMIN") redirect("/admin");
  if (session.user.clientId) redirect("/portal");
  redirect("/");
}
