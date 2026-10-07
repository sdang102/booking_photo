/**
 * Backwards-compatible service barrel. New code may import the focused
 * read/write/revenue/availability modules directly; existing imports stay
 * valid while the service split is rolled out incrementally.
 */
export * from './bookingReadService';
export * from './bookingWriteService';
export * from './bookingRevenueService';
export * from './availabilityService';
export { getLocalBookings } from './bookingShared';
