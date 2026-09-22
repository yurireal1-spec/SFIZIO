export const parseNumber = (value: number | string | null | undefined): number => {
  if (value === null || value === undefined || value === '') return 0;
  if (typeof value === 'number') return value;

  const normalized = String(value).trim().replace(/\s/g, '');
  const hasComma = normalized.includes(',');
  const hasDot = normalized.includes('.');
  const normalizedNumber = hasComma
    ? normalized.replace(/\./g, '').replace(',', '.')
    : hasDot && /^\d{1,3}(\.\d{3})+$/.test(normalized)
      ? normalized.replace(/\./g, '')
      : normalized;
  const num = parseFloat(normalizedNumber);
  return isNaN(num) ? 0 : num;
};

export const formatCurrency = (value: number | string | null | undefined): string => {
  const num = parseNumber(value);
  return num.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};
