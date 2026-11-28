export function getPhotoRemoveAccessibilityLabel(locale, photoNumber) {
  const isFrench = locale === 'fr';
  if (!Number.isSafeInteger(photoNumber) || photoNumber < 1) {
    return isFrench
      ? 'Retirer la photo de l’aperçu'
      : 'حذف الصورة من المعاينة';
  }

  return isFrench
    ? `Retirer la photo ${photoNumber} de l’aperçu`
    : `حذف الصورة رقم ${photoNumber} من المعاينة`;
}
