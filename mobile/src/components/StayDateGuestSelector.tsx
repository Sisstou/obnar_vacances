import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

export type StayDateGuestLocale = 'ar' | 'fr';

export interface StayDateGuestSelectorProps {
  locale?: StayDateGuestLocale;
  /** ISO calendar date: YYYY-MM-DD. Controlled by the parent. */
  checkInDate: string;
  /** ISO calendar date: YYYY-MM-DD. Controlled by the parent. */
  checkOutDate: string;
  /** Controlled guest count. */
  guestCount: number;
  onCheckInDateChange: (date: string) => void;
  onCheckOutDateChange: (date: string) => void;
  onGuestCountChange: (count: number) => void;
  minGuests?: number;
  maxGuests?: number;
  /** Optional ISO date; dates before it are rejected. */
  minDate?: string;
  style?: StyleProp<ViewStyle>;
}

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function parseIsoDate(value: string): Date | null {
  if (!ISO_DATE_PATTERN.test(value)) return null;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return date;
}

function countNights(checkInDate: string, checkOutDate: string): number | null {
  const checkIn = parseIsoDate(checkInDate);
  const checkOut = parseIsoDate(checkOutDate);
  if (!checkIn || !checkOut || checkOut <= checkIn) return null;
  return Math.round((checkOut.getTime() - checkIn.getTime()) / 86400000);
}

/**
 * Controlled date and guest selector.
 * Date fields accept YYYY-MM-DD; the parent owns state and persistence.
 * This component only validates dates and calculates the number of nights.
 * It does not check availability or create a booking.
 */
export function StayDateGuestSelector({
  locale = 'ar',
  checkInDate,
  checkOutDate,
  guestCount,
  onCheckInDateChange,
  onCheckOutDateChange,
  onGuestCountChange,
  minGuests = 1,
  maxGuests = 20,
  minDate,
  style,
}: StayDateGuestSelectorProps) {
  const isArabic = locale === 'ar';
  const rtl = isArabic;
  const nights = countNights(checkInDate, checkOutDate);
  const safeMinGuests = Math.max(1, Math.floor(minGuests));
  const safeMaxGuests = Math.max(safeMinGuests, Math.floor(maxGuests));
  const safeGuestCount = Math.min(
    safeMaxGuests,
    Math.max(safeMinGuests, Math.floor(Number.isFinite(guestCount) ? guestCount : safeMinGuests)),
  );

  const labels = isArabic
    ? {
        title: 'موعد الإقامة والضيوف',
        arrival: 'تاريخ الوصول',
        departure: 'تاريخ المغادرة',
        dateHint: 'السنة-الشهر-اليوم',
        guests: 'عدد الضيوف',
        decrease: 'تقليل عدد الضيوف',
        increase: 'زيادة عدد الضيوف',
        nights: 'عدد الليالي',
        invalid: 'أدخل تاريخاً صحيحاً بصيغة السنة-الشهر-اليوم.',
        order: 'يجب أن يكون تاريخ المغادرة بعد تاريخ الوصول.',
        beforeMin: 'تاريخ الوصول يسبق أول تاريخ متاح للاختيار.',
        availability: 'اختيار التواريخ لا يؤكد توفر الإقامة. يتم التحقق من التوفر في خطوة لاحقة.',
      }
    : {
        title: 'Dates du séjour et voyageurs',
        arrival: 'Arrivée',
        departure: 'Départ',
        dateHint: 'AAAA-MM-JJ',
        guests: 'Nombre de voyageurs',
        decrease: 'Diminuer le nombre de voyageurs',
        increase: 'Augmenter le nombre de voyageurs',
        nights: 'Nombre de nuits',
        invalid: 'Saisissez une date valide au format AAAA-MM-JJ.',
        order: 'La date de départ doit être après la date d’arrivée.',
        beforeMin: 'La date d’arrivée est antérieure à la première date autorisée.',
        availability: 'La sélection des dates ne confirme pas la disponibilité. Celle-ci sera vérifiée à une étape ultérieure.',
      };

  const checkInParsed = parseIsoDate(checkInDate);
  const checkOutParsed = parseIsoDate(checkOutDate);
  const minParsed = minDate ? parseIsoDate(minDate) : null;
  const arrivalBeforeMin = Boolean(checkInParsed && minParsed && checkInParsed < minParsed);
  const invalidOrder = Boolean(checkInParsed && checkOutParsed && checkOutParsed <= checkInParsed);
  const hasInvalidDate =
    (checkInDate.length > 0 && !checkInParsed) ||
    (checkOutDate.length > 0 && !checkOutParsed);
  const showDateError = hasInvalidDate || invalidOrder || arrivalBeforeMin;

  const changeDate = (
    value: string,
    callback: (date: string) => void,
  ) => {
    const normalized = value.replace(/[^0-9-]/g, '').slice(0, 10);
    callback(normalized);
  };

  return (
    <View style={[styles.card, style]}>
      <Text
        accessibilityRole="header"
        style={[styles.heading, { textAlign: rtl ? 'right' : 'left' }]}
      >
        {labels.title}
      </Text>

      <View style={styles.dateFields}>
        <View style={styles.field}>
          <Text style={[styles.label, { textAlign: rtl ? 'right' : 'left' }]}>
            {labels.arrival}
          </Text>
          <TextInput
            accessibilityLabel={labels.arrival}
            accessibilityHint={labels.dateHint}
            value={checkInDate}
            onChangeText={(value) => changeDate(value, onCheckInDateChange)}
            placeholder={labels.dateHint}
            placeholderTextColor="#829AB1"
            keyboardType="numbers-and-punctuation"
            maxLength={10}
            autoCapitalize="none"
            style={[styles.input, { textAlign: rtl ? 'right' : 'left' }]}
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { textAlign: rtl ? 'right' : 'left' }]}>
            {labels.departure}
          </Text>
          <TextInput
            accessibilityLabel={labels.departure}
            accessibilityHint={labels.dateHint}
            value={checkOutDate}
            onChangeText={(value) => changeDate(value, onCheckOutDateChange)}
            placeholder={labels.dateHint}
            placeholderTextColor="#829AB1"
            keyboardType="numbers-and-punctuation"
            maxLength={10}
            autoCapitalize="none"
            style={[styles.input, { textAlign: rtl ? 'right' : 'left' }]}
          />
        </View>
      </View>

      {showDateError ? (
        <Text accessibilityRole="alert" style={[styles.error, { textAlign: rtl ? 'right' : 'left' }]}>
          {hasInvalidDate
            ? labels.invalid
            : arrivalBeforeMin
              ? labels.beforeMin
              : labels.order}
        </Text>
      ) : null}

      <View style={[styles.guestRow, { flexDirection: rtl ? 'row-reverse' : 'row' }]}>
        <Text style={[styles.label, styles.guestLabel, { textAlign: rtl ? 'right' : 'left' }]}>
          {labels.guests}
        </Text>
        <View style={styles.stepper}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={labels.decrease}
            disabled={safeGuestCount <= safeMinGuests}
            onPress={() => onGuestCountChange(Math.max(safeMinGuests, safeGuestCount - 1))}
            style={({ pressed }) => [
              styles.stepButton,
              safeGuestCount <= safeMinGuests ? styles.disabledButton : null,
              pressed ? styles.pressedButton : null,
            ]}
          >
            <Text style={styles.stepButtonText}>−</Text>
          </Pressable>
          <Text accessibilityLiveRegion="polite" style={styles.guestCount}>
            {safeGuestCount}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={labels.increase}
            disabled={safeGuestCount >= safeMaxGuests}
            onPress={() => onGuestCountChange(Math.min(safeMaxGuests, safeGuestCount + 1))}
            style={({ pressed }) => [
              styles.stepButton,
              safeGuestCount >= safeMaxGuests ? styles.disabledButton : null,
              pressed ? styles.pressedButton : null,
            ]}
          >
            <Text style={styles.stepButtonText}>+</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.nightsPanel}>
        <Text style={[styles.nightsLabel, { textAlign: rtl ? 'right' : 'left' }]}>
          {labels.nights}
        </Text>
        <Text style={styles.nightsValue}>
          {nights == null ? '—' : String(nights)}
        </Text>
      </View>

      <Text style={[styles.note, { textAlign: rtl ? 'right' : 'left' }]}>
        {labels.availability}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 14,
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
  dateFields: {
    gap: 12,
  },
  field: {
    gap: 6,
  },
  label: {
    color: '#486581',
    fontSize: 13,
    fontWeight: '600',
  },
  input: {
    minHeight: 46,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    color: '#243B53',
    fontSize: 14,
    backgroundColor: '#FFFFFF',
  },
  error: {
    color: '#B42318',
    fontSize: 12,
    lineHeight: 18,
  },
  guestRow: {
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  guestLabel: {
    flex: 1,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    backgroundColor: '#F5F8FA',
  },
  disabledButton: {
    opacity: 0.4,
  },
  pressedButton: {
    backgroundColor: '#E6EEF5',
  },
  stepButtonText: {
    color: '#163A5F',
    fontSize: 23,
    fontWeight: '600',
  },
  guestCount: {
    minWidth: 24,
    color: '#102A43',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  nightsPanel: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 13,
    borderRadius: 12,
    backgroundColor: '#F0F7F7',
  },
  nightsLabel: {
    flex: 1,
    color: '#075E59',
    fontSize: 13,
    fontWeight: '700',
  },
  nightsValue: {
    color: '#075E59',
    fontSize: 19,
    fontWeight: '800',
  },
  note: {
    color: '#829AB1',
    fontSize: 10,
    lineHeight: 16,
  },
});
