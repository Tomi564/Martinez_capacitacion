'use client';

import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { InformeVisitaTaller } from '@/components/taller/InformeVisitaTaller';

export default function InformeVisitaAdminPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  return (
    <div>
      <div className="px-4 pt-4 max-w-lg mx-auto lg:max-w-3xl">
        <button
          type="button"
          onClick={() => {
            if (typeof window !== 'undefined' && window.history.length > 1) router.back();
            else router.push('/admin/clientes');
          }}
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </button>
      </div>
      <InformeVisitaTaller visitaId={id} />
    </div>
  );
}
