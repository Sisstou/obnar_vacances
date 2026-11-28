export type PhotoNavigationLocale = 'ar' | 'fr';

export interface PhotoNavigationText {
  previous: string;
  next: string;
}

export function getPhotoNavigationText(
  locale?: PhotoNavigationLocale,
): PhotoNavigationText;
