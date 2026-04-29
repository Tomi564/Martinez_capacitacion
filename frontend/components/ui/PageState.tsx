'use client';

import { AlertCircle, Inbox, RefreshCcw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

type PageStateKind = 'loading' | 'error' | 'empty' | 'content';

interface PageStateProps {
  state: PageStateKind;
  onRetry?: () => void;
  emptyMessage?: string;
  emptyAction?: React.ReactNode;
  children?: React.ReactNode;
}

export function PageState({
  state,
  onRetry,
  emptyMessage = 'No hay datos para mostrar.',
  emptyAction,
  children,
}: PageStateProps) {
  if (state === 'loading') {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-20 w-full rounded-xl" />
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-center">
        <AlertCircle className="w-6 h-6 text-red-600 mx-auto mb-2" aria-hidden="true" />
        <p className="text-sm text-red-700 font-medium">No pudimos cargar la información.</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-3 inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold text-red-700 border border-red-200 rounded-xl bg-white hover:bg-red-100"
          >
            <RefreshCcw className="w-4 h-4" aria-hidden="true" />
            Reintentar
          </button>
        )}
      </div>
    );
  }

  if (state === 'empty') {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center">
        <Inbox className="w-7 h-7 text-gray-400 mx-auto mb-2" aria-hidden="true" />
        <p className="text-sm text-gray-500">{emptyMessage}</p>
        {emptyAction ? <div className="mt-3">{emptyAction}</div> : null}
      </div>
    );
  }

  return <>{children}</>;
}
