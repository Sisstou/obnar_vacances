/**
 * App-facing types based on a read-only inspection of the current public schema.
 *
 * This is intentionally not wired into createClient yet: src/lib/supabase.ts is
 * outside the approved change scope. Reconcile this file with generated
 * Supabase Database types before adding database query services.
 */

export type UUID = string;
export type ISODate = string; // PostgreSQL date: YYYY-MM-DD
export type ISODateTime = string; // PostgreSQL timestamptz: ISO-8601

export type UserRole = 'traveler' | 'owner';
export type RequestedAccountType =
  | 'traveler'
  | 'owner'
  | 'activity_provider';
export type PreferredLanguage = 'ar' | 'fr';

export type PropertyStatus =
  | 'draft'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'suspended';

export type BookingStatus =
  | 'pending'
  | 'awaiting_admin_approval'
  | 'awaiting_payment'
  | 'confirmed'
  | 'cancelled'
  | 'completed'
  | 'rejected';

export type PaymentStatus =
  | 'unpaid'
  | 'receipt_submitted'
  | 'verified'
  | 'rejected';

export type RefundStatus =
  | 'not_applicable'
  | 'pending'
  | 'refunded'
  | 'not_refunded';

export interface ProfileRecord {
  id: UUID;
  full_name: string;
  phone: string | null;
  role: UserRole;
  preferred_language: PreferredLanguage;
  avatar_url: string | null;
  created_at: ISODateTime;
  requested_account_type: RequestedAccountType;
}

export interface LocationRecord {
  id: UUID;
  name_ar: string;
  name_fr: string;
  parent_id: UUID | null;
  created_at: ISODateTime;
}

export interface AmenityRecord {
  id: UUID;
  name_ar: string;
  name_fr: string;
}

export interface PropertyRecord {
  id: UUID;
  owner_id: UUID;
  location_id: UUID | null;
  title_ar: string;
  title_fr: string;
  description_ar: string | null;
  description_fr: string | null;
  address: string | null;
  property_type: string;
  bedrooms: number;
  bathrooms: number;
  capacity: number;
  price_per_night: number;
  currency: string;
  status: PropertyStatus;
  created_at: ISODateTime;
  updated_at: ISODateTime;
  google_maps_url: string | null;
}

export interface PropertyImageRecord {
  id: UUID;
  property_id: UUID;
  storage_path: string;
  is_cover: boolean;
  display_order: number;
  created_at: ISODateTime;
}

export interface PropertyAmenityRecord {
  property_id: UUID;
  amenity_id: UUID;
}

export interface PropertyCardRecord extends PropertyRecord {
  location: LocationRecord | null;
  images: PropertyImageRecord[];
  amenities: AmenityRecord[];
}

export interface BookingRecord {
  id: UUID;
  property_id: UUID;
  traveler_id: UUID;
  check_in: ISODate;
  check_out: ISODate;
  guests: number;
  total_price: number;
  status: BookingStatus;
  created_at: ISODateTime;
  deposit_amount: number | null;
  payment_receipt_path: string | null;
  payment_status: PaymentStatus;
  receipt_uploaded_at: ISODateTime | null;
  payment_verified_at: ISODateTime | null;
  cancellation_reason: string | null;
  cancelled_at: ISODateTime | null;
  refund_status: RefundStatus;
  payment_due_at: ISODateTime | null;
  payment_rejection_reason: string | null;
  payment_reviewed_at: ISODateTime | null;
  payment_reviewed_by: UUID | null;
  owner_price_per_night: number | null;
  platform_commission_per_night: number | null;
  final_price_per_night: number | null;
  is_test: boolean;
}

export interface NotificationRecord {
  id: UUID;
  user_id: UUID;
  event_type: string;
  title: string;
  message: string;
  entity_type: string | null;
  entity_id: UUID | null;
  is_read: boolean;
  created_at: ISODateTime;
  read_at: ISODateTime | null;
  is_test: boolean;
}

/**
 * Public discovery must remain disabled for the current staging catalogue.
 * The properties table has no is_test column, so status='approved' alone
 * cannot distinguish staging fixtures from real inventory.
 */
export interface PublicCataloguePolicy {
  enabled: boolean;
  source: 'disabled' | 'verified-production-catalogue';
}
