// src/shared/api/kakao/geocoder.ts
export type GeocodeResult = {
  address: string | null;
  buildingName: string | null;
};

export async function coordToAddress(
  lat: number,
  lng: number,
): Promise<string | null> {
  const result = await fullGeocode(lat, lng);
  return result.address;
}

export async function fullGeocode(
  lat: number,
  lng: number,
): Promise<GeocodeResult> {
  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : "http://localhost:3000";

  try {
    const res = await fetch(`${baseUrl}/api/geocode?lat=${lat}&lng=${lng}`);
    if (!res.ok) return { address: null, buildingName: null };

    return (await res.json()) as GeocodeResult;
  } catch (e) {
    console.error("Geocoding failed", e);
    return { address: null, buildingName: null };
  }
}
