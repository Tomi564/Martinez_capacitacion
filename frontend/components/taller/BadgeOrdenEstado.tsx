import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const ORDEN_ESTADO_BADGE: Record<
  string,
  { label: string; variant: 'muted' | 'warning' | 'success' | 'danger' }
> = {
  pendiente_gomero: { label: 'Pendiente gomero', variant: 'muted' },
  pendiente_mecanico: { label: 'Pendiente mecánico', variant: 'warning' },
  finalizado: { label: 'Finalizado', variant: 'success' },
  incompleto: { label: 'Incompleto', variant: 'danger' },
};

export function BadgeOrdenEstado({
  ordenEstado,
  className,
}: {
  ordenEstado: string | null | undefined;
  className?: string;
}) {
  if (!ordenEstado) return null;
  const cfg = ORDEN_ESTADO_BADGE[ordenEstado];
  if (!cfg) {
    return (
      <Badge variant="muted" className={className}>
        {ordenEstado.replace(/_/g, ' ')}
      </Badge>
    );
  }
  return (
    <Badge variant={cfg.variant} className={cn(className)}>
      {cfg.label}
    </Badge>
  );
}
