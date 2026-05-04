import { redirect } from 'next/navigation';

/** La lista de visitas se unificó con clientes (/admin/clientes). */
export default function AdminVisitasListRedirectPage() {
  redirect('/admin/clientes');
}
