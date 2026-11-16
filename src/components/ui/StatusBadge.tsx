type StatusBadgeProps = {
  status: string
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const normalized = status.toUpperCase()
  const tone =
    normalized === 'ACTIVO' || normalized === 'APROBADO'
      ? 'success'
      : normalized === 'PENDIENTE'
        ? 'warning'
        : normalized === 'RECHAZADO'
          ? 'error'
        : 'muted'
  const label =
    normalized === 'ACTIVO' ? 'Activo'
      : normalized === 'PENDIENTE' ? 'Pendiente'
        : normalized === 'SUSPENDIDO_MORA' ? 'Suspendido por mora'
          : normalized === 'INACTIVO' ? 'Inactivo'
            : normalized === 'APROBADO' ? 'Aprobado'
              : normalized === 'RECHAZADO' ? 'Rechazado'
                : status
  return <span className={`status-badge status-${tone}`}><span />{label}</span>
}
