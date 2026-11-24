export interface StayPriceBreakdown {
  pricePerNight: number;
  nights: number;
  depositAmount: number;
  accommodationSubtotal: number;
  total: number;
}

export function calculateStayPrice(
  pricePerNight: number,
  nights: number,
  depositAmount?: number,
): StayPriceBreakdown | null;

export function calculateRetainedDepositCommission(
  bookingNights: number,
  retainedDepositNights: number,
  ratePerNight?: number,
): number | null;

export function getDisplayInitials(
  displayName: string,
  providedInitials?: string,
): string;
