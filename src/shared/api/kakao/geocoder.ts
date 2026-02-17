export async function coordToAddress(
  lat: number,
  lng: number,
): Promise<string | null> {
  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : "http://localhost:3000"; // 테스트/서버용 기본값
  const res = await fetch(`${baseUrl}/api/geocode?lat=${lat}&lng=${lng}`);
  if (!res.ok) return null;

  const data = (await res.json()) as { address: string | null };
  return data.address;
}
