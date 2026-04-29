'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function VisitaDetalleRedirect() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  useEffect(() => {
    router.replace(`/mecanico/visitas/${id}`);
  }, [id, router]);

  return (
    <div className="px-4 py-10 text-center text-sm text-gray-500">
      Redirigiendo al detalle de la visita...
    </div>
  );
}
