// ─── Reference Point ─────────────────────────────────────────────────────────
// Sidi Bishr El Tram, Alexandria — geocoded via Geoapify once and hardcoded
export const REFERENCE_POINT = { lat: 31.2699, lng: 30.0008 }

// ─── Alexandria fee config ────────────────────────────────────────────────────
export const MIN_FEE = 30
export const MAX_FEE = 80
// Approx straight-line distance from Sidi Bishr El Tram to Mansheya (western end)
export const MAX_ALEX_DISTANCE_KM = 12

// ─── Fallback fee when location can't be confirmed ───────────────────────────
export const DEFAULT_DELIVERY_FEE = 50

// ─── Governorate fee table ────────────────────────────────────────────────────
// Keys match Geoapify's `state` field for Egyptian addresses.
// TODO: verify exact values with operations team — placeholder tiers used.
export const GOVERNORATE_FEES: Record<string, number> = {
  // Delta / near Alexandria — low end
  Beheira: 100,
  'Kafr el-Sheikh': 120,
  Gharbia: 120,
  Monufia: 130,
  // Greater Cairo area
  Qalyubia: 150,
  Cairo: 150,
  Giza: 150,
  // Eastern Delta
  Sharqia: 150,
  Dakahlia: 150,
  Damietta: 160,
  'Port Said': 160,
  // Canal zone
  Ismailia: 170,
  Suez: 180,
  // North Sinai
  'North Sinai': 200,
  // TODO: confirm North Sinai — remote areas may warrant higher fee
  // Mediterranean coast
  Matruh: 200,
  // Upper Egypt — mid range
  Fayoum: 180,
  'Beni Suef': 190,
  Minya: 210,
  Asyut: 230,
  Sohag: 250,
  Qena: 260,
  Luxor: 270,
  // Deep south / remote — high end
  Aswan: 280,
  'Red Sea': 280,
  'South Sinai': 300,
  'New Valley': 300,
  // TODO: add remaining governorates (Isna, Edfu, etc.) as needed
}

// ─── Types ────────────────────────────────────────────────────────────────────
export type DeliveryFeeResult = {
  fee: number
  confirmed: boolean
  note?: string
}

// ─── Haversine distance ───────────────────────────────────────────────────────
export function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371 // Earth radius km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// ─── Core fee calculation ─────────────────────────────────────────────────────
export function calculateDeliveryFee(
  lat: number,
  lng: number,
  governorate: string,
): DeliveryFeeResult {
  const gov = governorate.trim()
  const govLower = gov.toLowerCase()
  const isAlexandria =
    govLower.includes('alexandria') ||
    govLower.includes('اسكندرية') ||
    govLower.includes('إسكندرية') ||
    gov === 'Alexandria Governorate'

  const distanceKm = haversine(REFERENCE_POINT.lat, REFERENCE_POINT.lng, lat, lng)

  if (isAlexandria) {
    const raw = MIN_FEE + (MAX_FEE - MIN_FEE) * Math.min(distanceKm / MAX_ALEX_DISTANCE_KM, 1)
    const rounded = Math.round(raw / 5) * 5
    const fee = Math.min(Math.max(rounded, MIN_FEE), MAX_FEE)
    return { fee, confirmed: true }
  }

  // Outside Alexandria — try governorate lookup first
  const tableFee = GOVERNORATE_FEES[gov] ?? GOVERNORATE_FEES[gov.split(' ')[0]]
  if (tableFee !== undefined) {
    return { fee: tableFee, confirmed: true }
  }

  // Distance-based fallback for unlisted governorates
  const MAX_OUTSIDE_DISTANCE_KM = 900
  const raw = 100 + 200 * Math.min(distanceKm / MAX_OUTSIDE_DISTANCE_KM, 1)
  const rounded = Math.round(raw / 10) * 10
  const fee = Math.min(Math.max(rounded, 100), 300)
  return { fee, confirmed: true, note: 'Distance-based estimate' }
}

// ─── Unconfirmed fallback ─────────────────────────────────────────────────────
export function getDeliveryFeeEstimate(): DeliveryFeeResult {
  return {
    fee: DEFAULT_DELIVERY_FEE,
    confirmed: false,
    note: 'Estimated — confirm your location on the map for an exact fee',
  }
}
