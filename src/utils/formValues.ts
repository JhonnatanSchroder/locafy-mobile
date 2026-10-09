import { apiDateTimeToDate, dateToApiDateTime } from '@/utils/formatDate';

// Normalize decimal input only; all billing calculations remain in Laravel.
export function decimalInput(value: string) {
  const normalized = value.trim().replace(',', '.');
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) throw new Error('Informe um valor decimal válido (ex.: 15,00).');
  return normalized;
}
export function integerInput(value: string) {
  if (!/^\d+$/.test(value.trim())) throw new Error('Informe uma quantidade inteira.');
  return Number(value);
}
export function localDateTime(value = new Date()) {
  return dateToApiDateTime(value);
}
export function dateTimeInput(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}$/.test(value)) throw new Error('Informe data/hora no formato AAAA-MM-DD HH:mm.');
  const date = apiDateTimeToDate(value);
  if (!date || localDateTime(date) !== value.replace('T', ' ')) throw new Error('Data/hora inválida.');
  return date.toISOString();
}
