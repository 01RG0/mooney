// ─── Reference Point ─────────────────────────────────────────────────────────
// Mohammed Nageeb station, Alexandria — closest delivery origin (30 EGP base fee)
export const REFERENCE_POINT = { lat: 31.2006, lng: 29.9054 }

// ─── Alexandria fee config ────────────────────────────────────────────────────
export const MIN_FEE = 30
export const MAX_FEE = 100
// Approx straight-line distance from Mohammed Nageeb to farthest Alexandria point (Montaza/Abou Qir direction)
export const MAX_ALEX_DISTANCE_KM = 20

// ─── Fallback fee when location can't be confirmed ───────────────────────────
export const DEFAULT_DELIVERY_FEE = 50

// ─── Governorate fee table ────────────────────────────────────────────────────
// Keys match Geoapify's `state` field for Egyptian addresses.
export const GOVERNORATE_FEES: Record<string, number> = {
  // Delta / near Alexandria — low end
  Beheira: 150,
  'Kafr el-Sheikh': 170,
  Gharbia: 170,
  Monufia: 180,
  // Greater Cairo area
  Qalyubia: 200,
  Cairo: 200,
  Giza: 200,
  // Eastern Delta
  Sharqia: 200,
  Dakahlia: 200,
  Damietta: 210,
  'Port Said': 210,
  // Canal zone
  Ismailia: 220,
  Suez: 230,
  // Mediterranean coast
  Matruh: 250,
  // North Sinai
  'North Sinai': 250,
  // Upper Egypt — mid range
  Fayoum: 230,
  'Beni Suef': 240,
  Minya: 260,
  Asyut: 270,
  Sohag: 280,
  Qena: 290,
  Luxor: 300,
  // Deep south / remote — high end
  Aswan: 320,
  'Red Sea': 320,
  'South Sinai': 340,
  'New Valley': 350,
}

// ─── Types ────────────────────────────────────────────────────────────────────
export type DeliveryFeeResult = {
  fee: number
  confirmed: boolean
  blocked?: boolean
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
  countryCode?: string,
): DeliveryFeeResult {
  // Block orders from outside Egypt
  if (countryCode && countryCode.toLowerCase() !== 'eg') {
    return { fee: 0, confirmed: true, blocked: true, note: 'Delivery is only available within Egypt' }
  }

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

  // Distance-based fallback for unlisted Egyptian governorates (150–350 EGP range)
  const MAX_OUTSIDE_DISTANCE_KM = 900
  const raw = 150 + 200 * Math.min(distanceKm / MAX_OUTSIDE_DISTANCE_KM, 1)
  const rounded = Math.round(raw / 10) * 10
  const fee = Math.min(Math.max(rounded, 150), 350)
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
