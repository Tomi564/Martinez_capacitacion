'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { InformeVisitaTaller } from '@/components/taller/InformeVisitaTaller';

export default function InformeVisitaAdminPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <div>
      <div className="px-4 pt-4 max-w-lg mx-auto lg:max-w-3xl">
        <Link
          href={`/admin/clientes/visita/${id}`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al detalle
        </Link>
      </div>
      <InformeVisitaTaller visitaId={id} />
    </div>
  );
}
