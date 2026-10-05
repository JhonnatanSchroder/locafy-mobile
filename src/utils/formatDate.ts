export function formatDate(
  value?: string | null,
): string {
  if (!value) {
    return '—';
  }

  // Data pura do Laravel: 2026-10-05
  // Construímos localmente para evitar mudança de dia por timezone.
  const dateOnlyMatch = value.match(
    /^(\d{4})-(\d{2})-(\d{2})$/,
  );

  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch;

    return `${day}/${month}/${year}`;
  }

  // Datetime ISO:
  // 2026-10-05T10:01:00.000000Z
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    console.warn('Data inválida recebida:', value);
    return '—';
  }

  return date.toLocaleDateString('pt-BR');
}
