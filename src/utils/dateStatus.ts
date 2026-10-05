import { formatDate } from '@/utils/formatDate';

function toLocalNoon(date: string) {
  return new Date(`${date}T12:00:00`);
}

function startOfToday() {
  const date = new Date();
  date.setHours(12, 0, 0, 0);

  return date;
}

export function getDayDifference(date: string) {
  const diff = toLocalNoon(date).getTime() - startOfToday().getTime();

  return Math.round(diff / 86_400_000);
}

export function getRelativeDateLabel(date?: string | null) {
  if (!date) {
    return 'Sem cobrança prevista';
  }

  const days = getDayDifference(date);

  if (days === 0) {
    return 'Hoje';
  }

  if (days < 0) {
    const overdueDays = Math.abs(days);
    return `Atrasada há ${overdueDays} ${overdueDays === 1 ? 'dia' : 'dias'}`;
  }

  if (days <= 7) {
    return `Próxima em ${days} ${days === 1 ? 'dia' : 'dias'}`;
  }

  return formatDate(date);
}
