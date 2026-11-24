/**
 * Typed, presentation-only data handoff for administrative panels.
 *
 * This module does not fetch data, authenticate or authorize an admin,
 * validate provenance, transform staging fixtures, or perform mutations.
 * Its caller must obtain sanitized, production-approved data from an
 * independently authorized backend before creating a "success" state.
 *
 * A TypeScript state is not proof that its contents are trustworthy.
 */

import type {
  AdminPanelProps,
  ImplementedAdminPanelId,
} from './adminPanelContracts';
import type { AdminPanelId } from './components/AdminNavigationShell';

/**
 * "success" means only that the parent has supplied props for rendering.
 * It does not certify their origin, safety, freshness, or authorization.
 */
export type AdminPanelDataState<K extends ImplementedAdminPanelId> =
  | {
      readonly status: 'idle';
    }
  | {
      readonly status: 'loading';
    }
  | {
      readonly status: 'error';
      /** Safe, user-facing text. Do not place raw server traces here. */
      readonly message: string;
    }
  | {
      readonly status: 'success';
      /** Must be sanitized and production-approved before being supplied. */
      readonly props: AdminPanelProps<K>;
    };

/** Each panel has its own exact props contract; absent keys mean idle/unprovided. */
export type AdminPanelDataStateMap = {
  readonly [K in ImplementedAdminPanelId]?: AdminPanelDataState<K>;
};

/**
 * Read the state for a panel without widening its props to a union of every
 * panel's props. The caller remains responsible for rendering the matching
 * component and passing the current UI language where that component needs it.
 */
export function getAdminPanelDataState<K extends ImplementedAdminPanelId>(
  states: AdminPanelDataStateMap,
  panelId: K,
): AdminPanelDataState<K> | undefined {
  return states[panelId] as AdminPanelDataState<K> | undefined;
}

/** A navigation item is not necessarily backed by an implemented panel. */
export function isImplementedAdminPanel(
  panelId: AdminPanelId,
): panelId is ImplementedAdminPanelId {
  return panelId !== 'bookings';
}

/**
 * Detail screens have separate contracts and are intentionally not accepted
 * by this top-level panel data map.
 *
 * Security boundary:
 * - Never treat this helper or a success state as authentication/authorization.
 * - Never pass staging/test records as production data.
 * - Keep secrets, identity documents, session tokens, payment credentials,
 *   private contact data, and raw internal traces out of panel props.
 * - No network access, Supabase client, persistence, or write operation exists
 *   in this module.
 */
