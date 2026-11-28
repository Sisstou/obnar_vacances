import React, { useState } from 'react';
import { colors } from '../theme/tokens';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

export type HomeHeroLocale = 'ar' | 'fr';

export interface HomeHeroProps {
  locale?: HomeHeroLocale;
  title?: string;
  subtitle?: string;
  placeholder?: string;
  onSearch?: (query: string) => void;
  style?: StyleProp<ViewStyle>;
}

/**
 * Standalone guest-home hero and search presentation.
 * Search is delegated to the parent; this component performs no network
 * request, listing lookup, booking, or persistence.
 */
export function HomeHero({
  locale = 'ar',
  title,
  subtitle,
  placeholder,
  onSearch,
  style,
}: HomeHeroProps) {
  const isArabic = locale === 'ar';
  const [query, setQuery] = useState('');
  const copy = isArabic
    ? {
        title: 'عطلتك تبدأ من هنا',
        subtitle: 'اكتشف إقامات أولاد بونار وجيجل واستمتع بعطلتك.',
        placeholder: 'ابحث عن منطقة أو إقامة',
        search: 'بحث',
        searchLabel: 'البحث عن إقامة',
      }
    : {
        title: 'Vos vacances commencent ici',
        subtitle: 'Découvrez les séjours à Ouled Bounar et à Jijel.',
        placeholder: 'Rechercher une région ou un logement',
        search: 'Rechercher',
        searchLabel: 'Rechercher un logement',
      };

  return (
    <View
      style={[styles.container, { direction: isArabic ? 'rtl' : 'ltr' }, style]}
      accessibilityLabel={copy.searchLabel}
    >
      <Text style={[styles.eyebrow, { textAlign: isArabic ? 'right' : 'left' }]}>
        OBNAR VACANCES
      </Text>
      <Text style={[styles.title, { textAlign: isArabic ? 'right' : 'left' }]}>
        {title ?? copy.title}
      </Text>
      <Text style={[styles.subtitle, { textAlign: isArabic ? 'right' : 'left' }]}>
        {subtitle ?? copy.subtitle}
      </Text>

      <View style={[styles.searchPanel, { flexDirection: isArabic ? 'row-reverse' : 'row' }]}>
        <TextInput
          accessibilityLabel={copy.searchLabel}
          placeholder={placeholder ?? copy.placeholder}
          placeholderTextColor="#7B7468"
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={() => onSearch?.(query.trim())}
          returnKeyType="search"
          style={[styles.input, { textAlign: isArabic ? 'right' : 'left' }]}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={copy.search}
          onPress={() => onSearch?.(query.trim())}
          style={({ pressed }) => [styles.searchButton, pressed && styles.pressed]}
        >
          <Text style={styles.searchButtonText}>{copy.search}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    borderRadius: 22,
    backgroundColor: colors.sand,
    gap: 10,
  },
  eyebrow: {
    color: colors.navy,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  title: {
    color: colors.sandDark,
    fontSize: 27,
    lineHeight: 36,
    fontWeight: '900',
  },
  subtitle: {
    color: colors.sandText,
    fontSize: 14,
    lineHeight: 22,
  },
  searchPanel: {
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    padding: 7,
    borderRadius: 15,
    backgroundColor: colors.white,
  },
  input: {
    flex: 1,
    minHeight: 48,
    paddingHorizontal: 10,
    color: colors.navyText,
    fontSize: 14,
  },
  searchButton: {
    minHeight: 48,
    minWidth: 82,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: colors.navy,
  },
  searchButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.84,
  },
});
