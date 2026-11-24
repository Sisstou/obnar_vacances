import React from 'react';
import { calculateStayPrice } from '../lib/booking-calculations.mjs';
import {
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

export type StayPriceLocale = 'ar' | 'fr';

export interface StayPriceCardProps {
  locale?: StayPriceLocale;
  pricePerNight: number;
  nights: number;
  /** Deposit amount added on top of the accommodation price and paid to the host. */
  depositAmount?: number;
  currency?: string;
  /** Optional label for the booking period, supplied by the parent. */
  periodLabel?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * Presentational-only price breakdown.
 * The deposit is an additional amount on top of the accommodation subtotal
 * and is payable to the host. No payment, booking, or persistence is performed.
 * All monetary values and the night count must come from the parent.
 */
export function StayPriceCard({
  locale = 'ar',
  pricePerNight,
  nights,
  depositAmount = 0,
  currency = 'DZD',
  periodLabel,
  style,
}: StayPriceCardProps) {
  const isArabic = locale === 'ar';
  const rtl = isArabic;

  const priceBreakdown = calculateStayPrice(pricePerNight, nights, depositAmount);

  const formatPrice = (value: number | null | undefined) =>
    value === null || value === undefined
      ? '—'
      : `${new Intl.NumberFormat(isArabic ? 'ar-DZ' : 'fr-DZ', {
          maximumFractionDigits: 0,
        }).format(value)} ${currency}`;

  const labels = isArabic
    ? {
        title: 'تفاصيل السعر والعربون',
        perNight: 'سعر الليلة',
        nights: 'عدد الليالي',
        accommodation: 'مجموع الإقامة',
        deposit: 'العربون الإضافي',
        total: 'المبلغ الإجمالي',
        depositNote: 'العربون مبلغ إضافي فوق سعر الإقامة، ويُدفع لصاحب الإقامة.',
        noDeposit: 'لا يوجد عربون محدد',
        notice: 'هذه معاينة لحساب السعر فقط. لا يتم تحصيل أي مبلغ أو تنفيذ الدفع داخل التطبيق.',
        period: 'الفترة',
      }
    : {
        title: 'Prix et acompte',
        perNight: 'Prix par nuit',
        nights: 'Nombre de nuits',
        accommodation: 'Sous-total du séjour',
        deposit: 'Acompte supplémentaire',
        total: 'Montant total',
        depositNote: 'L’acompte s’ajoute au prix du séjour et est versé à l’hôte.',
        noDeposit: 'Aucun acompte indiqué',
        notice: 'Aperçu du calcul uniquement. Aucun montant n’est encaissé et aucun paiement n’est effectué dans l’application.',
        period: 'Période',
      };

  const detailRow = (
    label: string,
    value: string,
    emphasized = false,
  ) => (
    <View style={[styles.detailRow, { flexDirection: rtl ? 'row-reverse' : 'row' }]}>
      <Text style={[styles.detailLabel, { textAlign: rtl ? 'right' : 'left' }]}>
        {label}
      </Text>
      <Text
        style={[
          styles.detailValue,
          emphasized ? styles.emphasizedValue : null,
          { textAlign: rtl ? 'left' : 'right' },
        ]}
      >
        {value}
      </Text>
    </View>
  );

  return (
    <View style={[styles.card, style]}>
      <Text
        accessibilityRole="header"
        style={[styles.heading, { textAlign: rtl ? 'right' : 'left' }]}
      >
        {labels.title}
      </Text>

      {periodLabel?.trim() ? (
        <Text style={[styles.period, { textAlign: rtl ? 'right' : 'left' }]}>
          {labels.period}: {periodLabel}
        </Text>
      ) : null}

      <View style={styles.breakdown}>
        {detailRow(labels.perNight, formatPrice(priceBreakdown?.pricePerNight))}
        {detailRow(labels.nights, String(priceBreakdown?.nights ?? '—'))}
        {detailRow(labels.accommodation, formatPrice(priceBreakdown?.accommodationSubtotal))}
        {detailRow(
          labels.deposit,
          priceBreakdown ? (priceBreakdown.depositAmount > 0 ? formatPrice(priceBreakdown.depositAmount) : labels.noDeposit) : '—',
        )}
      </View>

      <View style={styles.totalPanel}>
        <View style={[styles.totalRow, { flexDirection: rtl ? 'row-reverse' : 'row' }]}>
          <Text style={[styles.totalLabel, { textAlign: rtl ? 'right' : 'left' }]}>
            {labels.total}
          </Text>
          <Text style={styles.totalValue}>{formatPrice(priceBreakdown?.total)}</Text>
        </View>
      </View>

      <Text style={[styles.depositNote, { textAlign: rtl ? 'right' : 'left' }]}>
        {labels.depositNote}
      </Text>
      <Text style={[styles.notice, { textAlign: rtl ? 'right' : 'left' }]}>
        {labels.notice}
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
  period: {
    color: '#627D98',
    fontSize: 12,
  },
  breakdown: {
    gap: 11,
  },
  detailRow: {
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  detailLabel: {
    flex: 1,
    color: '#627D98',
    fontSize: 13,
  },
  detailValue: {
    flex: 1,
    color: '#334E68',
    fontSize: 13,
    fontWeight: '600',
  },
  emphasizedValue: {
    color: '#075E59',
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
    fontSize: 14,
    fontWeight: '700',
  },
  totalValue: {
    color: '#075E59',
    fontSize: 19,
    fontWeight: '800',
  },
  depositNote: {
    color: '#486581',
    fontSize: 12,
    lineHeight: 19,
  },
  notice: {
    color: '#829AB1',
    fontSize: 10,
    lineHeight: 16,
  },
});
