import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

type Language = 'ar' | 'fr';

/**
 * Admin aggregates are supplied by a trusted administrative data source.
 * Do not pass guest names, phone numbers, identity documents, private addresses,
 * credentials, or raw payment details to this presentation component.
 */
export type AdminOwnerFinancialSummary = {
  ownerId: string;
  ownerDisplayName: string;
  listingCount: number;
  bookingCount: number;
  netPaidAmount: number;
  commissionAmount: number;
  settledCommission: number;
  pendingCommission: number;
  incompletePaymentCount?: number;
  undeterminedCommissionCount?: number;
};

type Props = {
  owners: AdminOwnerFinancialSummary[];
  language: Language;
  reportingPeriodLabel: string;
  trustedAdminSource?: boolean;
};

const copy = {
  ar: {
    heading: 'لوحة الإدارة المالية',
    subtitle: 'ملخص أداء المالكين والمبالغ والعمولات المسجلة خلال الفترة المحددة',
    period: 'الفترة',
    owners: 'عدد المالكين',
    listings: 'الإقامات المسجلة',
    bookings: 'الحجوزات الممثلة',
    receipts: 'المقبوضات الصافية المسجلة',
    commission: 'إجمالي العمولة المحتسبة',
    settled: 'العمولة المسوّاة يدوياً',
    pending: 'العمولة غير المسوّاة',
    ownerBreakdown: 'ملخص حسب المالك',
    noOwners: 'لا توجد بيانات للعرض',
    noOwnersBody: 'ستظهر هنا ملخصات المالكين التي يوفرها مصدر الإدارة الموثوق.',
    trusted: 'البيانات واردة من مصدر إداري موثوق وفق تأكيد الجهة المستدعية.',
    untrusted: 'المصدر الإداري غير مؤكد؛ أُخفيت جميع المؤشرات المالية والتشغيلية.',
    staging: 'تنبيه: بيانات الاختبار ليست معاملات حقيقية ولا حجوزات فعلية لعملاء.',
    missingPayments: 'سجلات دفع ناقصة',
    unknownCommissions: 'عمولات غير محددة',
    inconsistency: 'توجد فروق بين العمولة المحتسبة ومجموع العمولة المسوّاة وغير المسوّاة؛ يلزم تدقيق المصدر.',
    owner: 'المالك',
    currency: 'دج',
    privacy: 'تعرض هذه اللوحة مجاميع إدارية فقط. لا تعرض بيانات الضيوف الشخصية أو مستندات الهوية أو معلومات الاتصال الخاصة.',
    policy: 'العمولة 500 دج لكل ليلة مدفوعة بالكامل، أو 500 دج عند عدم الحضور إذا احتفظ المالك بعربون ليلة واحدة. التسوية يدوية ولا يوجد تحصيل آلي داخل التطبيق.',
    noProfit: 'المقبوضات والعمولات ليست أرباحاً صافية ولا تمثل كشفاً محاسبياً نهائياً؛ لا تشمل المصاريف أو الضرائب أو الالتزامات الأخرى.',
    noPayment: 'لا تنفذ هذه الواجهة تحصيلاً أو دفعاً أو تسوية مالية.',
    currencyNote: 'جميع القيم بالدينار الجزائري',
  },
  fr: {
    heading: 'Tableau de bord financier administrateur',
    subtitle: 'Synthèse des propriétaires, montants et commissions enregistrés pour la période choisie',
    period: 'Période',
    owners: 'Nombre de propriétaires',
    listings: 'Hébergements enregistrés',
    bookings: 'Réservations représentées',
    receipts: 'Encaissements nets enregistrés',
    commission: 'Total des commissions calculées',
    settled: 'Commissions réglées manuellement',
    pending: 'Commissions non réglées',
    ownerBreakdown: 'Synthèse par propriétaire',
    noOwners: 'Aucune donnée à afficher',
    noOwnersBody: 'Les synthèses des propriétaires fournies par la source administrative fiable apparaîtront ici.',
    trusted: 'Les données proviennent d’une source administrative déclarée fiable par le composant parent.',
    untrusted: 'La source administrative n’est pas vérifiée ; tous les indicateurs financiers et opérationnels sont masqués.',
    staging: 'Attention : les données de test ne sont pas de vraies transactions ni de vraies réservations clients.',
    missingPayments: 'Paiements incomplets',
    unknownCommissions: 'Commissions indéterminées',
    inconsistency: 'Des écarts existent entre les commissions calculées et la somme réglée/non réglée ; la source doit être auditée.',
    owner: 'Propriétaire',
    currency: 'DZD',
    privacy: 'Ce tableau affiche uniquement des agrégats administratifs. Il n’affiche aucune donnée personnelle des voyageurs, pièce d’identité ou coordonnée privée.',
    policy: 'La commission est de 500 DZD par nuit entièrement payée, ou 500 DZD en cas de non-présentation si le propriétaire conserve le dépôt d’une nuit. Le règlement est manuel, sans prélèvement automatique dans l’application.',
    noProfit: 'Les encaissements et commissions ne sont pas un bénéfice net ni un relevé comptable définitif ; les dépenses, impôts et autres obligations sont exclus.',
    noPayment: 'Cette interface ne réalise aucun encaissement, paiement ou règlement financier.',
    currencyNote: 'Tous les montants sont en dinars algériens',
  },
} as const;

function validNonNegative(value: number): boolean {
  return Number.isFinite(value) && value >= 0;
}

function isValidOwner(owner: AdminOwnerFinancialSummary): boolean {
  return (
    owner.ownerId.trim().length > 0 &&
    owner.ownerDisplayName.trim().length > 0 &&
    [owner.listingCount, owner.bookingCount].every(
      (value) => Number.isInteger(value) && value >= 0,
    ) &&
    [
      owner.netPaidAmount,
      owner.commissionAmount,
      owner.settledCommission,
      owner.pendingCommission,
    ].every(validNonNegative) &&
    (owner.incompletePaymentCount === undefined ||
      (Number.isInteger(owner.incompletePaymentCount) && owner.incompletePaymentCount >= 0)) &&
    (owner.undeterminedCommissionCount === undefined ||
      (Number.isInteger(owner.undeterminedCommissionCount) && owner.undeterminedCommissionCount >= 0))
  );
}

function formatAmount(value: number, language: Language, currency: string): string {
  return `${new Intl.NumberFormat(language === 'ar' ? 'ar-DZ' : 'fr-DZ', {
    maximumFractionDigits: 0,
  }).format(value)} ${currency}`;
}

function MetricCard({ label, value, rtl }: { label: string; value: string; rtl: boolean }) {
  return (
    <View style={styles.metricCard}>
      <Text style={[styles.metricLabel, { textAlign: rtl ? 'right' : 'left' }]}>{label}</Text>
      <Text style={[styles.metricValue, { textAlign: rtl ? 'right' : 'left' }]}>{value}</Text>
    </View>
  );
}

function InfoRow({ label, value, rtl }: { label: string; value: string; rtl: boolean }) {
  return (
    <View style={[styles.infoRow, { flexDirection: rtl ? 'row-reverse' : 'row' }]}>
      <Text style={[styles.infoLabel, { textAlign: rtl ? 'right' : 'left' }]}>{label}</Text>
      <Text style={[styles.infoValue, { textAlign: rtl ? 'left' : 'right' }]}>{value}</Text>
    </View>
  );
}

export default function AdminFinancialOverviewPanel({
  owners,
  language,
  reportingPeriodLabel,
  trustedAdminSource = false,
}: Props) {
  const t = copy[language];
  const rtl = language === 'ar';
  const validOwners = trustedAdminSource ? owners.filter(isValidOwner) : [];
  const invalidCount = trustedAdminSource ? owners.length - validOwners.length : 0;

  // Aggregate only the validated owner summaries. The parent source must ensure
  // each booking/payment event is assigned once to avoid cross-owner duplication.
  const totals = validOwners.reduce(
    (sum, owner) => ({
      listings: sum.listings + owner.listingCount,
      bookings: sum.bookings + owner.bookingCount,
      receipts: sum.receipts + owner.netPaidAmount,
      commission: sum.commission + owner.commissionAmount,
      settled: sum.settled + owner.settledCommission,
      pending: sum.pending + owner.pendingCommission,
      incompletePayments: sum.incompletePayments + (owner.incompletePaymentCount ?? 0),
      unknownCommissions: sum.unknownCommissions + (owner.undeterminedCommissionCount ?? 0),
    }),
    {
      listings: 0,
      bookings: 0,
      receipts: 0,
      commission: 0,
      settled: 0,
      pending: 0,
      incompletePayments: 0,
      unknownCommissions: 0,
    },
  );

  const hasSettlementMismatch = validOwners.some(
    (owner) => Math.abs(owner.settledCommission + owner.pendingCommission - owner.commissionAmount) > 0.01,
  );

  return (
    <View style={[styles.container, { direction: rtl ? 'rtl' : 'ltr' }]}>
      <View style={styles.header}>
        <Text accessibilityRole="header" style={[styles.heading, { textAlign: rtl ? 'right' : 'left' }]}>
          {t.heading}
        </Text>
        <Text style={[styles.subtitle, { textAlign: rtl ? 'right' : 'left' }]}>{t.subtitle}</Text>
      </View>

      <View style={styles.notice}>
        <Text style={[styles.noticeText, { textAlign: rtl ? 'right' : 'left' }]}>
          {trustedAdminSource ? t.trusted : t.untrusted}
        </Text>
        <Text style={[styles.noticeText, { textAlign: rtl ? 'right' : 'left' }]}>{t.staging}</Text>
        <Text style={[styles.noticeText, { textAlign: rtl ? 'right' : 'left' }]}>{t.period}: {reportingPeriodLabel}</Text>
      </View>

      {trustedAdminSource ? (
        <>
          <View style={styles.metrics}>
            <MetricCard label={t.owners} value={String(validOwners.length)} rtl={rtl} />
            <MetricCard label={t.listings} value={String(totals.listings)} rtl={rtl} />
            <MetricCard label={t.bookings} value={String(totals.bookings)} rtl={rtl} />
            <MetricCard label={t.receipts} value={formatAmount(totals.receipts, language, t.currency)} rtl={rtl} />
            <MetricCard label={t.commission} value={formatAmount(totals.commission, language, t.currency)} rtl={rtl} />
            <MetricCard label={t.settled} value={formatAmount(totals.settled, language, t.currency)} rtl={rtl} />
            <MetricCard label={t.pending} value={formatAmount(totals.pending, language, t.currency)} rtl={rtl} />
          </View>

          {totals.incompletePayments > 0 ? (
            <Text style={[styles.warningText, { textAlign: rtl ? 'right' : 'left' }]}>
              {totals.incompletePayments} · {t.missingPayments}
            </Text>
          ) : null}
          {totals.unknownCommissions > 0 ? (
            <Text style={[styles.warningText, { textAlign: rtl ? 'right' : 'left' }]}>
              {totals.unknownCommissions} · {t.unknownCommissions}
            </Text>
          ) : null}
          {hasSettlementMismatch ? (
            <Text style={[styles.warningText, { textAlign: rtl ? 'right' : 'left' }]}>{t.inconsistency}</Text>
          ) : null}
          {invalidCount > 0 ? (
            <Text style={[styles.warningText, { textAlign: rtl ? 'right' : 'left' }]}>
              {invalidCount} · {t.noOwners}
            </Text>
          ) : null}

          <Text style={[styles.sectionTitle, { textAlign: rtl ? 'right' : 'left' }]}>{t.ownerBreakdown}</Text>
          {validOwners.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>{t.noOwners}</Text>
              <Text style={styles.emptyBody}>{t.noOwnersBody}</Text>
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
              {validOwners.map((owner) => {
                const mismatch = Math.abs(
                  owner.settledCommission + owner.pendingCommission - owner.commissionAmount,
                ) > 0.01;
                return (
                  <View key={owner.ownerId} style={styles.ownerCard}>
                    <Text style={[styles.ownerName, { textAlign: rtl ? 'right' : 'left' }]}>
                      {t.owner}: {owner.ownerDisplayName}
                    </Text>
                    <InfoRow label={t.listings} value={String(owner.listingCount)} rtl={rtl} />
                    <InfoRow label={t.bookings} value={String(owner.bookingCount)} rtl={rtl} />
                    <InfoRow label={t.receipts} value={formatAmount(owner.netPaidAmount, language, t.currency)} rtl={rtl} />
                    <InfoRow label={t.commission} value={formatAmount(owner.commissionAmount, language, t.currency)} rtl={rtl} />
                    <InfoRow label={t.settled} value={formatAmount(owner.settledCommission, language, t.currency)} rtl={rtl} />
                    <InfoRow label={t.pending} value={formatAmount(owner.pendingCommission, language, t.currency)} rtl={rtl} />
                    {(owner.incompletePaymentCount ?? 0) > 0 ? (
                      <InfoRow label={t.missingPayments} value={String(owner.incompletePaymentCount)} rtl={rtl} />
                    ) : null}
                    {(owner.undeterminedCommissionCount ?? 0) > 0 ? (
                      <InfoRow label={t.unknownCommissions} value={String(owner.undeterminedCommissionCount)} rtl={rtl} />
                    ) : null}
                    {mismatch ? (
                      <Text style={[styles.warningText, { textAlign: rtl ? 'right' : 'left' }]}>{t.inconsistency}</Text>
                    ) : null}
                  </View>
                );
              })}
            </ScrollView>
          )}
        </>
      ) : (
        <View style={styles.emptyCard}>
          <Text style={[styles.emptyTitle, { textAlign: rtl ? 'right' : 'left' }]}>{t.untrusted}</Text>
        </View>
      )}

      <View style={styles.policyBox}>
        <Text style={[styles.policyText, { textAlign: rtl ? 'right' : 'left' }]}>{t.privacy}</Text>
        <Text style={[styles.policyText, { textAlign: rtl ? 'right' : 'left' }]}>{t.policy}</Text>
        <Text style={[styles.policyText, { textAlign: rtl ? 'right' : 'left' }]}>{t.noPayment}</Text>
        <Text style={[styles.policyText, { textAlign: rtl ? 'right' : 'left' }]}>{t.noProfit}</Text>
        <Text style={[styles.policyText, { textAlign: rtl ? 'right' : 'left' }]}>{t.currencyNote}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 13, width: '100%' },
  header: { gap: 5 },
  heading: { color: '#12243A', fontSize: 22, fontWeight: '800' },
  subtitle: { color: '#667085', fontSize: 13, lineHeight: 20 },
  notice: { backgroundColor: '#F2F6FA', borderColor: '#DCE6EF', borderRadius: 12, borderWidth: 1, gap: 6, padding: 12 },
  noticeText: { color: '#475467', fontSize: 11, lineHeight: 18 },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  metricCard: { backgroundColor: '#FFFFFF', borderColor: '#E5EAF0', borderRadius: 13, borderWidth: 1, flexBasis: '47%', flexGrow: 1, gap: 7, minWidth: 135, padding: 12 },
  metricLabel: { color: '#667085', fontSize: 11, lineHeight: 16 },
  metricValue: { color: '#12345A', fontSize: 17, fontWeight: '800' },
  sectionTitle: { color: '#12243A', fontSize: 15, fontWeight: '800' },
  list: { gap: 9, paddingBottom: 4 },
  ownerCard: { backgroundColor: '#FFFFFF', borderColor: '#E5EAF0', borderRadius: 14, borderWidth: 1, gap: 10, padding: 13 },
  ownerName: { color: '#12243A', fontSize: 14, fontWeight: '800' },
  infoRow: { alignItems: 'center', gap: 10, justifyContent: 'space-between' },
  infoLabel: { color: '#667085', flex: 1, fontSize: 11 },
  infoValue: { color: '#344054', flex: 1, fontSize: 11, fontWeight: '700' },
  warningText: { color: '#805B00', fontSize: 11, lineHeight: 17 },
  emptyCard: { alignItems: 'center', backgroundColor: '#FFFFFF', borderColor: '#E5EAF0', borderRadius: 14, borderWidth: 1, gap: 7, padding: 20 },
  emptyTitle: { color: '#12243A', fontSize: 14, fontWeight: '800', textAlign: 'center' },
  emptyBody: { color: '#667085', fontSize: 12, lineHeight: 19, textAlign: 'center' },
  policyBox: { backgroundColor: '#F8FAFC', borderColor: '#E5EAF0', borderRadius: 12, borderWidth: 1, gap: 7, padding: 12 },
  policyText: { color: '#475467', fontSize: 11, lineHeight: 18 },
});
