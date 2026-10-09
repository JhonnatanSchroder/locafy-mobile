const API_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const API_DATE_TIME_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/;

function pad(value: number) {
  return String(value).padStart(2, '0');
}

function validLocalDate(
  date: Date,
  year: number,
  month: number,
  day: number,
) {
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

export function apiDateToDate(value?: string | null) {
  if (!value) return null;

  const match = value.match(API_DATE_PATTERN);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);

  return validLocalDate(date, year, month, day) ? date : null;
}

export function dateToApiDate(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function apiDateTimeToDate(value?: string | null) {
  if (!value) return null;

  const match = value.match(API_DATE_TIME_PATTERN);

  if (match) {
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const hour = Number(match[4]);
    const minute = Number(match[5]);
    const second = Number(match[6] ?? 0);
    const date = new Date(year, month - 1, day, hour, minute, second);

    return validLocalDate(date, year, month, day) ? date : null;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

export function dateToApiDateTime(date: Date) {
  return `${dateToApiDate(date)} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function formatDateBR(value?: string | Date | null) {
  const date =
    value instanceof Date
      ? value
      : apiDateToDate(value) ?? apiDateTimeToDate(value);

  if (!date || Number.isNaN(date.getTime())) return '—';

  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
}

export function formatDateTimeBR(value?: string | Date | null) {
  const date =
    value instanceof Date
      ? value
      : apiDateTimeToDate(value) ?? apiDateToDate(value);

  if (!date || Number.isNaN(date.getTime())) return '—';

  return `${formatDateBR(date)} às ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export const formatDate = formatDateBR;
