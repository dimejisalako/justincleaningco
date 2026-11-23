/**
 * SERVICE AREA CONFIG.
 *
 * An address is accepted if EITHER:
 *   1. its ZIP code is listed below, OR
 *   2. it lies within SERVICE_RADIUS_MILES of one of the listed ZIP codes
 *      (checked by geocoding the address; see src/lib/service-area-check.ts).
 */

export interface ServiceCity {
  name: string;
  zips: string[];
}

export const STATE = "TX";
export const STATE_NAME = "Texas";

/** Addresses within this straight-line distance of a listed ZIP are also accepted. */
export const SERVICE_RADIUS_MILES = 5;

export const SERVICE_CITIES: ServiceCity[] = [
  { name: "Justin", zips: ["76247"] },
  { name: "Northlake", zips: ["76226"] },
  { name: "Trophy Club", zips: ["76262"] },
  { name: "Southlake", zips: ["76092"] },
  { name: "Westlake", zips: ["76177"] },
];

/**
 * Centre point of each listed ZIP code (US Census 2023 ZCTA internal points).
 * Distance is measured from the address to the nearest of these points.
 */
export const ZIP_CENTROIDS: Record<string, { lat: number; lon: number }> = {
  "76247": { lat: 33.094299, lon: -97.328642 },
  "76226": { lat: 33.105493, lon: -97.17752 },
  "76262": { lat: 33.009665, lon: -97.219981 },
  "76092": { lat: 32.954493, lon: -97.148867 },
  "76177": { lat: 32.966541, lon: -97.303778 },
};

/** Every ZIP code that is listed directly. */
export const LISTED_ZIPS: string[] = SERVICE_CITIES.flatMap((c) => c.zips);

/** True if the ZIP is one of the listed service ZIP codes. */
export function isListedZip(zip: string): boolean {
  return LISTED_ZIPS.includes(zip.trim());
}
