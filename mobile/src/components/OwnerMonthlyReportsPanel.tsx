import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

type Language = 'ar' | 'fr';

/**
 * Monthly figures must be grouped by the verified accounting event date
 * (payment/retained-deposit date), not inferred from a display-only stay date.
 * netPaidAmount must be reconciled against recorded refunds.
 * Commission figures must follow the platform policy and trusted ledger.
 */
export type OwnerMonthlyFinancialPeriod = {
  /** Calendar month in YYYY-MM format, assigned by the trusted parent source. */
  monthKey: string;
  /** Receipts for this month after refunds recorded for the same accounting period. */
  netPaidAmount: number;
  /** Total commission assessed for qualifying events in this month. */
  commissionAmount: number;
  /** Portion of this month's assessed commission manually settled. */
  settledCommission: number;
  /** Portion of this month's assessed commission not yet manually settled. */
  pendingCommission: number;
  /** Number of distinct bookings represented in this monthly period. */
  bookingCount: number;
  /** Count of booking/payment records excluded because receipt data is incomplete. */
  incompletePaymentCount?: number;
  /** Count of commission records that cannot yet be determined. */
  undeterminedCommissionCount?: number;
};

type Props = {
  periods: OwnerMonthlyFinancialPeriod[];
  language: Language;
  trustedFinancialSource?: boolean;
};

const copy = {
  ar: {
    heading: 'التقارير المالية الشهرية',
    subtitle: 'مقارنة المقبوضات المسجلة وعمولات المنصة حسب شهر الحدث المالي',
    untrusted: 'المصدر المالي غير مؤكد؛ لن نعرض أرقاماً أو مقارنات مالية قبل التحقق من مصدرها.',
    staging: 'تنبيه: بيانات الاختبار ليست معاملات مالية حقيقية ولا تمثل أداءً تجارياً فعلياً.',
    netPaid: 'المقبوضات الصافية المسجلة',
    commission: 'العمولة المحتسبة',
    settled: 'العمولة المسوّاة',
    pending: 'العمولة غير المسوّاة',
    bookings: 'الحجوزات الممثلة',
    monthlyComparison: 'المقارنة الشهرية',
    monthDetails: 'تفاصيل كل شهر',
    noData: 'لا توجد بيانات شهرية',
    noDataBody: 'ستظهر المقارنة بعد تمرير ملخصات شهرية من مصدر مالي موثوق.',
    incompletePayments: 'سجلات دفع ناقصة',
    undetermined: 'عمولات غير محددة',
    receiptDefinition: 'المقبوضات الصافية تعني المبالغ المسجلة بعد طرح الاستردادات المسجلة في الفترة نفسها.',
    commissionDefinition: 'تُحتسب العمولة وفق سياسة المنصة: 500 دج لكل ليلة مدفوعة بالكامل، أو 500 دج عند عدم الحضور والاحتفاظ بعربون ليلة.',
    settlementDefinition: 'تسوية العمولة يدوية. يجب أن يساوي مجموع العمولة المسوّاة وغير المسوّاة العمولة المحتسبة.',
    monthBasis: 'يجب أن يحدد المصدر الشهر وفق تاريخ العملية المالية المؤكدة، لا وفق تاريخ الوصول أو المغادرة.',
    noProfit: 'هذه مؤشرات مالية وليست أرباحاً صافية؛ لا تشمل المصاريف أو الضرائب أو الالتزامات الأخرى.',
    dataWarning: 'الشهر الذي يحتوي على سجلات ناقصة أو عمولات غير محددة لا يمثل حصراً محاسبياً نهائياً.',
    currency: 'دج',
    dash: '—',
    invalid: 'بيانات شهرية غير صالحة',
  },
  fr: {
    heading: 'Rapports financiers mensuels',
    subtitle: 'Comparaison des encaissements enregistrés et des commissions par mois de l’événement financier',
    untrusted: 'La source financière n’est pas vérifiée ; aucun chiffre ni comparaison ne sera affiché avant validation.',
    staging: 'Attention : les données de test ne sont pas de vraies transactions et ne représentent pas une performance commerciale réelle.',
    netPaid: 'Encaissements nets enregistrés',
    commission: 'Commission calculée',
    settled: 'Commission réglée',
    pending: 'Commission non réglée',
    bookings: 'Réservations représentées',
    monthlyComparison: 'Comparaison mensuelle',
    monthDetails: 'Détail par mois',
    noData: 'Aucune donnée mensuelle',
    noDataBody: 'La comparaison apparaîtra lorsque des synthèses mensuelles provenant d’une source financière fiable seront fournies.',
    incompletePayments: 'Paiements incomplets',
    undetermined: 'Commissions indéterminées',
    receiptDefinition: 'Les encaissements nets correspondent aux montants enregistrés après déduction des remboursements enregistrés pour la même période.',
    commissionDefinition: 'La commission suit la politique de la plateforme : 500 DZD par nuit entièrement payée, ou 500 DZD en cas de non-présentation avec conservation du dépôt d’une nuit.',
    settlementDefinition: 'Le règlement de la commission est manuel. La commission réglée et non réglée doit correspondre au total calculé.',
    monthBasis: 'La source doit attribuer le mois selon la date confirmée de l’opération financière, et non selon les dates d’arrivée ou de départ.',
    noProfit: 'Ces indicateurs ne sont pas un bénéfice net ; ils excluent les dépenses, impôts et autres obligations.',
    dataWarning: 'Un mois contenant des paiements incomplets ou des commissions indéterminées ne constitue pas un relevé comptable définitif.',
    currency: 'DZD',
    dash: '—',
    invalid: 'Données mensuelles invalides',
  },
} as const;

function isValidPeriod(period: OwnerMonthlyFinancialPeriod): boolean {
  const values = [
    period.netPaidAmount,
    period.commissionAmount,
    period.settledCommission,
    period.pendingCommission,
  ];
  return (
    /^\d{4}-(0[1-9]|1[0-2])$/.test(period.monthKey) &&
    values.every((value) => Number.isFinite(value) && value >= 0) &&
    Number.isInteger(period.bookingCount) &&
    period.bookingCount >= 0 &&
    (period.incompletePaymentCount === undefined ||
      (Number.isInteger(period.incompletePaymentCount) && period.incompletePaymentCount >= 0)) &&
    (period.undeterminedCommissionCount === undefined ||
      (Number.isInteger(period.undeterminedCommissionCount) && period.undeterminedCommissionCount >= 0))
  );
}

function formatAmount(value: number, language: Language, currency: string): string {
  return `${new Intl.NumberFormat(language === 'ar' ? 'ar-DZ' : 'fr-DZ', {
    maximumFractionDigits: 0,
  }).format(value)} ${currency}`;
}

function formatMonth(monthKey: string, language: Language): string {
  const [year, month] = monthKey.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, 1));
  return new Intl.DateTimeFormat(language === 'ar' ? 'ar-DZ' : 'fr-FR', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

function MetricCard({ label, value, rtl }: { label: string; value: string; rtl: boolean }) {
  return (
    <View style={styles.metricCard}>
      <Text style={[styles.metricLabel, { textAlign: rtl ? 'right' : 'left' }]}>{label}</Text>
      <Text style={[styles.metricValue, { textAlign: rtl ? 'right' : 'left' }]}>{value}</Text>
    </View>
  );
}

export default function OwnerMonthlyReportsPanel({
  periods,
  language,
  trustedFinancialSource = false,
}: Props) {
  const t = copy[language];
  const rtl = language === 'ar';

  const validPeriods = trustedFinancialSource
    ? periods.filter(isValidPeriod).slice().sort((a, b) => a.monthKey.localeCompare(b.monthKey))
    : [];
  const invalidCount = trustedFinancialSource ? periods.length - validPeriods.length : 0;

  const totalNetPaid = validPeriods.reduce((sum, item) => sum + item.netPaidAmount, 0);
  const totalCommission = validPeriods.reduce((sum, item) => sum + item.commissionAmount, 0);
  const totalSettled = validPeriods.reduce((sum, item) => sum + item.settledCommission, 0);
  const totalPending = validPeriods.reduce((sum, item) => sum + item.pendingCommission, 0);
  const maxPaid = Math.max(1, ...validPeriods.map((item) => item.netPaidAmount));
  const maxCommission = Math.max(1, ...validPeriods.map((item) => item.commissionAmount));

  const mismatchCount = validPeriods.filter((item) =>
    Math.abs(item.settledCommission + item.pendingCommission - item.commissionAmount) > 0.01
  ).length;

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
          {trustedFinancialSource ? t.monthBasis : t.untrusted}
        </Text>
        <Text style={[styles.noticeText, { textAlign: rtl ? 'right' : 'left' }]}>{t.staging}</Text>
      </View>

      {trustedFinancialSource ? (
        <>
          <View style={styles.metrics}>
            <MetricCard label={t.netPaid} value={formatAmount(totalNetPaid, language, t.currency)} rtl={rtl} />
            <MetricCard label={t.commission} value={formatAmount(totalCommission, language, t.currency)} rtl={rtl} />
            <MetricCard label={t.settled} value={formatAmount(totalSettled, language, t.currency)} rtl={rtl} />
            <MetricCard label={t.pending} value={formatAmount(totalPending, language, t.currency)} rtl={rtl} />
          </View>

          {validPeriods.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>{t.noData}</Text>
              <Text style={styles.emptyBody}>{t.noDataBody}</Text>
            </View>
          ) : (
            <>
              <Text style={[styles.sectionTitle, { textAlign: rtl ? 'right' : 'left' }]}>{t.monthlyComparison}</Text>
              <View style={styles.chartCard}>
                <Text style={[styles.chartLegend, { textAlign: rtl ? 'right' : 'left' }]}>{t.netPaid}</Text>
                {validPeriods.map((period) => (
                  <View key={period.monthKey} style={styles.barGroup}>
                    <View style={[styles.barLabelRow, { flexDirection: rtl ? 'row-reverse' : 'row' }]}>
                      <Text style={styles.monthLabel}>{formatMonth(period.monthKey, language)}</Text>
                      <Text style={styles.barValue}>{formatAmount(period.netPaidAmount, language, t.currency)}</Text>
                    </View>
                    <View style={styles.barTrack}>
                      <View style={[styles.paidBar, { width: `${(period.netPaidAmount / maxPaid) * 100}%` }]} />
                    </View>
                    <View style={[styles.barLabelRow, { flexDirection: rtl ? 'row-reverse' : 'row' }]}>
                      <Text style={styles.chartLegend}>{t.commission}</Text>
                      <Text style={styles.barValue}>{formatAmount(period.commissionAmount, language, t.currency)}</Text>
                    </View>
                    <View style={styles.barTrack}>
                      <View style={[styles.commissionBar, { width: `${(period.commissionAmount / maxCommission) * 100}%` }]} />
                    </View>
                  </View>
                ))}
              </View>

              <Text style={[styles.sectionTitle, { textAlign: rtl ? 'right' : 'left' }]}>{t.monthDetails}</Text>
              {validPeriods.map((period) => {
                const incomplete = (period.incompletePaymentCount ?? 0) > 0 ||
                  (period.undeterminedCommissionCount ?? 0) > 0 ||
                  Math.abs(period.settledCommission + period.pendingCommission - period.commissionAmount) > 0.01;
                return (
                  <View key={period.monthKey} style={styles.periodCard}>
                    <Text style={[styles.periodTitle, { textAlign: rtl ? 'right' : 'left' }]}>
                      {formatMonth(period.monthKey, language)}
                    </Text>
                    <InfoRow label={t.netPaid} value={formatAmount(period.netPaidAmount, language, t.currency)} rtl={rtl} />
                    <InfoRow label={t.commission} value={formatAmount(period.commissionAmount, language, t.currency)} rtl={rtl} />
                    <InfoRow label={t.settled} value={formatAmount(period.settledCommission, language, t.currency)} rtl={rtl} />
                    <InfoRow label={t.pending} value={formatAmount(period.pendingCommission, language, t.currency)} rtl={rtl} />
                    <InfoRow label={t.bookings} value={String(period.bookingCount)} rtl={rtl} />
                    {(period.incompletePaymentCount ?? 0) > 0 ? (
                      <InfoRow label={t.incompletePayments} value={String(period.incompletePaymentCount)} rtl={rtl} />
                    ) : null}
                    {(period.undeterminedCommissionCount ?? 0) > 0 ? (
                      <InfoRow label={t.undetermined} value={String(period.undeterminedCommissionCount)} rtl={rtl} />
                    ) : null}
                    {incomplete ? (
                      <Text style={[styles.warningText, { textAlign: rtl ? 'right' : 'left' }]}>{t.dataWarning}</Text>
                    ) : null}
                  </View>
                );
              })}
            </>
          )}
          {invalidCount > 0 ? (
            <Text style={[styles.warningText, { textAlign: rtl ? 'right' : 'left' }]}>
              {invalidCount} · {t.invalid}
            </Text>
          ) : null}
          {mismatchCount > 0 ? (
            <Text style={[styles.warningText, { textAlign: rtl ? 'right' : 'left' }]}>{t.settlementDefinition}</Text>
          ) : null}
        </>
      ) : (
        <View style={styles.emptyCard}>
          <Text style={[styles.emptyTitle, { textAlign: rtl ? 'right' : 'left' }]}>{t.untrusted}</Text>
        </View>
      )}

      <View style={styles.policyBox}>
        <Text style={[styles.policyText, { textAlign: rtl ? 'right' : 'left' }]}>{t.receiptDefinition}</Text>
        <Text style={[styles.policyText, { textAlign: rtl ? 'right' : 'left' }]}>{t.commissionDefinition}</Text>
        <Text style={[styles.policyText, { textAlign: rtl ? 'right' : 'left' }]}>{t.settlementDefinition}</Text>
        <Text style={[styles.policyText, { textAlign: rtl ? 'right' : 'left' }]}>{t.monthBasis}</Text>
      </View>
      <Text style={[styles.footer, { textAlign: rtl ? 'right' : 'left' }]}>{t.noProfit}</Text>
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

const styles = StyleSheet.create({
  container: { gap: 13, width: '100%' },
  header: { gap: 5 },
  heading: { color: '#123B5D', fontSize: 22, fontWeight: '800' },
  subtitle: { color: '#667085', fontSize: 13, lineHeight: 20 },
  notice: { backgroundColor: '#F8F5EF', borderColor: '#E9DCC4', borderRadius: 12, borderWidth: 1, gap: 6, padding: 12 },
  noticeText: { color: '#475467', fontSize: 11, lineHeight: 18 },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  metricCard: { backgroundColor: '#FFFFFF', borderColor: '#E9DCC4', borderRadius: 13, borderWidth: 1, flexBasis: '47%', flexGrow: 1, gap: 7, minWidth: 135, padding: 12 },
  metricLabel: { color: '#667085', fontSize: 11, lineHeight: 16 },
  metricValue: { color: '#123B5D', fontSize: 17, fontWeight: '800' },
  sectionTitle: { color: '#123B5D', fontSize: 15, fontWeight: '800' },
  chartCard: { backgroundColor: '#FFFFFF', borderColor: '#E9DCC4', borderRadius: 14, borderWidth: 1, gap: 12, padding: 13 },
  chartLegend: { color: '#475467', fontSize: 11, fontWeight: '700' },
  barGroup: { borderBottomColor: '#EEF1F4', borderBottomWidth: 1, gap: 6, paddingBottom: 12 },
  barLabelRow: { alignItems: 'center', gap: 8, justifyContent: 'space-between' },
  monthLabel: { color: '#344054', fontSize: 12, fontWeight: '700' },
  barValue: { color: '#667085', fontSize: 11 },
  barTrack: { backgroundColor: '#EEF2F6', borderRadius: 999, height: 9, overflow: 'hidden', width: '100%' },
  paidBar: { backgroundColor: '#1D5A88', borderRadius: 999, height: 9 },
  commissionBar: { backgroundColor: '#B28A38', borderRadius: 999, height: 9 },
  periodCard: { backgroundColor: '#FFFFFF', borderColor: '#E9DCC4', borderRadius: 14, borderWidth: 1, gap: 10, padding: 13 },
  periodTitle: { color: '#123B5D', fontSize: 14, fontWeight: '800' },
  infoRow: { alignItems: 'center', gap: 10, justifyContent: 'space-between' },
  infoLabel: { color: '#667085', flex: 1, fontSize: 11 },
  infoValue: { color: '#344054', flex: 1, fontSize: 11, fontWeight: '700' },
  warningText: { color: '#805B00', fontSize: 11, lineHeight: 17 },
  emptyCard: { alignItems: 'center', backgroundColor: '#FFFFFF', borderColor: '#E9DCC4', borderRadius: 14, borderWidth: 1, gap: 7, padding: 20 },
  emptyTitle: { color: '#123B5D', fontSize: 14, fontWeight: '800', textAlign: 'center' },
  emptyBody: { color: '#667085', fontSize: 12, lineHeight: 19, textAlign: 'center' },
  policyBox: { backgroundColor: '#F8F5EF', borderColor: '#E9DCC4', borderRadius: 12, borderWidth: 1, gap: 7, padding: 12 },
  policyText: { color: '#475467', fontSize: 11, lineHeight: 18 },
  footer: { color: '#667085', fontSize: 11, lineHeight: 18 },
});
