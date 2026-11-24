import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  OwnerBookingCommissionBasis,
  OwnerBookingItem,
  OwnerBookingPaymentStatus,
  OwnerBookingStatus,
} from './OwnerBookingsPanel';

type Language = 'ar' | 'fr';

export type OwnerBookingHistoryEntry = {
  id: string;
  status: OwnerBookingStatus;
  dateLabel: string;
  note?: string;
};

type Props = {
  booking: OwnerBookingItem;
  history?: OwnerBookingHistoryEntry[];
  language: Language;
  trustedBookingSource?: boolean;
  onBack?: () => void;
};

const copy = {
  ar: {
    heading: 'تفاصيل الحجز',
    stay: 'الإقامة',
    guest: 'الضيف',
    dates: 'مدة الإقامة',
    checkIn: 'تاريخ الوصول',
    checkOut: 'تاريخ المغادرة',
    nights: 'عدد الليالي',
    guests: 'عدد الضيوف',
    bookingStatus: 'حالة الحجز',
    paymentStatus: 'حالة الدفع',
    financial: 'ملخص المبالغ',
    total: 'المبلغ الإجمالي',
    paid: 'المبلغ المدفوع',
    commission: 'عمولة المنصة',
    commissionBasis: 'أساس احتساب العمولة',
    commissionAmount: 'العمولة المحتسبة',
    commissionSettled: 'تمت تسويتها يدوياً',
    commissionDue: 'تحتاج إلى تسوية يدوية',
    commissionNotDue: 'لا توجد عمولة مستحقة وفق البيانات الحالية',
    commissionUnknown: 'غير محددة؛ يلزم التحقق من نتيجة الحجز والدفع',
    fullPayment: 'دفع كامل الحجز',
    retainedDeposit: 'الاحتفاظ بعربون عدم الحضور',
    notDue: 'غير مستحقة',
    undetermined: 'غير محدد',
    history: 'سجل تغيّر الحالة',
    noHistory: 'لا يوجد سجل تغيّر حالة مرفق بهذا الحجز.',
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
    trusted: 'مصدر بيانات الحجز موثوق وفق تأكيد الشاشة الأم.',
    untrusted: 'مصدر البيانات غير مؤكد؛ لن نعرض حالات الدفع أو المبالغ أو العمولة كحقائق.',
    staging: 'تنبيه: بيانات الاختبار ليست حجوزات حقيقية لعملاء ولا تثبت توفر الإقامة.',
    commissionRule: 'العمولة 500 دج عن كل ليلة مدفوعة بالكامل. وفي حالة عدم الحضور، تُحتسب 500 دج فقط إذا احتفظ المالك بعربون ليلة واحدة.',
    ownerCancel: 'عند إلغاء المالك، يسترد الضيف كامل المبلغ ولا تستحق عمولة عن الحجز الملغى.',
    manual: 'تسوية العمولة يدوية في المرحلة الحالية؛ لا يوجد دفع داخل التطبيق أو تحصيل آلي.',
    back: 'العودة إلى الحجوزات',
    footer: 'واجهة عرض فقط: لا تؤكد الحجز، ولا تغيّر حالته، ولا تسجل الدفع أو الاسترداد أو تسوية العمولة.',
    currency: 'دج',
    dash: '—',
  },
  fr: {
    heading: 'Détails de la réservation',
    stay: 'Hébergement',
    guest: 'Voyageur',
    dates: 'Durée du séjour',
    checkIn: 'Arrivée',
    checkOut: 'Départ',
    nights: 'Nombre de nuits',
    guests: 'Nombre de voyageurs',
    bookingStatus: 'Statut de réservation',
    paymentStatus: 'Statut du paiement',
    financial: 'Récapitulatif financier',
    total: 'Montant total',
    paid: 'Montant payé',
    commission: 'Commission plateforme',
    commissionBasis: 'Base de calcul',
    commissionAmount: 'Commission calculée',
    commissionSettled: 'Réglée manuellement',
    commissionDue: 'Règlement manuel requis',
    commissionNotDue: 'Aucune commission due selon les données actuelles',
    commissionUnknown: 'Indéterminée ; l’issue et le paiement doivent être vérifiés',
    fullPayment: 'Paiement intégral du séjour',
    retainedDeposit: 'Dépôt conservé après non-présentation',
    notDue: 'Non exigible',
    undetermined: 'Indéterminée',
    history: 'Historique des changements de statut',
    noHistory: 'Aucun historique fourni pour cette réservation.',
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
    trusted: 'La source des réservations est déclarée fiable par le composant parent.',
    untrusted: 'La source n’est pas vérifiée ; les statuts de paiement, montants et commissions ne seront pas présentés comme des faits.',
    staging: 'Attention : les données de test ne sont pas de vraies réservations clients et ne prouvent aucune disponibilité.',
    commissionRule: 'La commission est de 500 DZD par nuit entièrement payée. En cas de non-présentation, 500 DZD sont dus uniquement si le propriétaire conserve le dépôt d’une nuit.',
    ownerCancel: 'En cas d’annulation par le propriétaire, le voyageur reçoit un remboursement intégral et aucune commission n’est due.',
    manual: 'Le règlement de la commission est manuel à ce stade ; aucun paiement intégré ni prélèvement automatique.',
    back: 'Retour aux réservations',
    footer: 'Affichage uniquement : aucune réservation n’est confirmée, aucun statut n’est modifié et aucun paiement, remboursement ou règlement n’est enregistré.',
    currency: 'DZD',
    dash: '—',
  },
} as const;

function amount(value: number | undefined, language: Language, currency: string, dash: string) {
  if (value === undefined || !Number.isFinite(value) || value < 0) return dash;
  return `${new Intl.NumberFormat(language === 'ar' ? 'ar-DZ' : 'fr-DZ', {
    maximumFractionDigits: 0,
  }).format(value)} ${currency}`;
}

function commissionFor(
  booking: OwnerBookingItem,
  trusted: boolean,
): number | null {
  if (!trusted || !Number.isInteger(booking.nights) || booking.nights < 1) return null;

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

function InfoRow({ label, value, rtl }: { label: string; value: string; rtl: boolean }) {
  return (
    <View style={[styles.infoRow, { flexDirection: rtl ? 'row-reverse' : 'row' }]}>
      <Text style={[styles.infoLabel, { textAlign: rtl ? 'right' : 'left' }]}>{label}</Text>
      <Text style={[styles.infoValue, { textAlign: rtl ? 'left' : 'right' }]}>{value}</Text>
    </View>
  );
}

export default function OwnerBookingDetails({
  booking,
  history = [],
  language,
  trustedBookingSource = false,
  onBack,
}: Props) {
  const t = copy[language];
  const rtl = language === 'ar';
  const commission = commissionFor(booking, trustedBookingSource);
  const statusLabel = trustedBookingSource ? t[booking.status] : t.unknown;
  const paymentLabel = trustedBookingSource ? t[booking.paymentStatus] : t.unknown;
  const basisLabels: Record<OwnerBookingCommissionBasis, string> = {
    full_payment: t.fullPayment,
    retained_no_show_deposit: t.retainedDeposit,
    not_due: t.notDue,
    undetermined: t.undetermined,
  };
  const commissionLabel = commission === null
    ? t.commissionUnknown
    : commission === 0
      ? t.commissionNotDue
      : `${t.commissionAmount}: ${amount(commission, language, t.currency, t.dash)} · ${booking.commissionSettled ? t.commissionSettled : t.commissionDue}`;

  return (
    <View style={[styles.container, { direction: rtl ? 'rtl' : 'ltr' }]}>
      <View style={styles.header}>
        <Text accessibilityRole="header" style={[styles.heading, { textAlign: rtl ? 'right' : 'left' }]}>
          {t.heading}
        </Text>
        <Text style={[styles.stayTitle, { textAlign: rtl ? 'right' : 'left' }]}>{booking.stayTitle}</Text>
        <Text style={[styles.guest, { textAlign: rtl ? 'right' : 'left' }]}>{t.guest}: {booking.guestDisplayName}</Text>
      </View>

      <View style={styles.notice}>
        <Text style={[styles.noticeText, { textAlign: rtl ? 'right' : 'left' }]}>
          {trustedBookingSource ? t.trusted : t.untrusted}
        </Text>
        <Text style={[styles.noticeText, { textAlign: rtl ? 'right' : 'left' }]}>{t.staging}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={[styles.sectionTitle, { textAlign: rtl ? 'right' : 'left' }]}>{t.dates}</Text>
          <InfoRow label={t.checkIn} value={booking.checkInLabel} rtl={rtl} />
          <InfoRow label={t.checkOut} value={booking.checkOutLabel} rtl={rtl} />
          <InfoRow label={t.nights} value={String(booking.nights)} rtl={rtl} />
          <InfoRow label={t.guests} value={String(booking.guestCount)} rtl={rtl} />
        </View>

        <View style={styles.card}>
          <Text style={[styles.sectionTitle, { textAlign: rtl ? 'right' : 'left' }]}>{t.bookingStatus}</Text>
          <InfoRow label={t.bookingStatus} value={statusLabel} rtl={rtl} />
          <InfoRow label={t.paymentStatus} value={paymentLabel} rtl={rtl} />
        </View>

        <View style={styles.card}>
          <Text style={[styles.sectionTitle, { textAlign: rtl ? 'right' : 'left' }]}>{t.financial}</Text>
          <InfoRow label={t.total} value={trustedBookingSource ? amount(booking.totalAmount, language, t.currency, t.dash) : t.dash} rtl={rtl} />
          <InfoRow label={t.paid} value={trustedBookingSource ? amount(booking.amountPaid, language, t.currency, t.dash) : t.dash} rtl={rtl} />
          <View style={styles.commissionBox}>
            <Text style={[styles.commissionTitle, { textAlign: rtl ? 'right' : 'left' }]}>{t.commission}</Text>
            <Text style={[styles.commissionText, { textAlign: rtl ? 'right' : 'left' }]}>{trustedBookingSource ? basisLabels[booking.commissionBasis] : t.undetermined}</Text>
            <Text style={[styles.commissionText, { textAlign: rtl ? 'right' : 'left' }]}>{commissionLabel}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={[styles.sectionTitle, { textAlign: rtl ? 'right' : 'left' }]}>{t.history}</Text>
          {history.length === 0 ? (
            <Text style={[styles.muted, { textAlign: rtl ? 'right' : 'left' }]}>{t.noHistory}</Text>
          ) : history.map((entry) => (
            <View key={entry.id} style={styles.historyItem}>
              <View style={[styles.historyTop, { flexDirection: rtl ? 'row-reverse' : 'row' }]}>
                <Text style={styles.historyStatus}>{trustedBookingSource ? t[entry.status] : t.unknown}</Text>
                <Text style={styles.historyDate}>{entry.dateLabel}</Text>
              </View>
              {entry.note ? <Text style={[styles.historyNote, { textAlign: rtl ? 'right' : 'left' }]}>{entry.note}</Text> : null}
            </View>
          ))}
        </View>

        <View style={styles.policyBox}>
          <Text style={[styles.policyText, { textAlign: rtl ? 'right' : 'left' }]}>{t.commissionRule}</Text>
          <Text style={[styles.policyText, { textAlign: rtl ? 'right' : 'left' }]}>{t.ownerCancel}</Text>
          <Text style={[styles.policyText, { textAlign: rtl ? 'right' : 'left' }]}>{t.manual}</Text>
        </View>
      </ScrollView>

      {onBack ? (
        <Pressable accessibilityRole="button" onPress={onBack} style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
          <Text style={styles.backButtonText}>{t.back}</Text>
        </Pressable>
      ) : null}
      <Text style={[styles.footer, { textAlign: rtl ? 'right' : 'left' }]}>{t.footer}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12, width: '100%' },
  header: { gap: 5 },
  heading: { color: '#12243A', fontSize: 22, fontWeight: '800' },
  stayTitle: { color: '#24364B', fontSize: 16, fontWeight: '800', lineHeight: 22 },
  guest: { color: '#667085', fontSize: 13 },
  notice: { backgroundColor: '#F2F6FA', borderColor: '#DCE6EF', borderRadius: 12, borderWidth: 1, gap: 6, padding: 12 },
  noticeText: { color: '#475467', fontSize: 11, lineHeight: 17 },
  content: { gap: 10, paddingBottom: 4 },
  card: { backgroundColor: '#FFFFFF', borderColor: '#E5EAF0', borderRadius: 14, borderWidth: 1, gap: 11, padding: 13 },
  sectionTitle: { color: '#12243A', fontSize: 14, fontWeight: '800' },
  infoRow: { alignItems: 'center', gap: 10, justifyContent: 'space-between' },
  infoLabel: { color: '#667085', flex: 1, fontSize: 12 },
  infoValue: { color: '#344054', flex: 1, fontSize: 12, fontWeight: '600' },
  commissionBox: { backgroundColor: '#F5F8FA', borderColor: '#E5EAF0', borderRadius: 11, borderWidth: 1, gap: 6, marginTop: 2, padding: 11 },
  commissionTitle: { color: '#24364B', fontSize: 12, fontWeight: '800' },
  commissionText: { color: '#475467', fontSize: 12, lineHeight: 19 },
  historyItem: { borderBottomColor: '#EEF1F4', borderBottomWidth: 1, gap: 5, paddingBottom: 10 },
  historyTop: { alignItems: 'center', gap: 8, justifyContent: 'space-between' },
  historyStatus: { color: '#344054', fontSize: 12, fontWeight: '700' },
  historyDate: { color: '#667085', fontSize: 11 },
  historyNote: { color: '#667085', fontSize: 12, lineHeight: 18 },
  muted: { color: '#667085', fontSize: 12, lineHeight: 19 },
  policyBox: { backgroundColor: '#F8FAFC', borderColor: '#E5EAF0', borderRadius: 12, borderWidth: 1, gap: 7, padding: 12 },
  policyText: { color: '#475467', fontSize: 11, lineHeight: 18 },
  backButton: { alignItems: 'center', backgroundColor: '#12345A', borderRadius: 10, justifyContent: 'center', minHeight: 44, paddingHorizontal: 12 },
  backButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  footer: { color: '#667085', fontSize: 11, lineHeight: 17 },
  pressed: { opacity: 0.78 },
});
