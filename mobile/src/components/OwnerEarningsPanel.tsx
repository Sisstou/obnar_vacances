import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { OwnerBookingItem } from './OwnerBookingsPanel';

type Language = 'ar' | 'fr';

type Props = {
  bookings: OwnerBookingItem[];
  language: Language;
  trustedBookingSource?: boolean;
};

type FinancialRow = {
  booking: OwnerBookingItem;
  paidAmount: number | null;
  commission: number | null;
  commissionState: 'settled' | 'pending' | 'not_due' | 'unknown';
};

const copy = {
  ar: {
    heading: 'السجل المالي للمالك',
    subtitle: 'ملخص المبالغ المسجلة وعمولات المنصة حسب الحجوزات المقدمة',
    paidTotal: 'إجمالي المبالغ المدفوعة المسجلة',
    commissionTotal: 'إجمالي العمولة المحتسبة',
    settledTotal: 'العمولة المسوّاة يدوياً',
    pendingTotal: 'العمولة التي تحتاج إلى تسوية',
    bookingCount: 'عدد الحجوزات المعروضة',
    paymentGaps: 'حجوزات ينقصها مبلغ مدفوع موثق',
    commissionGaps: 'حجوزات لا يمكن تحديد عمولتها',
    records: 'تفصيل الحجوزات',
    noRecords: 'لا توجد حجوزات لعرضها',
    noRecordsBody: 'ستظهر هنا ملخصات الحجوزات التي يمررها مصدر البيانات.',
    guest: 'الضيف',
    stay: 'الإقامة',
    dates: 'الفترة',
    paid: 'المبلغ المدفوع',
    commission: 'العمولة',
    settled: 'مسوّاة يدوياً',
    pending: 'تحتاج إلى تسوية يدوية',
    notDue: 'غير مستحقة',
    unknown: 'غير محددة',
    sourceTrusted: 'المصدر المالي موثوق وفق تأكيد المكوّن الأب.',
    sourceUntrusted: 'مصدر البيانات غير مؤكد؛ أُخفيت المجاميع المالية منعاً لعرض أرقام غير موثوقة.',
    staging: 'تنبيه: بيانات الاختبار ليست معاملات مالية حقيقية ولا حجوزات فعلية لعملاء.',
    commissionRule: 'العمولة 500 دج لكل ليلة مدفوعة بالكامل. وعند عدم الحضور، تُحتسب 500 دج فقط إذا احتفظ المالك بعربون ليلة واحدة.',
    manualRule: 'تسوية العمولة يدوية حالياً. لا يوجد دفع داخل التطبيق أو تحصيل آلي.',
    ownerCancel: 'عند إلغاء المالك، يسترد الضيف كامل المبلغ ولا تستحق عمولة عن الحجز الملغى.',
    incompletePaid: 'المجموع يستند إلى المبالغ المتاحة فقط؛ بعض الحجوزات لا تحتوي على مبلغ مدفوع موثق.',
    incompleteCommission: 'العمولة المعروضة مجموع الحالات المحددة فقط؛ توجد حجوزات تحتاج إلى تحقق محاسبي.',
    netDisclaimer: 'هذه الأرقام ليست ربحاً صافياً ولا كشفاً محاسبياً نهائياً؛ إنها ملخص للبيانات التي وفرها المصدر فقط.',
    currency: 'دج',
    dash: '—',
  },
  fr: {
    heading: 'Registre financier du propriétaire',
    subtitle: 'Synthèse des montants enregistrés et des commissions par réservation',
    paidTotal: 'Total des montants payés enregistrés',
    commissionTotal: 'Total des commissions calculées',
    settledTotal: 'Commissions réglées manuellement',
    pendingTotal: 'Commissions à régler',
    bookingCount: 'Nombre de réservations affichées',
    paymentGaps: 'Réservations sans montant payé vérifié',
    commissionGaps: 'Réservations avec commission indéterminée',
    records: 'Détail des réservations',
    noRecords: 'Aucune réservation à afficher',
    noRecordsBody: 'Les réservations fournies par la source de données apparaîtront ici.',
    guest: 'Voyageur',
    stay: 'Hébergement',
    dates: 'Période',
    paid: 'Montant payé',
    commission: 'Commission',
    settled: 'Réglée manuellement',
    pending: 'Règlement manuel requis',
    notDue: 'Non exigible',
    unknown: 'Indéterminée',
    sourceTrusted: 'La source financière est déclarée fiable par le composant parent.',
    sourceUntrusted: 'La source n’est pas vérifiée ; les totaux financiers sont masqués pour éviter des chiffres non fiables.',
    staging: 'Attention : les données de test ne sont pas de vraies transactions financières ni de vraies réservations clients.',
    commissionRule: 'La commission est de 500 DZD par nuit entièrement payée. En cas de non-présentation, 500 DZD sont dus uniquement si le propriétaire conserve le dépôt d’une nuit.',
    manualRule: 'Le règlement de la commission est manuel à ce stade. Aucun paiement intégré ni prélèvement automatique.',
    ownerCancel: 'En cas d’annulation par le propriétaire, le voyageur reçoit un remboursement intégral et aucune commission n’est due.',
    incompletePaid: 'Le total utilise uniquement les montants disponibles ; certaines réservations ne contiennent pas de montant payé vérifié.',
    incompleteCommission: 'La commission affichée totalise uniquement les cas déterminés ; certaines réservations nécessitent une vérification comptable.',
    netDisclaimer: 'Ces chiffres ne représentent ni un bénéfice net ni un relevé comptable définitif ; ils résument uniquement les données fournies par la source.',
    currency: 'DZD',
    dash: '—',
  },
} as const;

function formatAmount(value: number, language: Language, currency: string) {
  return `${new Intl.NumberFormat(language === 'ar' ? 'ar-DZ' : 'fr-DZ', {
    maximumFractionDigits: 0,
  }).format(value)} ${currency}`;
}

function validAmount(value: number | undefined): number | null {
  return value !== undefined && Number.isFinite(value) && value >= 0 ? value : null;
}

function commissionFor(booking: OwnerBookingItem): number | null {
  if (!Number.isInteger(booking.nights) || booking.nights < 1) return null;

  if (booking.commissionBasis === 'full_payment') {
    if (booking.paymentStatus !== 'fully_paid' || booking.status === 'cancelled') return null;
    return booking.nights * 500;
  }
  if (booking.commissionBasis === 'retained_no_show_deposit') {
    if (booking.status !== 'no_show') return null;
    return 500;
  }
  if (booking.commissionBasis === 'not_due') return 0;
  return null;
}

function MetricCard({ label, value, rtl, detail }: {
  label: string;
  value: string;
  rtl: boolean;
  detail?: string;
}) {
  return (
    <View style={styles.metricCard}>
      <Text style={[styles.metricLabel, { textAlign: rtl ? 'right' : 'left' }]}>{label}</Text>
      <Text style={[styles.metricValue, { textAlign: rtl ? 'right' : 'left' }]}>{value}</Text>
      {detail ? <Text style={[styles.metricDetail, { textAlign: rtl ? 'right' : 'left' }]}>{detail}</Text> : null}
    </View>
  );
}

export default function OwnerEarningsPanel({
  bookings,
  language,
  trustedBookingSource = false,
}: Props) {
  const t = copy[language];
  const rtl = language === 'ar';

  const rows: FinancialRow[] = bookings.map((booking) => {
    const commission = trustedBookingSource ? commissionFor(booking) : null;
    const paidAmount = trustedBookingSource ? validAmount(booking.amountPaid) : null;
    const commissionState: FinancialRow['commissionState'] = commission === null
      ? 'unknown'
      : commission === 0
        ? 'not_due'
        : booking.commissionSettled
          ? 'settled'
          : 'pending';
    return { booking, paidAmount, commission, commissionState };
  });

  const knownPaid = rows.reduce((sum, row) => sum + (row.paidAmount ?? 0), 0);
  const missingPaid = rows.filter((row) => row.paidAmount === null).length;
  const knownCommission = rows.reduce((sum, row) => sum + (row.commission ?? 0), 0);
  const settledCommission = rows.reduce(
    (sum, row) => sum + (row.commissionState === 'settled' ? row.commission ?? 0 : 0),
    0,
  );
  const pendingCommission = rows.reduce(
    (sum, row) => sum + (row.commissionState === 'pending' ? row.commission ?? 0 : 0),
    0,
  );
  const unknownCommission = rows.filter((row) => row.commission === null).length;

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
          {trustedBookingSource ? t.sourceTrusted : t.sourceUntrusted}
        </Text>
        <Text style={[styles.noticeText, { textAlign: rtl ? 'right' : 'left' }]}>{t.staging}</Text>
      </View>

      {trustedBookingSource ? (
        <>
          <View style={styles.metrics}>
            <MetricCard
              label={t.paidTotal}
              value={formatAmount(knownPaid, language, t.currency)}
              rtl={rtl}
              detail={missingPaid > 0 ? `${missingPaid} · ${t.paymentGaps}` : undefined}
            />
            <MetricCard
              label={t.commissionTotal}
              value={formatAmount(knownCommission, language, t.currency)}
              rtl={rtl}
              detail={unknownCommission > 0 ? `${unknownCommission} · ${t.commissionGaps}` : undefined}
            />
            <MetricCard
              label={t.settledTotal}
              value={formatAmount(settledCommission, language, t.currency)}
              rtl={rtl}
            />
            <MetricCard
              label={t.pendingTotal}
              value={formatAmount(pendingCommission, language, t.currency)}
              rtl={rtl}
              detail={unknownCommission > 0 ? t.incompleteCommission : undefined}
            />
            <MetricCard
              label={t.bookingCount}
              value={String(bookings.length)}
              rtl={rtl}
            />
          </View>
          {missingPaid > 0 ? (
            <Text style={[styles.caveat, { textAlign: rtl ? 'right' : 'left' }]}>{t.incompletePaid}</Text>
          ) : null}
          {unknownCommission > 0 ? (
            <Text style={[styles.caveat, { textAlign: rtl ? 'right' : 'left' }]}>{t.incompleteCommission}</Text>
          ) : null}
        </>
      ) : (
        <View style={styles.emptyCard}>
          <Text style={[styles.emptyTitle, { textAlign: rtl ? 'right' : 'left' }]}>{t.sourceUntrusted}</Text>
        </View>
      )}

      <Text style={[styles.sectionTitle, { textAlign: rtl ? 'right' : 'left' }]}>{t.records}</Text>
      {bookings.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>{t.noRecords}</Text>
          <Text style={styles.emptyBody}>{t.noRecordsBody}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {rows.map((row) => {
            const { booking } = row;
            const commissionLabel = !trustedBookingSource || row.commission === null
              ? t.unknown
              : row.commission === 0
                ? t.notDue
                : row.commissionState === 'settled'
                  ? t.settled
                  : t.pending;
            return (
              <View key={booking.id} style={styles.bookingCard}>
                <Text style={[styles.stayTitle, { textAlign: rtl ? 'right' : 'left' }]}>{booking.stayTitle}</Text>
                <Text style={[styles.secondary, { textAlign: rtl ? 'right' : 'left' }]}>{t.guest}: {booking.guestDisplayName}</Text>
                <Text style={[styles.secondary, { textAlign: rtl ? 'right' : 'left' }]}>
                  {t.dates}: {booking.checkInLabel} – {booking.checkOutLabel}
                </Text>
                <View style={[styles.row, { flexDirection: rtl ? 'row-reverse' : 'row' }]}>
                  <Text style={styles.rowLabel}>{t.paid}</Text>
                  <Text style={styles.rowValue}>
                    {trustedBookingSource && row.paidAmount !== null
                      ? formatAmount(row.paidAmount, language, t.currency)
                      : t.dash}
                  </Text>
                </View>
                <View style={[styles.row, { flexDirection: rtl ? 'row-reverse' : 'row' }]}>
                  <Text style={styles.rowLabel}>{t.commission}</Text>
                  <Text style={styles.rowValue}>
                    {trustedBookingSource && row.commission !== null
                      ? formatAmount(row.commission, language, t.currency)
                      : t.dash}
                  </Text>
                </View>
                <Text style={[styles.commissionState, { textAlign: rtl ? 'right' : 'left' }]}>{commissionLabel}</Text>
              </View>
            );
          })}
        </ScrollView>
      )}

      <View style={styles.policyBox}>
        <Text style={[styles.policyText, { textAlign: rtl ? 'right' : 'left' }]}>{t.commissionRule}</Text>
        <Text style={[styles.policyText, { textAlign: rtl ? 'right' : 'left' }]}>{t.manualRule}</Text>
        <Text style={[styles.policyText, { textAlign: rtl ? 'right' : 'left' }]}>{t.ownerCancel}</Text>
      </View>
      <Text style={[styles.footer, { textAlign: rtl ? 'right' : 'left' }]}>{t.netDisclaimer}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12, width: '100%' },
  header: { gap: 5 },
  heading: { color: '#12243A', fontSize: 22, fontWeight: '800' },
  subtitle: { color: '#667085', fontSize: 13, lineHeight: 20 },
  notice: { backgroundColor: '#F2F6FA', borderColor: '#DCE6EF', borderRadius: 12, borderWidth: 1, gap: 6, padding: 12 },
  noticeText: { color: '#475467', fontSize: 11, lineHeight: 17 },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  metricCard: { backgroundColor: '#FFFFFF', borderColor: '#E5EAF0', borderRadius: 13, borderWidth: 1, flexBasis: '47%', flexGrow: 1, gap: 7, minWidth: 135, padding: 12 },
  metricLabel: { color: '#667085', fontSize: 11, lineHeight: 16 },
  metricValue: { color: '#12345A', fontSize: 17, fontWeight: '800' },
  metricDetail: { color: '#805B00', fontSize: 10, lineHeight: 15 },
  caveat: { color: '#805B00', fontSize: 11, lineHeight: 17 },
  sectionTitle: { color: '#12243A', fontSize: 15, fontWeight: '800' },
  list: { gap: 9, paddingBottom: 4 },
  bookingCard: { backgroundColor: '#FFFFFF', borderColor: '#E5EAF0', borderRadius: 14, borderWidth: 1, gap: 8, padding: 12 },
  stayTitle: { color: '#12243A', fontSize: 14, fontWeight: '800' },
  secondary: { color: '#667085', fontSize: 11, lineHeight: 16 },
  row: { alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  rowLabel: { color: '#667085', fontSize: 11 },
  rowValue: { color: '#344054', fontSize: 11, fontWeight: '700' },
  commissionState: { color: '#475467', fontSize: 11, fontWeight: '700' },
  emptyCard: { alignItems: 'center', backgroundColor: '#FFFFFF', borderColor: '#E5EAF0', borderRadius: 14, borderWidth: 1, gap: 7, padding: 18 },
  emptyTitle: { color: '#12243A', fontSize: 13, fontWeight: '800' },
  emptyBody: { color: '#667085', fontSize: 11, lineHeight: 17, textAlign: 'center' },
  policyBox: { backgroundColor: '#F8FAFC', borderColor: '#E5EAF0', borderRadius: 12, borderWidth: 1, gap: 7, padding: 12 },
  policyText: { color: '#475467', fontSize: 11, lineHeight: 18 },
  footer: { color: '#667085', fontSize: 11, lineHeight: 17 },
});
