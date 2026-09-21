import { redirect } from "next/navigation";

/** Los usuarios viven en Configuración. */
export default function UsuariosPage() {
  redirect("/admin/config#usuarios");
}
