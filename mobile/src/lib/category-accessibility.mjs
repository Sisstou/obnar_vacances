export function getCategoryAccessibilityLabel(locale, label, count) {
  if (!Number.isSafeInteger(count) || count < 0) return label;
  const isFrench = locale === 'fr';
  const formattedCount = new Intl.NumberFormat(isFrench ? 'fr-DZ' : 'ar-DZ', {
    maximumFractionDigits: 0,
  }).format(count);
  return isFrench
    ? `${label}, ${formattedCount} logements`
    : `${label}، ${formattedCount} إقامة`;
}
