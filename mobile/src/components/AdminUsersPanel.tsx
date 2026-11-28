import React, { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

export type AdminAccountRole = 'owner' | 'traveler' | 'admin';
export type AdminOwnerVerificationStatus =
  | 'not_submitted'
  | 'pending'
  | 'verified'
  | 'needs_update';

export type AdminUserAccount = {
  id: string;
  displayName: string;
  role: AdminAccountRole;
  ownerVerificationStatus?: AdminOwnerVerificationStatus;
  publicArea?: string;
  createdAtLabel?: string;
};

type Language = 'ar' | 'fr';

type Props = {
  users: AdminUserAccount[];
  language: Language;
  trustedAdminSource?: boolean;
  onOpenUser?: (user: AdminUserAccount) => void;
};

const copy = {
  ar: {
    heading: 'إدارة المستخدمين',
    subtitle: 'عرض حسابات المالكين والضيوف والإدارة وحالات تحقق المالكين',
    search: 'ابحث بالاسم أو المنطقة العامة',
    total: 'إجمالي الحسابات',
    owners: 'المالكون',
    travelers: 'الضيوف',
    admins: 'الإدارة',
    pending: 'تحقق قيد المراجعة',
    verified: 'مالكون تم التحقق منهم',
    needsUpdate: 'يتطلب استكمالاً',
    users: 'قائمة الحسابات',
    owner: 'مالك',
    traveler: 'ضيف',
    admin: 'إدارة',
    not_submitted: 'لم يُقدّم للتحقق',
    pendingStatus: 'قيد المراجعة',
    verifiedStatus: 'تم التحقق',
    needs_update: 'يتطلب استكمال معلومات',
    verification: 'التحقق',
    area: 'المنطقة العامة',
    created: 'تاريخ إنشاء الحساب',
    notApplicable: 'لا ينطبق',
    noArea: 'غير محددة',
    noDate: 'غير متوفر',
    open: 'عرض الحساب',
    empty: 'لا توجد حسابات مطابقة.',
    untrusted: 'بيانات الحسابات مخفية حتى يتم تأكيد مصدر إداري موثوق.',
    trusted: 'بيانات الحسابات مقدمة من مصدر إداري موثوق.',
    staging: 'بيانات الاختبار ليست حسابات مستخدمين حقيقية ولا تمثل أرقاماً إنتاجية.',
    privacy: 'لا تعرض هذه اللوحة أرقام الهواتف أو عناوين البريد أو مستندات الهوية أو العناوين الخاصة.',
    readOnly: 'عرض فقط: لا تنشئ حسابات ولا تعدّل الأدوار أو حالات التحقق ولا توقف الحسابات ولا تحفظ أي تغييرات.',
  },
  fr: {
    heading: 'Gestion des utilisateurs',
    subtitle: 'Comptes des propriétaires, voyageurs et administrateurs, avec vérification des propriétaires',
    search: 'Rechercher par nom ou zone générale',
    total: 'Total des comptes',
    owners: 'Propriétaires',
    travelers: 'Voyageurs',
    admins: 'Administration',
    pending: 'Vérifications en attente',
    verified: 'Propriétaires vérifiés',
    needsUpdate: 'Informations à compléter',
    users: 'Liste des comptes',
    owner: 'Propriétaire',
    traveler: 'Voyageur',
    admin: 'Administration',
    not_submitted: 'Non soumis à la vérification',
    pendingStatus: 'En cours de vérification',
    verifiedStatus: 'Vérifié',
    needs_update: 'Informations complémentaires requises',
    verification: 'Vérification',
    area: 'Zone générale',
    created: 'Date de création du compte',
    notApplicable: 'Sans objet',
    noArea: 'Non précisée',
    noDate: 'Non disponible',
    open: 'Voir le compte',
    empty: 'Aucun compte correspondant.',
    untrusted: 'Les données des comptes sont masquées jusqu’à confirmation d’une source administrative fiable.',
    trusted: 'Les données des comptes proviennent d’une source administrative fiable.',
    staging: 'Les données de test ne sont pas de vrais comptes utilisateurs et ne représentent pas des chiffres de production.',
    privacy: 'Ce panneau n’affiche ni téléphone, ni adresse e-mail, ni pièce d’identité, ni adresse privée.',
    readOnly: 'Consultation uniquement : aucune création de compte, modification de rôle ou de vérification, suspension ou sauvegarde de changement.',
  },
} as const;

const roleColors: Record<AdminAccountRole, { background: string; foreground: string }> = {
  owner: { background: '#E7EFF8', foreground: '#234C78' },
  traveler: { background: '#F1ECFA', foreground: '#62449A' },
  admin: { background: '#E8F3F1', foreground: '#17665B' },
};

const verificationColors: Record<
  AdminOwnerVerificationStatus,
  { background: string; foreground: string }
> = {
  not_submitted: { background: '#EEF2F7', foreground: '#344054' },
  pending: { background: '#FFF4D6', foreground: '#805B00' },
  verified: { background: '#E4F5EC', foreground: '#176B42' },
  needs_update: { background: '#FDECEC', foreground: '#A12B2B' },
};

export default function AdminUsersPanel({
  users,
  language,
  trustedAdminSource = false,
  onOpenUser,
}: Props) {
  const [query, setQuery] = useState('');
  const t = copy[language];
  const rtl = language === 'ar';

  const counts = useMemo(() => ({
    owners: users.filter((user) => user.role === 'owner').length,
    travelers: users.filter((user) => user.role === 'traveler').length,
    admins: users.filter((user) => user.role === 'admin').length,
    pending: users.filter((user) => user.role === 'owner' && user.ownerVerificationStatus === 'pending').length,
    verified: users.filter((user) => user.role === 'owner' && user.ownerVerificationStatus === 'verified').length,
    needsUpdate: users.filter((user) => user.role === 'owner' && user.ownerVerificationStatus === 'needs_update').length,
  }), [users]);

  const filteredUsers = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    if (!normalized) return users;
    return users.filter((user) =>
      user.displayName.toLocaleLowerCase().includes(normalized)
      || (user.publicArea || '').toLocaleLowerCase().includes(normalized),
    );
  }, [users, query]);

  if (!trustedAdminSource) {
    return (
      <View style={[styles.container, { direction: rtl ? 'rtl' : 'ltr' }]}>
        <Text accessibilityRole="header" style={[styles.heading, { textAlign: rtl ? 'right' : 'left' }]}>
          {t.heading}
        </Text>
        <View style={styles.warningCard}>
          <Text style={[styles.warningText, { textAlign: rtl ? 'right' : 'left' }]}>{t.untrusted}</Text>
          <Text style={[styles.warningText, { textAlign: rtl ? 'right' : 'left' }]}>{t.staging}</Text>
        </View>
        <Text style={[styles.footer, { textAlign: rtl ? 'right' : 'left' }]}>{t.readOnly}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.container, { direction: rtl ? 'rtl' : 'ltr' }]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headingBlock}>
        <Text accessibilityRole="header" style={[styles.heading, { textAlign: rtl ? 'right' : 'left' }]}>
          {t.heading}
        </Text>
        <Text style={[styles.subtitle, { textAlign: rtl ? 'right' : 'left' }]}>{t.subtitle}</Text>
      </View>

      <View style={styles.notice}>
        <Text style={[styles.noticeText, { textAlign: rtl ? 'right' : 'left' }]}>{t.trusted}</Text>
        <Text style={[styles.noticeText, { textAlign: rtl ? 'right' : 'left' }]}>{t.staging}</Text>
      </View>

      <View style={styles.metricsGrid}>
        <Metric label={t.total} value={users.length} />
        <Metric label={t.owners} value={counts.owners} />
        <Metric label={t.travelers} value={counts.travelers} />
        <Metric label={t.admins} value={counts.admins} />
        <Metric label={t.pending} value={counts.pending} />
        <Metric label={t.verified} value={counts.verified} />
        <Metric label={t.needsUpdate} value={counts.needsUpdate} />
      </View>

      <Text style={[styles.sectionTitle, { textAlign: rtl ? 'right' : 'left' }]}>{t.users}</Text>
      <TextInput
        accessibilityLabel={t.search}
        onChangeText={setQuery}
        placeholder={t.search}
        placeholderTextColor="#98A2B3"
        returnKeyType="search"
        style={[styles.searchInput, { textAlign: rtl ? 'right' : 'left' }]}
        value={query}
      />

      {filteredUsers.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>{t.empty}</Text>
        </View>
      ) : (
        <View style={styles.userList}>
          {filteredUsers.map((user) => {
            const roleStyle = roleColors[user.role];
            const verification = user.role === 'owner' ? user.ownerVerificationStatus : undefined;
            const verificationStyle = verification ? verificationColors[verification] : undefined;
            const roleLabel = t[user.role];
            const verificationLabel = verification
              ? verification === 'pending'
                ? t.pendingStatus
                : t[verification === 'verified' ? 'verifiedStatus' : verification]
              : t.notApplicable;

            return (
              <View key={user.id} style={styles.userCard}>
                <View style={[styles.userHeader, { flexDirection: rtl ? 'row-reverse' : 'row' }]}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {user.displayName.trim().slice(0, 1).toLocaleUpperCase() || '?'}
                    </Text>
                  </View>
                  <View style={styles.userIdentity}>
                    <Text style={[styles.userName, { textAlign: rtl ? 'right' : 'left' }]}>{user.displayName}</Text>
                    <View style={[styles.badgeRow, { flexDirection: rtl ? 'row-reverse' : 'row' }]}>
                      <View style={[styles.badge, { backgroundColor: roleStyle.background }]}>
                        <Text style={[styles.badgeText, { color: roleStyle.foreground }]}>{roleLabel}</Text>
                      </View>
                      {verificationStyle ? (
                        <View style={[styles.badge, { backgroundColor: verificationStyle.background }]}>
                          <Text style={[styles.badgeText, { color: verificationStyle.foreground }]}>
                            {verificationLabel}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                </View>

                <Info label={t.area} value={user.publicArea || t.noArea} rtl={rtl} />
                {user.role === 'owner' ? (
                  <Info label={t.verification} value={verificationLabel} rtl={rtl} />
                ) : null}
                {user.createdAtLabel ? <Info label={t.created} value={user.createdAtLabel} rtl={rtl} /> : null}

                {onOpenUser ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t.open + ': ' + user.displayName}
                    onPress={() => onOpenUser(user)}
                    style={({ pressed }) => [styles.openButton, pressed && styles.pressed]}
                  >
                    <Text style={styles.openButtonText}>{t.open}</Text>
                  </Pressable>
                ) : null}
              </View>
            );
          })}
        </View>
      )}

      <View style={styles.privacyNotice}>
        <Text style={[styles.noticeText, { textAlign: rtl ? 'right' : 'left' }]}>{t.privacy}</Text>
      </View>
      <Text style={[styles.footer, { textAlign: rtl ? 'right' : 'left' }]}>{t.readOnly}</Text>
    </ScrollView>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function Info({ label, value, rtl }: { label: string; value: string; rtl: boolean }) {
  return (
    <View style={[styles.infoRow, { flexDirection: rtl ? 'row-reverse' : 'row' }]}>
      <Text style={[styles.infoLabel, { textAlign: rtl ? 'right' : 'left' }]}>{label}</Text>
      <Text style={[styles.infoValue, { textAlign: rtl ? 'left' : 'right' }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    width: '100%',
  },
  container: {
    gap: 14,
    padding: 16,
    paddingBottom: 28,
  },
  headingBlock: {
    gap: 5,
  },
  heading: {
    color: '#123B5D',
    fontSize: 22,
    fontWeight: '800',
  },
  subtitle: {
    color: '#667085',
    fontSize: 13,
    lineHeight: 20,
  },
  notice: {
    backgroundColor: '#F8F5EF',
    borderColor: '#E9DCC4',
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
    padding: 12,
  },
  noticeText: {
    color: '#475467',
    fontSize: 12,
    lineHeight: 18,
  },
  warningCard: {
    backgroundColor: '#FFF8E8',
    borderColor: '#F1DCA8',
    borderRadius: 12,
    borderWidth: 1,
    gap: 7,
    padding: 13,
  },
  warningText: {
    color: '#77520A',
    fontSize: 13,
    lineHeight: 20,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metricCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E9DCC4',
    borderRadius: 12,
    borderWidth: 1,
    flexBasis: '30%',
    flexGrow: 1,
    gap: 4,
    minHeight: 76,
    padding: 11,
  },
  metricValue: {
    color: '#123B5D',
    fontSize: 22,
    fontWeight: '800',
  },
  metricLabel: {
    color: '#667085',
    fontSize: 11,
    lineHeight: 16,
  },
  sectionTitle: {
    color: '#123B5D',
    fontSize: 17,
    fontWeight: '800',
  },
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E9DCC4',
    borderRadius: 11,
    borderWidth: 1,
    color: '#344054',
    fontSize: 14,
    minHeight: 46,
    paddingHorizontal: 13,
  },
  userList: {
    gap: 10,
  },
  userCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E9DCC4',
    borderRadius: 15,
    borderWidth: 1,
    gap: 11,
    padding: 13,
  },
  userHeader: {
    alignItems: 'center',
    gap: 11,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: '#E9DCC4',
    borderRadius: 23,
    height: 46,
    justifyContent: 'center',
    width: 46,
  },
  avatarText: {
    color: '#123B5D',
    fontSize: 19,
    fontWeight: '800',
  },
  userIdentity: {
    flex: 1,
    gap: 7,
  },
  userName: {
    color: '#123B5D',
    fontSize: 15,
    fontWeight: '800',
  },
  badgeRow: {
    flexWrap: 'wrap',
    gap: 6,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  infoRow: {
    alignItems: 'flex-start',
    gap: 10,
    justifyContent: 'space-between',
  },
  infoLabel: {
    color: '#667085',
    flex: 1,
    fontSize: 11,
  },
  infoValue: {
    color: '#344054',
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
  },
  openButton: {
    alignItems: 'center',
    backgroundColor: '#123B5D',
    borderRadius: 10,
    justifyContent: 'center',
    minHeight: 43,
    paddingHorizontal: 12,
  },
  openButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  emptyCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E9DCC4',
    borderRadius: 14,
    borderWidth: 1,
    padding: 20,
  },
  emptyText: {
    color: '#667085',
    fontSize: 13,
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
    lineHeight: 18,
  },
  pressed: {
    opacity: 0.78,
  },
});
