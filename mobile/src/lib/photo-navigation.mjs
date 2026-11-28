export function getPhotoNavigationText(locale = 'ar') {
  if (locale === 'fr') {
    return {
      previous: '← Précédente',
      next: 'Suivante →',
    };
  }

  return {
    previous: '← السابقة',
    next: 'التالية →',
  };
}
