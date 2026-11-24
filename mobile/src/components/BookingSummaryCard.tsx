import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

export type BookingSummaryLocale = 'ar' | 'fr';

export interface BookingSummaryCardProps {
  locale?: BookingSummaryLocale;
  stayTitle: string;
  location?: string;
  checkInDate: string;
  checkOutDate: string;
  guestCount: number;
  pricePerNight: number;
  /** Additional amount paid to the host, on top of the accommodation subtotal. */
  depositAmount?: number;
  currency?: string;
  style?: StyleProp<ViewStyle>;
}

const ISO_DATE_PATTERN = /^\\d{4}-\\d{2}-\\d{2}$/;

function parseIsoDate(value: string): Date | null {
  if (!ISO_DATE_PATTERN.test(value)) return null;
  const [year, month, day] = value.split('-').map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    return null;
  }
  return parsed;
}

function getNightCount(checkIn: string, checkOut: string): number | null {
  const arrival = parseIsoDate(checkIn);
  const departure = parseIsoDate(checkOut);
  if (!arrival || !departure || departure <= arrival) return null;
  return Math.round((departure.getTime() - arrival.getTime()) / 86400000);
}

/**
 * Presentational booking summary only.
 * It calculates a preview from parent-supplied values and does not check
 * availability, create or confirm a booking, contact Supabase, or process payment.
 */
export function BookingSummaryCard({
  locale = 'ar',
  stayTitle,
  location,
  checkInDate,
  checkOutDate,
  guestCount,
  pricePerNight,
  depositAmount = 0,
  currency = 'DZD',
  style,
}: BookingSummaryCardProps) {
  const isArabic = locale === 'ar';
  const rtl = isArabic;
  const nights = getNightCount(checkInDate, checkOutDate);
  const safeGuests = Number.isFinite(guestCount)
    ? Math.max(1, Math.floor(guestCount))
    : 1;
  const safePrice = Number.isFinite(pricePerNight)
    ? Math.max(0, pricePerNight)
    : 0;
  const safeDeposit = Number.isFinite(depositAmount)
    ? Math.max(0, depositAmount)
    : 0;
  const subtotal = nights == null ? null : safePrice * nights;
  const total = subtotal == null ? null : subtotal + safeDeposit;

  const labels = isArabic
    ? {
        title: 'ملخص طلب الإقامة',
        preview: 'معاينة فقط — لم يتم تأكيد أي حجز',
        stay: 'الإقامة',
        location: 'الموقع',
        arrival: 'تاريخ الوصول',
        departure: 'تاريخ المغادرة',
        guests: 'عدد الضيوف',
        nights: 'عدد الليالي',
        perNight: 'سعر الليلة',
        subtotal: 'مجموع الإقامة',
        deposit: 'العربون الإضافي',
        total: 'المبلغ الإجمالي التقديري',
        invalidDates: 'تحقق من تاريخ الوصول والمغادرة؛ يجب أن تكون المغادرة بعد الوصول.',
        depositNote: 'العربون مبلغ إضافي فوق سعر الإقامة ويُدفع لصاحب الإقامة.',
        paymentNote: 'لا يتم الدفع أو تحصيل الأموال داخل التطبيق في هذه المرحلة.',
        availabilityNote: 'هذا الملخص لا يؤكد توفر الإقامة ولا ينشئ حجزاً.',
        notSet: 'غير محدد',
      }
    : {
        title: 'Récapitulatif du séjour',
        preview: 'Aperçu uniquement — aucune réservation confirmée',
        stay: 'Hébergement',
        location: 'Emplacement',
        arrival: 'Arrivée',
        departure: 'Départ',
        guests: 'Voyageurs',
        nights: 'Nombre de nuits',
        perNight: 'Prix par nuit',
        subtotal: 'Sous-total du séjour',
        deposit: 'Acompte supplémentaire',
        total: 'Montant total estimé',
        invalidDates: 'Vérifiez les dates : le départ doit être après l’arrivée.',
        depositNote: 'L’acompte s’ajoute au prix du séjour et est versé à l’hôte.',
        paymentNote: 'Aucun paiement ni encaissement n’est effectué dans l’application à ce stade.',
        availabilityNote: 'Ce récapitulatif ne confirme pas la disponibilité et ne crée aucune réservation.',
        notSet: 'Non renseigné',
      };

  const formatDate = (value: string) => {
    const parsed = parseIsoDate(value);
    if (!parsed) return labels.notSet;
    return new Intl.DateTimeFormat(isArabic ? 'ar-DZ' : 'fr-DZ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC',
    }).format(parsed);
  };

  const formatPrice = (value: number) =>
    `${new Intl.NumberFormat(isArabic ? 'ar-DZ' : 'fr-DZ', {
      maximumFractionDigits: 0,
    }).format(value)} ${currency}`;

  const row = (label: string, value: string, strong = false) => (
    <View style={[styles.row, { flexDirection: rtl ? 'row-reverse' : 'row' }]}>
      <Text style={[styles.rowLabel, { textAlign: rtl ? 'right' : 'left' }]}>
        {label}
      </Text>
      <Text
        style={[
          styles.rowValue,
          strong ? styles.strongValue : null,
          { textAlign: rtl ? 'left' : 'right' },
        ]}
      >
        {value}
      </Text>
    </View>
  );

  return (
    <View style={[styles.card, style]}>
      <View style={styles.previewBanner}>
        <Text style={[styles.previewText, { textAlign: rtl ? 'right' : 'left' }]}>
          {labels.preview}
        </Text>
      </View>

      <View style={styles.content}>
        <Text
          accessibilityRole="header"
          style={[styles.heading, { textAlign: rtl ? 'right' : 'left' }]}
        >
          {labels.title}
        </Text>

        <View style={styles.stayBlock}>
          <Text style={[styles.stayLabel, { textAlign: rtl ? 'right' : 'left' }]}>
            {labels.stay}
          </Text>
          <Text style={[styles.stayTitle, { textAlign: rtl ? 'right' : 'left' }]}>
            {stayTitle}
          </Text>
          {location?.trim() ? (
            <Text style={[styles.location, { textAlign: rtl ? 'right' : 'left' }]}>
              {labels.location}: {location}
            </Text>
          ) : null}
        </View>

        <View style={styles.details}>
          {row(labels.arrival, formatDate(checkInDate))}
          {row(labels.departure, formatDate(checkOutDate))}
          {row(labels.guests, String(safeGuests))}
          {row(labels.nights, nights == null ? '—' : String(nights))}
        </View>

        {nights == null ? (
          <Text accessibilityRole="alert" style={[styles.error, { textAlign: rtl ? 'right' : 'left' }]}>
            {labels.invalidDates}
          </Text>
        ) : (
          <View style={styles.priceDetails}>
            {row(labels.perNight, formatPrice(safePrice))}
            {row(labels.subtotal, formatPrice(subtotal ?? 0))}
            {row(labels.deposit, formatPrice(safeDeposit))}
            <View style={styles.totalPanel}>
              <View style={[styles.totalRow, { flexDirection: rtl ? 'row-reverse' : 'row' }]}>
                <Text style={[styles.totalLabel, { textAlign: rtl ? 'right' : 'left' }]}>
                  {labels.total}
                </Text>
                <Text style={styles.totalValue}>{formatPrice(total ?? 0)}</Text>
              </View>
            </View>
          </View>
        )}

        <Text style={[styles.note, { textAlign: rtl ? 'right' : 'left' }]}>
          {labels.depositNote}
        </Text>
        <Text style={[styles.note, { textAlign: rtl ? 'right' : 'left' }]}>
          {labels.paymentNote}
        </Text>
        <Text style={[styles.footerNote, { textAlign: rtl ? 'right' : 'left' }]}>
          {labels.availabilityNote}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E3E8EF',
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
  },
  previewBanner: {
    paddingHorizontal: 14,
    paddingVertical: 11,
    backgroundColor: '#FFF7E6',
  },
  previewText: {
    color: '#754C12',
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '700',
  },
  content: {
    gap: 14,
    padding: 16,
  },
  heading: {
    color: '#102A43',
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '700',
  },
  stayBlock: {
    gap: 4,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F5F8FA',
  },
  stayLabel: {
    color: '#627D98',
    fontSize: 11,
  },
  stayTitle: {
    color: '#102A43',
    fontSize: 16,
    fontWeight: '700',
  },
  location: {
    color: '#627D98',
    fontSize: 12,
  },
  details: {
    gap: 11,
  },
  priceDetails: {
    gap: 11,
  },
  row: {
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  rowLabel: {
    flex: 1,
    color: '#627D98',
    fontSize: 13,
  },
  rowValue: {
    flex: 1,
    color: '#334E68',
    fontSize: 13,
    fontWeight: '600',
  },
  strongValue: {
    color: '#075E59',
    fontWeight: '700',
  },
  totalPanel: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#F0F7F7',
  },
  totalRow: {
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  totalLabel: {
    flex: 1,
    color: '#075E59',
    fontSize: 13,
    fontWeight: '700',
  },
  totalValue: {
    color: '#075E59',
    fontSize: 18,
    fontWeight: '800',
  },
  error: {
    color: '#B42318',
    fontSize: 12,
    lineHeight: 19,
  },
  note: {
    color: '#486581',
    fontSize: 11,
    lineHeight: 18,
  },
  footerNote: {
    color: '#829AB1',
    fontSize: 10,
    lineHeight: 16,
  },
});
