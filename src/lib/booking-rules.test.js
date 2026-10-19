import { describe, expect, test } from 'bun:test';
import { bookingNights, requireApartment } from './booking-rules';
describe('building-first bookings', () => {
 test('apartment must belong to selected building', () => { expect(() => requireApartment('building-a', { property_id: 'building-b', status: 'available' })).toThrow(); });
 test('booked apartments cannot be selected', () => { expect(() => requireApartment('building-a', { property_id: 'building-a', status: 'booked' })).toThrow(); });
 test('available apartment in selected building can be booked', () => { expect(() => requireApartment('building-a', { property_id: 'building-a', status: 'available' })).not.toThrow(); });
 test('stay nights use selected dates', () => { expect(bookingNights('2026-10-20', '2026-10-23', '2026-10-19')).toBe(3); });
 test('departure must follow arrival', () => { expect(() => bookingNights('2026-10-20','2026-10-20','2026-10-19')).toThrow(); });
});
