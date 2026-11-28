import React from 'react';
import { colors } from '../theme/colors';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

export type StayCatalogFeedbackLocale = 'ar' | 'fr';
export type StayCatalogFeedbackState = 'loading' | 'empty' | 'error';

export interface StayCatalogFeedbackProps {
  state: StayCatalogFeedbackState;
  locale?: StayCatalogFeedbackLocale;
  title?: string;
  message?: string;
  onRetry?: () => void;
  style?: StyleProp<ViewStyle>;
}

/**
 * Guest-catalog loading, empty, and error presentation.
 * It does not fetch data or decide whether a listing is safe to publish.
 */
export function StayCatalogFeedback({
  state,
  locale = 'ar',
  title,
  message,
  onRetry,
  style,
}: StayCatalogFeedbackProps) {
  const isArabic = locale === 'ar';
  const copy = isArabic
    ? {
        loadingTitle: 'جارٍ تحميل الإقامات',
        loadingMessage: 'يرجى الانتظار قليلاً.',
        emptyTitle: 'لا توجد إقامات متاحة للعرض حالياً',
        emptyMessage: 'ستظهر الإقامات بعد اعتمادها والتحقق من مصدر بياناتها.',
        errorTitle: 'تعذر تحميل الإقامات',
        errorMessage: 'تحقق من الاتصال ثم حاول مرة أخرى.',
        retry: 'إعادة المحاولة',
      }
    : {
        loadingTitle: 'Chargement des logements',
        loadingMessage: 'Veuillez patienter.',
        emptyTitle: 'Aucun logement à afficher pour le moment',
        emptyMessage: 'Les logements apparaîtront après validation et vérification de leur source.',
        errorTitle: 'Impossible de charger les logements',
        errorMessage: 'Vérifiez votre connexion puis réessayez.',
        retry: 'Réessayer',
      };

  const defaultTitle =
    state === 'loading'
      ? copy.loadingTitle
      : state === 'empty'
        ? copy.emptyTitle
        : copy.errorTitle;
  const defaultMessage =
    state === 'loading'
      ? copy.loadingMessage
      : state === 'empty'
        ? copy.emptyMessage
        : copy.errorMessage;

  return (
    <View
      accessibilityRole="summary"
      accessibilityLiveRegion="polite"
      style={[styles.container, { direction: isArabic ? 'rtl' : 'ltr' }, style]}
    >
      {state === 'loading' ? (
        <ActivityIndicator size="large" color={colors.goldStrong} />
      ) : (
        <Text style={styles.symbol}>{state === 'empty' ? '⌂' : '!'}</Text>
      )}

      <Text accessibilityRole="header" style={styles.title}>
        {title ?? defaultTitle}
      </Text>
      <Text style={[styles.message, { textAlign: isArabic ? 'right' : 'left', writingDirection: isArabic ? 'rtl' : 'ltr' }]}>
        {message ?? defaultMessage}
      </Text>

      {state === 'error' && onRetry ? (
        <Pressable
          accessibilityRole="button"
          onPress={onRetry}
          style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}
        >
          <Text style={styles.retryText}>{copy.retry}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    minHeight: 190,
    padding: 22,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    backgroundColor: colors.surface,
  },
  symbol: {
    color: colors.goldStrong,
    fontSize: 30,
    fontWeight: '700',
  },
  title: {
    color: colors.text,
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '800',
    textAlign: 'center',
  },
  message: {
    maxWidth: 320,
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 21,
  },
  retryButton: {
    minHeight: 44,
    minWidth: 120,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: colors.goldStrong,
  },
  retryText: {
    color: colors.surface,
    fontSize: 13,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.85,
  },
});
