export function normalizeBrazilianPhone(phone: string | null | undefined) {
  const digits = phone?.replace(/\D/g, '') ?? '';

  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`;
  }

  if (digits.length === 12 || digits.length === 13) {
    return digits.startsWith('55') ? digits : '';
  }

  return '';
}

export function getPhoneUrl(phone: string | null | undefined) {
  const digits = normalizeBrazilianPhone(phone);
  return digits ? `tel:${digits}` : null;
}

export function getWhatsAppUrl(phone: string | null | undefined) {
  const digits = normalizeBrazilianPhone(phone);
  return digits ? `https://wa.me/${digits}` : null;
}
