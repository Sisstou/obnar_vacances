export function getPhotoRemoveAccessibilityLabel(locale, photoNumber) {
  const number = Number.isSafeInteger(photoNumber) && photoNumber > 0
    ? String(photoNumber)
    : '';

  return locale === 'fr'
    ? `Retirer la photo ${number} de l’aperçu`.trim()
    : `حذف الصورة رقم ${number} من المعاينة`.trim();
}
