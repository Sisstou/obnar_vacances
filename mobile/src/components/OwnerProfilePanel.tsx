import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export type OwnerVerificationStatus =
  | 'not_submitted'
  | 'pending'
  | 'verified'
  | 'needs_update';

export type OwnerProfile = {
  displayName: string;
  email?: string;
  phone?: string;
  publicArea?: string;
  bio?: string;
  verificationStatus: OwnerVerificationStatus;
  contactVisibleToGuests?: boolean;
};

type Language = 'ar' | 'fr';

type Props = {
  profile: OwnerProfile;
  language: Language;
  trustedProfileSource?: boolean;
};

const copy = {
  ar: {
    heading: 'الملف الشخصي للمالك',
    subtitle: 'معلومات الحساب وحالة التحقق',
    accountInfo: 'معلومات الحساب',
    name: 'الاسم المعروض',
    email: 'البريد الإلكتروني',
    phone: 'رقم الهاتف',
    area: 'المنطقة العامة',
    bio: 'نبذة تعريفية',
    verification: 'حالة التحقق',
    not_submitted: 'لم يُقدّم للتحقق',
    pending: 'قيد المراجعة',
    verified: 'تم التحقق',
    needs_update: 'يتطلب استكمال معلومات',
    contact: 'ظهور معلومات التواصل',
    contactVisible: 'مسموح بعرض معلومات التواصل للضيوف',
    contactHidden: 'معلومات التواصل غير معروضة للضيوف',
    empty: 'غير متوفر',
    trusted: 'معلومات الملف وحالة التحقق مقدمة من مصدر موثوق.',
    untrusted: 'المعلومات المعروضة غير مؤكدة قبل التحقق من مصدرها.',
    privacy: 'اعرض المنطقة العامة فقط. لا تعرض عنوان السكن الخاص أو مستندات الهوية في الملف العام.',
    demo: 'واجهة عرض فقط؛ لا تعدّل بيانات الحساب ولا تحفظها ولا ترسلها.',
  },
  fr: {
    heading: 'Profil du propriétaire',
    subtitle: 'Informations du compte et statut de vérification',
    accountInfo: 'Informations du compte',
    name: 'Nom affiché',
    email: 'Adresse e-mail',
    phone: 'Téléphone',
    area: 'Zone générale',
    bio: 'Présentation',
    verification: 'Statut de vérification',
    not_submitted: 'Non soumis à la vérification',
    pending: 'En cours de vérification',
    verified: 'Vérifié',
    needs_update: 'Informations complémentaires requises',
    contact: 'Visibilité des coordonnées',
    contactVisible: 'Coordonnées visibles par les voyageurs',
    contactHidden: 'Coordonnées masquées aux voyageurs',
    empty: 'Non renseigné',
    trusted: 'Les informations du profil et le statut proviennent d’une source fiable.',
    untrusted: 'Les informations affichées ne sont pas confirmées tant que leur source n’est pas vérifiée.',
    privacy: 'N’affichez que la zone générale. Ne publiez pas votre adresse privée ni vos documents d’identité dans le profil public.',
    demo: 'Affichage uniquement ; ce composant ne modifie, n’enregistre ni ne transmet les données du compte.',
  },
} as const;

const verificationColors: Record<
  OwnerVerificationStatus,
  { backgroundColor: string; color: string }
> = {
  not_submitted: { backgroundColor: '#EEF2F7', color: '#344054' },
  pending: { backgroundColor: '#FFF4D6', color: '#805B00' },
  verified: { backgroundColor: '#E4F5EC', color: '#176B42' },
  needs_update: { backgroundColor: '#FDECEC', color: '#A12B2B' },
};

function InfoRow({
  label,
  value,
  rtl,
}: {
  label: string;
  value?: string;
  rtl: boolean;
}) {
  return (
    <View style={styles.infoRow}>
      <Text style={[styles.label, { textAlign: rtl ? 'right' : 'left' }]}>{label}</Text>
      <Text style={[styles.value, { textAlign: rtl ? 'right' : 'left' }]}>
        {value?.trim() ? value : '—'}
      </Text>
    </View>
  );
}

/**
 * Read-only owner profile panel.
 * Profile fields and verification status are supplied by the parent.
 * No editing, persistence, document handling, or backend calls are performed.
 */
export default function OwnerProfilePanel({
  profile,
  language,
  trustedProfileSource = false,
}: Props) {
  const t = copy[language];
  const rtl = language === 'ar';
  const statusStyle = verificationColors[profile.verificationStatus];

  return (
    <View style={[styles.container, { direction: rtl ? 'rtl' : 'ltr' }]}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {profile.displayName.trim().slice(0, 1).toLocaleUpperCase() || '?'}
          </Text>
        </View>
        <View style={styles.headerText}>
          <Text accessibilityRole="header" style={[styles.heading, { textAlign: rtl ? 'right' : 'left' }]}>
            {t.heading}
          </Text>
          <Text style={[styles.subtitle, { textAlign: rtl ? 'right' : 'left' }]}>
            {t.subtitle}
          </Text>
        </View>
      </View>

      <View style={styles.sourceNotice}>
        <Text style={[styles.noticeText, { textAlign: rtl ? 'right' : 'left' }]}>
          {trustedProfileSource ? t.trusted : t.untrusted}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={[styles.sectionTitle, { textAlign: rtl ? 'right' : 'left' }]}>
          {t.accountInfo}
        </Text>
        <InfoRow label={t.name} value={profile.displayName || t.empty} rtl={rtl} />
        <InfoRow label={t.email} value={profile.email} rtl={rtl} />
        <InfoRow
          label={t.phone}
          value={profile.contactVisibleToGuests ? profile.phone : undefined}
          rtl={rtl}
        />
        <InfoRow label={t.area} value={profile.publicArea} rtl={rtl} />
        <InfoRow label={t.bio} value={profile.bio} rtl={rtl} />
      </View>

      <View style={styles.card}>
        <Text style={[styles.sectionTitle, { textAlign: rtl ? 'right' : 'left' }]}>
          {t.verification}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: statusStyle.backgroundColor, alignSelf: rtl ? 'flex-end' : 'flex-start' }]}>
          <Text style={[styles.statusText, { color: statusStyle.color }]}>
            {t[profile.verificationStatus]}
          </Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={[styles.sectionTitle, { textAlign: rtl ? 'right' : 'left' }]}>
          {t.contact}
        </Text>
        <Text style={[styles.value, { textAlign: rtl ? 'right' : 'left' }]}>
          {profile.contactVisibleToGuests && profile.phone ? t.contactVisible : t.contactHidden}
        </Text>
      </View>

      <View style={styles.privacyNotice}>
        <Text style={[styles.noticeText, { textAlign: rtl ? 'right' : 'left' }]}>
          {t.privacy}
        </Text>
      </View>

      <Text style={[styles.footer, { textAlign: rtl ? 'right' : 'left' }]}>
        {t.demo}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
    width: '100%',
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: '#E9DCC4',
    borderRadius: 28,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  avatarText: {
    color: '#123B5D',
    fontSize: 23,
    fontWeight: '800',
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  heading: {
    color: '#123B5D',
    fontSize: 21,
    fontWeight: '800',
  },
  subtitle: {
    color: '#667085',
    fontSize: 12,
    lineHeight: 18,
  },
  sourceNotice: {
    backgroundColor: '#F8F5EF',
    borderColor: '#E9DCC4',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  noticeText: {
    color: '#475467',
    fontSize: 11,
    lineHeight: 18,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E9DCC4',
    borderRadius: 15,
    borderWidth: 1,
    gap: 12,
    padding: 14,
  },
  sectionTitle: {
    color: '#123B5D',
    fontSize: 15,
    fontWeight: '800',
  },
  infoRow: {
    borderBottomColor: '#E9DCC4',
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 5,
    paddingBottom: 9,
  },
  label: {
    color: '#667085',
    fontSize: 11,
    fontWeight: '600',
  },
  value: {
    color: '#344054',
    fontSize: 13,
    lineHeight: 20,
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '800',
  },
  privacyNotice: {
    backgroundColor: '#FFF8E8',
    borderColor: '#F0DDAE',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  footer: {
    color: '#667085',
    fontSize: 11,
    lineHeight: 17,
  },
});
