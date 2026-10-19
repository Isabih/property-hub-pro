export function bookingNights(checkIn: string, checkOut: string, today = new Date().toISOString().slice(0, 10)) {
  const valid = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
  if (!valid(checkIn) || !valid(checkOut)) throw new Error("Choose valid arrival and departure dates.");
  if (checkIn < today) throw new Error("Arrival cannot be in the past.");
  const nights = (Date.parse(checkOut) - Date.parse(checkIn)) / 86400000;
  if (nights < 1) throw new Error("Departure must be after arrival.");
  return nights;
}

export function requireApartment(propertyId: string, apartment: { property_id: string; status: string } | null) {
  if (!apartment || apartment.property_id !== propertyId) throw new Error("Choose an apartment in this building.");
  if (apartment.status !== "available") throw new Error("This apartment is not available.");
}