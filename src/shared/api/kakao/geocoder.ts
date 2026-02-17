export async function coordToAddress(
  lat: number,
  lng: number,
): Promise<string | null> {
  const res = await fetch(`/api/geocode?lat=${lat}&lng=${lng}`);
  if (!res.ok) return null;

  const data = (await res.json()) as { address: string | null };
  return data.address;
}
