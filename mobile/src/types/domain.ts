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

/** Maps only to bookings.refund_status. Do not use for cancellation refund fields. */
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

export type CancellationRequesterRole = 'traveler' | 'owner';

export type CancellationReasonCategory =
  | 'traveler_change'
  | 'medical_emergency'
  | 'family_emergency'
  | 'force_majeure'
  | 'owner_cancellation'
  | 'water_unavailable'
  | 'electricity_unavailable'
  | 'gas_unavailable'
  | 'missing_furniture'
  | 'location_mismatch'
  | 'property_mismatch'
  | 'description_mismatch'
  | 'other';

export type OwnerResponseState =
  | 'not_required'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'timeout';

export type CancellationRefundEligibility =
  | 'pending'
  | 'eligible'
  | 'not_eligible'
  | 'admin_review';

export type CancellationRefundExecutionStatus =
  | 'not_started'
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed';

export type CancellationRequestStatus =
  | 'submitted'
  | 'owner_review'
  | 'admin_review'
  | 'approved'
  | 'rejected'
  | 'completed';

export interface BookingCancellationRecord {
  id: UUID;
  booking_id: UUID;
  requester_id: UUID;
  requester_role: CancellationRequesterRole;
  reason_category: CancellationReasonCategory;
  reason_details: string;
  evidence_paths: string[];
  owner_response: OwnerResponseState;
  owner_response_due_at: ISODateTime | null;
  refund_eligibility: CancellationRefundEligibility;
  refund_amount: number | null;
  refund_execution_status: CancellationRefundExecutionStatus;
  refund_proof_path: string | null;
  reviewed_by: UUID | null;
  reviewed_at: ISODateTime | null;
  review_notes: string | null;
  refunded_at: ISODateTime | null;
  created_at: ISODateTime;
  updated_at: ISODateTime;
  request_status: CancellationRequestStatus;
}

export type CancellationHistoryActorRole =
  | 'traveler'
  | 'owner'
  | 'admin'
  | 'system';

export interface BookingCancellationHistoryRecord {
  id: UUID;
  cancellation_id: UUID;
  actor_id: UUID | null;
  actor_role: CancellationHistoryActorRole;
  action: string;
  previous_state: Record<string, unknown> | null;
  new_state: Record<string, unknown> | null;
  notes: string | null;
  created_at: ISODateTime;
}

export interface ReviewRecord {
  id: UUID;
  booking_id: UUID;
  traveler_id: UUID;
  property_id: UUID;
  rating: number;
  comment: string | null;
  created_at: ISODateTime;
  is_test: boolean;
}

export type LocalBusinessCategory =
  | 'restaurant'
  | 'fast_food'
  | 'cafe'
  | 'sweets'
  | 'grocery'
  | 'shop'
  | 'pharmacy'
  | 'services'
  | 'crafts'
  | 'home_cleaning'
  | 'home_services'
  | 'professional_services'
  | 'maintenance'
  | 'beauty'
  | 'transport'
  | 'other';

export type LocalBusinessStatus = 'pending' | 'approved' | 'rejected';

export interface LocalBusinessRecord {
  id: UUID;
  owner_id: UUID;
  name: string;
  category: LocalBusinessCategory;
  description: string | null;
  phone: string | null;
  address: string;
  google_maps_url: string | null;
  status: LocalBusinessStatus;
  rejection_reason: string | null;
  created_at: ISODateTime;
  updated_at: ISODateTime;
}

export interface LocalBusinessImageRecord {
  id: UUID;
  business_id: UUID;
  image_url: string;
  created_at: ISODateTime;
}

export type ComplaintStatus =
  | 'open'
  | 'in_progress'
  | 'resolved'
  | 'closed';

export interface ComplaintRecord {
  id: UUID;
  user_id: UUID;
  property_id: UUID | null;
  booking_id: UUID | null;
  subject: string;
  message: string;
  status: ComplaintStatus;
  created_at: ISODateTime;
}

export type VerificationStatus = 'pending' | 'approved' | 'rejected';

export interface OwnerVerificationRecord {
  id: UUID;
  owner_id: UUID;
  document_path: string;
  status: VerificationStatus;
  reviewed_by: UUID | null;
  reviewed_at: ISODateTime | null;
  created_at: ISODateTime;
  expires_at: ISODate | null;
}

export interface PropertyVerificationRecord {
  id: UUID;
  property_id: UUID;
  document_path: string;
  status: VerificationStatus;
  reviewed_by: UUID | null;
  reviewed_at: ISODateTime | null;
  created_at: ISODateTime;
  expires_at: ISODate | null;
}

export interface FavoriteRecord {
  traveler_id: UUID;
  property_id: UUID;
  created_at: ISODateTime;
}

export interface AdminLogRecord {
  id: UUID;
  admin_id: UUID | null;
  action: string;
  target_table: string | null;
  target_id: UUID | null;
  details: Record<string, unknown> | null;
  created_at: ISODateTime;
}

export interface PlatformAdminRecord {
  user_id: UUID;
  is_main_admin: true;
  created_at: ISODateTime;
}

export interface PropertyPublicBookingDateRecord {
  property_id: UUID;
  check_in: ISODate;
  check_out: ISODate;
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
