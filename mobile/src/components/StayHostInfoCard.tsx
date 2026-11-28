import React from 'react';
import { getDisplayInitials } from '../lib/booking-calculations.mjs';
import {
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

export type StayHostInfoLocale = 'ar' | 'fr';

export interface StayHostInfoCardProps {
  /** Public display name only; do not pass a private/legal name without consent. */
  displayName: string;
  locale?: StayHostInfoLocale;
  /** Optional initials derived from the public display name. */
  initials?: string;
  /** Public profile description supplied by the trusted parent source. */
  bio?: string;
  /** Public area label, not a private street address. */
  locationLabel?: string;
  /** Optional public contact channel and value, explicitly approved for display. */
  contactLabel?: string;
  contactValue?: string;
  /** Set true only when host verification is confirmed by a trusted source. */
  isVerifiedHost?: boolean;
  /** Optional response information supplied by a trusted source. */
  responseLabel?: string;
  responseValue?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * Presentational-only host information card.
 * The parent must provide only public, consented profile/contact information.
 * This component does not fetch, validate, expose, or store private account data.
 */
export function StayHostInfoCard({
  displayName,
  locale = 'ar',
  initials,
  bio,
  locationLabel,
  contactLabel,
  contactValue,
  isVerifiedHost = false,
  responseLabel,
  responseValue,
  style,
}: StayHostInfoCardProps) {
  const isArabic = locale === 'ar';
  const rtl = isArabic;
  const labels = isArabic
    ? {
        title: 'صاحب الإقامة',
        verified: 'مضيف تم التحقق منه',
        location: 'المنطقة',
        contact: 'التواصل',
        response: 'سرعة الرد',
        privacy: 'تُعرض هنا المعلومات العامة التي وافق صاحب الإقامة على نشرها فقط.',
      }
    : {
        title: 'Votre hôte',
        verified: 'Hôte vérifié',
        location: 'Secteur',
        contact: 'Contact',
        response: 'Temps de réponse',
        privacy: 'Seules les informations publiques autorisées par l’hôte sont affichées ici.',
      };

  const safeInitials = getDisplayInitials(displayName, initials);

  const hasContact = Boolean(contactLabel?.trim() && contactValue?.trim());
  const hasResponse = Boolean(responseLabel?.trim() || responseValue?.trim());

  return (
    <View style={[styles.card, style]}>
      <Text
        accessibilityRole="header"
        style={[styles.heading, { textAlign: rtl ? 'right' : 'left' }]}
      >
        {labels.title}
      </Text>

      <View style={[styles.profileRow, { flexDirection: rtl ? 'row-reverse' : 'row' }]}>
        <View
          accessible={false}
          importantForAccessibility="no"
          style={styles.avatar}
        >
          <Text style={styles.avatarText}>{safeInitials || '•'}</Text>
        </View>
        <View style={styles.profileText}>
          <Text
            accessibilityRole="header"
            style={[styles.name, { textAlign: rtl ? 'right' : 'left' }]}
          >
            {displayName}
          </Text>
          {isVerifiedHost ? (
            <Text
              accessibilityLabel={labels.verified}
              style={[styles.verified, { textAlign: rtl ? 'right' : 'left' }]}
            >
              ✓ {labels.verified}
            </Text>
          ) : null}
        </View>
      </View>

      {bio?.trim() ? (
        <Text style={[styles.bio, { textAlign: rtl ? 'right' : 'left' }]}>
          {bio}
        </Text>
      ) : null}

      {locationLabel?.trim() ? (
        <View style={[styles.detailRow, { flexDirection: rtl ? 'row-reverse' : 'row' }]}>
          <Text style={styles.detailLabel}>{labels.location}</Text>
          <Text style={[styles.detailValue, { textAlign: rtl ? 'left' : 'right' }]}>
            {locationLabel}
          </Text>
        </View>
      ) : null}

      {hasContact ? (
        <View style={[styles.detailRow, { flexDirection: rtl ? 'row-reverse' : 'row' }]}>
          <Text style={styles.detailLabel}>{contactLabel || labels.contact}</Text>
          <Text
            selectable
            style={[styles.detailValue, styles.contactValue, { textAlign: rtl ? 'left' : 'right' }]}
          >
            {contactValue}
          </Text>
        </View>
      ) : null}

      {hasResponse ? (
        <View style={[styles.detailRow, { flexDirection: rtl ? 'row-reverse' : 'row' }]}>
          <Text style={styles.detailLabel}>{responseLabel || labels.response}</Text>
          <Text style={[styles.detailValue, { textAlign: rtl ? 'left' : 'right' }]}>
            {responseValue || ''}
          </Text>
        </View>
      ) : null}

      <Text style={[styles.privacyNote, { textAlign: rtl ? 'right' : 'left' }]}>
        {labels.privacy}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 13,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E3E8EF',
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
  },
  heading: {
    color: '#102A43',
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '700',
  },
  profileRow: {
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E6EEF5',
  },
  avatarText: {
    color: '#163A5F',
    fontSize: 16,
    fontWeight: '700',
  },
  profileText: {
    flex: 1,
    gap: 4,
  },
  name: {
    color: '#243B53',
    fontSize: 15,
    fontWeight: '700',
  },
  verified: {
    color: '#0F766E',
    fontSize: 11,
    fontWeight: '600',
  },
  bio: {
    color: '#486581',
    fontSize: 13,
    lineHeight: 20,
  },
  detailRow: {
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#EDF1F5',
  },
  detailLabel: {
    color: '#627D98',
    fontSize: 12,
    fontWeight: '600',
  },
  detailValue: {
    flex: 1,
    color: '#334E68',
    fontSize: 12,
  },
  contactValue: {
    color: '#163A5F',
    fontWeight: '600',
  },
  privacyNote: {
    color: '#829AB1',
    fontSize: 10,
    lineHeight: 15,
  },
});
