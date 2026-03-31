/**
 * (auth)/layout.tsx — Layout del grupo de rutas de autenticación
 *
 * Los grupos de rutas con paréntesis (auth) en Next.js App Router
 * agrupan páginas bajo un layout común SIN afectar la URL.
 * /login sigue siendo /login, no /(auth)/login.
 *
 * Este layout es minimalista a propósito:
 * las páginas de auth no tienen navbar ni bottom nav,
 * solo el contenido centrado en pantalla completa.
 */

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen">
      {children}
    </main>
  );
}