/**
 * Formata um tempo em horas para uma string amigável de leitura humana
 */
export function formatTimeRemaining(hours: number | null): string {
  if (hours === null || isNaN(hours)) {
    return 'Estabilizada';
  }

  if (hours <= 0) {
    return 'Lotação Iminente';
  }

  if (hours < 0.0833) {
    // Menos de 5 minutos
    return 'Poucos minutos';
  }

  if (hours < 1) {
    const minutes = Math.round(hours * 60);
    return `${minutes} min`;
  }

  if (hours < 24) {
    const hr = Math.floor(hours);
    const min = Math.round((hours - hr) * 60);
    return min > 0 ? `${hr}h ${min}m` : `${hr}h`;
  }

  const days = Math.floor(hours / 24);
  const remainingHours = Math.round(hours % 24);
  return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
}

/**
 * Retorna as classes CSS de estilo baseadas no nível de preenchimento
 */
export function getBinStatus(nivel: number) {
  if (nivel >= 90) {
    return {
      type: 'CRITICAL' as const,
      label: 'CRÍTICO',
      textColor: 'text-rose-600',
      bgColor: 'bg-rose-50',
      borderColor: 'border-rose-200',
      barColor: 'bg-rose-500',
      pulseColor: 'shadow-rose-400/50',
      iconColor: 'text-rose-500'
    };
  }
  
  if (nivel >= 70) {
    return {
      type: 'ALERT' as const,
      label: 'ALERTA',
      textColor: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      barColor: 'bg-amber-500',
      pulseColor: 'shadow-amber-400/50',
      iconColor: 'text-amber-500'
    };
  }

  return {
    type: 'OK' as const,
    label: 'OPERACIONAL',
    textColor: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    barColor: 'bg-emerald-500',
    pulseColor: 'shadow-emerald-400/50',
    iconColor: 'text-emerald-500'
  };
}

/**
 * Formata a data/hora da última atualização para exibição
 */
export function formatLastUpdated(timestampStr: string): string {
  try {
    const date = new Date(timestampStr);
    if (isNaN(date.getTime())) {
      return 'Sem dados';
    }
    
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  } catch {
    return 'Sem dados';
  }
}
