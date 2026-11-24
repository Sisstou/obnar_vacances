import React from 'react';
import {
  calculateFullPaymentCommission,
  calculateRetainedDepositCommission,
} from '../lib/booking-calculations.mjs';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

export type OwnerBookingStatus =
  | 'requested'
  | 'confirmed'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export type OwnerBookingPaymentStatus =
  | 'unpaid'
  | 'partially_paid'
  | 'fully_paid'
  | 'refunded'
  | 'unknown';

export type OwnerBookingCommissionBasis =
  | 'full_payment'
  | 'retained_no_show_deposit'
  | 'not_due'
  | 'undetermined';

export type OwnerBookingItem = {
  id: string;
  stayTitle: string;
  guestDisplayName: string;
  checkInLabel: string;
  checkOutLabel: string;
  nights: number;
  guestCount: number;
  status: OwnerBookingStatus;
  paymentStatus: OwnerBookingPaymentStatus;
  totalAmount?: number;
  amountPaid?: number;
  /** Set only from a verified accounting outcome, never inferred from a request. */
  commissionBasis: OwnerBookingCommissionBasis;
  /** Number of full nights covered by a retained no-show deposit, from verified accounting data. */
  retainedDepositNights?: number;
  /** Whether the owner has manually settled the platform commission. */
  commissionSettled?: boolean;
};

type Language = 'ar' | 'fr';

type Props = {
  bookings: OwnerBookingItem[];
  language: Language;
  trustedBookingSource?: boolean;
  onOpenBooking?: (booking: OwnerBookingItem) => void;
};

const copy = {
  ar: {
    heading: 'إدارة الحجوزات',
    subtitle: 'تابع طلبات الإقامة وحالة الدفع والعمولة المستحقة',
    emptyTitle: 'لا توجد حجوزات لعرضها',
    emptyBody: 'ستظهر هنا الحجوزات التي يمررها مصدر البيانات إلى لوحة المالك.',
    guest: 'الضيف',
    dates: 'مدة الإقامة',
    guests: 'عدد الضيوف',
    nights: 'الليالي',
    total: 'المبلغ الإجمالي',
    paid: 'المبلغ المدفوع',
    bookingStatus: 'حالة الحجز',
    paymentStatus: 'حالة الدفع',
    commission: 'عمولة المنصة',
    commissionAmount: 'العمولة المحتسبة',
    commissionSettled: 'تم تسويتها يدوياً',
    commissionDue: 'تحتاج إلى تسوية يدوية',
    commissionNotDue: 'لا توجد عمولة مستحقة وفق البيانات الحالية',
    commissionUnknown: 'لا يمكن تحديد العمولة قبل التحقق من الدفع والنتيجة',
    requested: 'طلب جديد',
    confirmed: 'مؤكد',
    completed: 'مكتمل',
    cancelled: 'ملغى',
    no_show: 'عدم حضور',
    unpaid: 'غير مدفوع',
    partially_paid: 'مدفوع جزئياً',
    fully_paid: 'مدفوع بالكامل',
    refunded: 'مسترد',
    unknown: 'غير معروف',
    open: 'عرض التفاصيل',
    sourceTrusted: 'بيانات الحجوزات واردة من مصدر موثوق.',
    sourceUntrusted: 'بيانات الحجوزات غير مؤكدة؛ لا تعتمد الحالات أو المبالغ قبل التحقق من مصدرها.',
    staging: 'تنبيه: حجوزات الاختبار ليست حجوزات حقيقية لعملاء ولا تثبت توفر أي إقامة.',
    commissionRule: 'العمولة 500 دج عن كل ليلة مدفوعة. وفي حالة عدم الحضور، تُحتسب 500 دج عن كل ليلة كاملة يغطيها العربون الذي احتفظ به المالك.',
    manualRule: 'تسوية العمولة يدوية في المرحلة الحالية. لا يوجد دفع داخل التطبيق أو تحصيل آلي.',
    noAutoInference: 'لا تُحتسب العمولة لمجرد إنشاء طلب حجز؛ يجب التحقق من الدفع وسبب استحقاقها.',
    ownerCancel: 'عند إلغاء المالك، يسترد الضيف كامل المبلغ ولا تستحق عمولة عن الحجز الملغى.',
    demo: 'واجهة عرض فقط؛ لا تؤكد الحجز ولا تغيّر حالته أو تسجل الدفع أو التسوية.',
    currency: 'دج',
    invalid: '—',
  },
  fr: {
    heading: 'Gestion des réservations',
    subtitle: 'Suivez les demandes, les paiements et les commissions dues',
    emptyTitle: 'Aucune réservation à afficher',
    emptyBody: 'Les réservations fournies par la source de données apparaîtront ici.',
    guest: 'Voyageur',
    dates: 'Dates du séjour',
    guests: 'Voyageurs',
    nights: 'Nuits',
    total: 'Montant total',
    paid: 'Montant payé',
    bookingStatus: 'Statut de réservation',
    paymentStatus: 'Statut du paiement',
    commission: 'Commission plateforme',
    commissionAmount: 'Commission calculée',
    commissionSettled: 'Réglée manuellement',
    commissionDue: 'Règlement manuel requis',
    commissionNotDue: 'Aucune commission due selon les données actuelles',
    commissionUnknown: 'Commission indéterminée avant vérification du paiement et de l’issue',
    requested: 'Nouvelle demande',
    confirmed: 'Confirmée',
    completed: 'Terminée',
    cancelled: 'Annulée',
    no_show: 'Non-présentation',
    unpaid: 'Non payé',
    partially_paid: 'Partiellement payé',
    fully_paid: 'Entièrement payé',
    refunded: 'Remboursé',
    unknown: 'Inconnu',
    open: 'Voir les détails',
    sourceTrusted: 'Les réservations proviennent d’une source fiable.',
    sourceUntrusted: 'Les réservations ne sont pas vérifiées ; ne vous fiez pas aux statuts ou montants avant validation de la source.',
    staging: 'Attention : les réservations de test ne sont pas de vraies réservations clients et ne prouvent aucune disponibilité.',
    commissionRule: 'La commission est de 500 DZD par nuit payée. En cas de non-présentation, 500 DZD sont dus pour chaque nuit complète couverte par l’acompte conservé par le propriétaire.',
    manualRule: 'Le règlement de la commission est manuel à ce stade. Aucun paiement intégré ni prélèvement automatique.',
    noAutoInference: 'Une simple demande ne déclenche pas de commission ; le paiement et le motif d’exigibilité doivent être vérifiés.',
    ownerCancel: 'En cas d’annulation par le propriétaire, le voyageur reçoit un remboursement intégral et aucune commission n’est due pour la réservation annulée.',
    demo: 'Affichage uniquement ; cet écran ne confirme aucune réservation, ne modifie aucun statut et n’enregistre ni paiement ni règlement.',
    currency: 'DZD',
    invalid: '—',
  },
} as const;

const statusColors: Record<OwnerBookingStatus, { backgroundColor: string; color: string }> = {
  requested: { backgroundColor: '#EEF2F7', color: '#344054' },
  confirmed: { backgroundColor: '#E8F1FB', color: '#245B91' },
  completed: { backgroundColor: '#E4F5EC', color: '#176B42' },
  cancelled: { backgroundColor: '#FDECEC', color: '#A12B2B' },
  no_show: { backgroundColor: '#FFF4D6', color: '#805B00' },
};

function formatAmount(value: number | undefined, language: Language, currency: string) {
  if (value === undefined || !Number.isFinite(value) || value < 0) return '—';
  return `${new Intl.NumberFormat(language === 'ar' ? 'ar-DZ' : 'fr-DZ', {
    maximumFractionDigits: 0,
  }).format(value)} ${currency}`;
}

function commissionFor(booking: OwnerBookingItem): number | null {
  if (
    !Number.isSafeInteger(booking.nights) ||
    booking.nights < 1 ||
    booking.commissionBasis === 'undetermined'
  ) return null;

  if (booking.commissionBasis === 'full_payment') {
    if (booking.paymentStatus !== 'fully_paid' || booking.status === 'cancelled') return null;
    return calculateFullPaymentCommission(booking.nights);
  }
  if (booking.commissionBasis === 'retained_no_show_deposit') {
    if (booking.status !== 'no_show') return null;
    return calculateRetainedDepositCommission(booking.nights, booking.retainedDepositNights ?? 0);
  }
  return 0;
}

/**
 * Read-only owner bookings list.
 * Booking and accounting outcomes must be supplied by a trusted parent source.
 * No booking mutation, payment verification, commission collection, API call,
 * or persistence is performed here.
 */
export default function OwnerBookingsPanel({
  bookings,
  language,
  trustedBookingSource = false,
  onOpenBooking,
}: Props) {
  const t = copy[language];
  const rtl = language === 'ar';

  return (
    <View style={[styles.container, { direction: rtl ? 'rtl' : 'ltr' }]}>
      <View style={styles.header}>
        <Text accessibilityRole="header" style={[styles.heading, { textAlign: rtl ? 'right' : 'left' }]}>
          {t.heading}
        </Text>
        <Text style={[styles.subtitle, { textAlign: rtl ? 'right' : 'left' }]}>
          {t.subtitle}
        </Text>
      </View>

      <View style={styles.notice}>
        <Text style={[styles.noticeText, { textAlign: rtl ? 'right' : 'left' }]}>
          {trustedBookingSource ? t.sourceTrusted : t.sourceUntrusted}
        </Text>
        <Text style={[styles.noticeText, { textAlign: rtl ? 'right' : 'left' }]}>
          {t.staging}
        </Text>
      </View>

      {bookings.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>{t.emptyTitle}</Text>
          <Text style={styles.emptyBody}>{t.emptyBody}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {bookings.map((booking) => {
            const status = statusColors[booking.status];
            const commission = trustedBookingSource ? commissionFor(booking) : null;
            const commissionText = !trustedBookingSource || commission === null
              ? t.commissionUnknown
              : commission === 0
                ? t.commissionNotDue
                : `${t.commissionAmount}: ${formatAmount(commission, language, t.currency)} · ${booking.commissionSettled ? t.commissionSettled : t.commissionDue}`;

            return (
              <View key={booking.id} style={styles.bookingCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.titleBlock}>
                    <Text numberOfLines={2} style={[styles.stayTitle, { textAlign: rtl ? 'right' : 'left' }]}>
                      {booking.stayTitle}
                    </Text>
                    <Text style={[styles.guestName, { textAlign: rtl ? 'right' : 'left' }]}>
                      {t.guest}: {booking.guestDisplayName}
                    </Text>
                  </View>
                  <View style={[styles.statusPill, { backgroundColor: trustedBookingSource ? status.backgroundColor : '#EEF2F7' }]}>
                    <Text style={[styles.statusText, { color: trustedBookingSource ? status.color : '#667085' }]}>
                      {trustedBookingSource ? t[booking.status] : t.unknown}
                    </Text>
                  </View>
                </View>

                <View style={styles.details}>
                  <InfoRow label={t.dates} value={`${booking.checkInLabel} – ${booking.checkOutLabel}`} rtl={rtl} />
                  <InfoRow label={t.nights} value={String(booking.nights)} rtl={rtl} />
                  <InfoRow label={t.guests} value={String(booking.guestCount)} rtl={rtl} />
                  <InfoRow label={t.bookingStatus} value={trustedBookingSource ? t[booking.status] : t.unknown} rtl={rtl} />
                  <InfoRow label={t.paymentStatus} value={trustedBookingSource ? t[booking.paymentStatus] : t.unknown} rtl={rtl} />
                  <InfoRow label={t.total} value={trustedBookingSource ? formatAmount(booking.totalAmount, language, t.currency) : t.invalid} rtl={rtl} />
                  <InfoRow label={t.paid} value={trustedBookingSource ? formatAmount(booking.amountPaid, language, t.currency) : t.invalid} rtl={rtl} />
                </View>

                <View style={styles.commissionBox}>
                  <Text style={[styles.commissionTitle, { textAlign: rtl ? 'right' : 'left' }]}>
                    {t.commission}
                  </Text>
                  <Text style={[styles.commissionText, { textAlign: rtl ? 'right' : 'left' }]}>
                    {commissionText}
                  </Text>
                </View>

                {onOpenBooking ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t.open + ': ' + booking.stayTitle}
                    onPress={() => onOpenBooking(booking)}
                    style={({ pressed }) => [styles.openButton, pressed && styles.pressed]}
                  >
                    <Text style={styles.openButtonText}>{t.open}</Text>
                  </Pressable>
                ) : null}
              </View>
            );
          })}
        </ScrollView>
      )}

      <View style={styles.policyNotice}>
        <Text style={[styles.policyText, { textAlign: rtl ? 'right' : 'left' }]}>{t.commissionRule}</Text>
        <Text style={[styles.policyText, { textAlign: rtl ? 'right' : 'left' }]}>{t.manualRule}</Text>
        <Text style={[styles.policyText, { textAlign: rtl ? 'right' : 'left' }]}>{t.noAutoInference}</Text>
        <Text style={[styles.policyText, { textAlign: rtl ? 'right' : 'left' }]}>{t.ownerCancel}</Text>
      </View>

      <Text style={[styles.footer, { textAlign: rtl ? 'right' : 'left' }]}>{t.demo}</Text>
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
  heading: { color: '#12243A', fontSize: 22, fontWeight: '800' },
  subtitle: { color: '#667085', fontSize: 13, lineHeight: 20 },
  notice: { backgroundColor: '#F2F6FA', borderColor: '#DCE6EF', borderRadius: 12, borderWidth: 1, gap: 6, padding: 12 },
  noticeText: { color: '#475467', fontSize: 11, lineHeight: 17 },
  list: { gap: 10, paddingBottom: 4 },
  bookingCard: { backgroundColor: '#FFFFFF', borderColor: '#E5EAF0', borderRadius: 15, borderWidth: 1, gap: 12, padding: 13 },
  cardHeader: { alignItems: 'flex-start', flexDirection: 'row', gap: 9, justifyContent: 'space-between' },
  titleBlock: { flex: 1, gap: 5 },
  stayTitle: { color: '#12243A', fontSize: 15, fontWeight: '800', lineHeight: 21 },
  guestName: { color: '#667085', fontSize: 12 },
  statusPill: { borderRadius: 999, maxWidth: 125, paddingHorizontal: 9, paddingVertical: 6 },
  statusText: { fontSize: 11, fontWeight: '700' },
  details: { gap: 9 },
  infoRow: { alignItems: 'center', gap: 10, justifyContent: 'space-between' },
  infoLabel: { color: '#667085', flex: 1, fontSize: 12 },
  infoValue: { color: '#344054', flex: 1, fontSize: 12, fontWeight: '600' },
  commissionBox: { backgroundColor: '#F5F8FA', borderColor: '#E5EAF0', borderRadius: 11, borderWidth: 1, gap: 5, padding: 11 },
  commissionTitle: { color: '#24364B', fontSize: 12, fontWeight: '800' },
  commissionText: { color: '#475467', fontSize: 12, lineHeight: 19 },
  policyNotice: { backgroundColor: '#F8FAFC', borderColor: '#E5EAF0', borderRadius: 12, borderWidth: 1, gap: 7, padding: 12 },
  policyText: { color: '#475467', fontSize: 11, lineHeight: 18 },
  emptyCard: { alignItems: 'center', backgroundColor: '#FFFFFF', borderColor: '#E5EAF0', borderRadius: 14, borderWidth: 1, gap: 7, padding: 22 },
  emptyTitle: { color: '#12243A', fontSize: 15, fontWeight: '800', textAlign: 'center' },
  emptyBody: { color: '#667085', fontSize: 12, lineHeight: 19, textAlign: 'center' },
  openButton: { alignItems: 'center', backgroundColor: '#12345A', borderRadius: 10, justifyContent: 'center', minHeight: 43, paddingHorizontal: 12 },
  openButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  footer: { color: '#667085', fontSize: 11, lineHeight: 17 },
  pressed: { opacity: 0.78 },
});
