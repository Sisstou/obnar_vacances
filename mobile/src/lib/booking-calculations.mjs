/**
 * Pure calculations shared by presentational components and Node unit tests.
 * Invalid or unsafe values fail closed by returning null.
 */

/**
 * @param {number} pricePerNight
 * @param {number} nights
 * @param {number} depositAmount
 */
export function calculateStayPrice(pricePerNight, nights, depositAmount = 0) {
  if (
    !Number.isFinite(pricePerNight) || pricePerNight < 0 ||
    !Number.isSafeInteger(nights) || nights < 0 ||
    !Number.isFinite(depositAmount) || depositAmount < 0
  ) return null;

  const accommodationSubtotal = pricePerNight * nights;
  const total = accommodationSubtotal + depositAmount;
  if (
    !Number.isFinite(accommodationSubtotal) ||
    !Number.isFinite(total) ||
    accommodationSubtotal > Number.MAX_SAFE_INTEGER ||
    total > Number.MAX_SAFE_INTEGER
  ) return null;

  return { pricePerNight, nights, depositAmount, accommodationSubtotal, total };
}

/**
 * Calculates commission only for full nights covered by a retained no-show deposit.
 * @param {number} bookingNights
 * @param {number} retainedDepositNights
 * @param {number} [ratePerNight]
 */
export function calculateRetainedDepositCommission(
  bookingNights,
  retainedDepositNights,
  ratePerNight = 500,
) {
  if (
    !Number.isSafeInteger(bookingNights) || bookingNights < 1 ||
    !Number.isSafeInteger(retainedDepositNights) || retainedDepositNights < 1 ||
    retainedDepositNights > bookingNights ||
    !Number.isSafeInteger(ratePerNight) || ratePerNight < 1
  ) return null;

  const commission = retainedDepositNights * ratePerNight;
  return Number.isSafeInteger(commission) ? commission : null;
}

/**
 * @param {string} displayName
 * @param {string} [providedInitials]
 */
export function getDisplayInitials(displayName, providedInitials) {
  const explicit = providedInitials?.trim();
  if (explicit) return explicit;

  return displayName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase();
}
