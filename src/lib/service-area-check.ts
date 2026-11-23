import { isListedZip, SERVICE_RADIUS_MILES, SERVICE_CITIES, STATE, ZIP_CENTROIDS } from "../../config/service-area";

/**
 * Decides whether an address is inside the service area.
 *
 *  1. If the ZIP is listed, the address is accepted (no lookup needed).
 *  2. Otherwise the address is geocoded with the US Census Geocoder (free, no API key)
 *     and accepted if it is within SERVICE_RADIUS_MILES of a listed ZIP's centre point.
 *
 * Note: the address is sent to the US Census Bureau's geocoder for step 2.
 * Mention this in the privacy policy.
 */

export type ServiceAreaResult =
  | { ok: true; via: "zip" | "radius" }
  | { ok: false; reason: string };

const CITY_LIST = SERVICE_CITIES.map((c) => c.name).join(", ");
const GEOCODER_TIMEOUT_MS = 6000;

export function milesBetween(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8; // Earth radius in miles
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/** Returns the [lat, lon] of an address, or null if the geocoder cannot find it. Throws on network failure. */
async function geocode(line1: string, city: string, zip: string): Promise<{ lat: number; lon: number } | null> {
  const params = new URLSearchParams({
    address: `${line1}, ${city}, ${STATE} ${zip}`,
    benchmark: "Public_AR_Current",
    format: "json",
  });
  const res = await fetch(`https://geocoding.geo.census.gov/geocoder/locations/onelineaddress?${params}`, {
    signal: AbortSignal.timeout(GEOCODER_TIMEOUT_MS),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Geocoder responded ${res.status}`);
  const data = (await res.json()) as {
    result?: { addressMatches?: { coordinates?: { x: number; y: number } }[] };
  };
  const match = data.result?.addressMatches?.[0]?.coordinates;
  return match ? { lat: match.y, lon: match.x } : null;
}

export async function checkServiceArea(input: { line1: string; city: string; zip: string }): Promise<ServiceAreaResult> {
  if (isListedZip(input.zip)) return { ok: true, via: "zip" };

  let point: { lat: number; lon: number } | null;
  try {
    point = await geocode(input.line1, input.city, input.zip);
  } catch (err) {
    console.error("[service-area] geocoder unavailable:", err);
    return {
      ok: false,
      reason: "We couldn't check your address right now. Please try again in a few minutes, or message us on WhatsApp.",
    };
  }

  if (!point) {
    return {
      ok: false,
      reason: "We couldn't find that address. Check the street, city and ZIP code.",
    };
  }

  const nearest = Math.min(
    ...Object.values(ZIP_CENTROIDS).map((c) => milesBetween(point!.lat, point!.lon, c.lat, c.lon)),
  );
  if (nearest <= SERVICE_RADIUS_MILES) return { ok: true, via: "radius" };

  return {
    ok: false,
    reason: `Sorry, this address is outside our service area. We clean homes in ${CITY_LIST} and within ${SERVICE_RADIUS_MILES} miles of them.`,
  };
}
