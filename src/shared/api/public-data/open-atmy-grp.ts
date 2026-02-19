// src/shared/api/public-data/opn-atmy-grp.ts
import ky from "ky";

export type OpenAtmyGroup = {
  code: string;
  name: string;
  lat: number;
  lng: number;
};

let cachedGroups: OpenAtmyGroup[] | null = null;

export async function loadOpenAtmyGroups(): Promise<OpenAtmyGroup[]> {
  if (cachedGroups) return cachedGroups;
  const res = await ky.get("/data/opn-atmy-grp-cd.json");
  cachedGroups = (await res.json()) as OpenAtmyGroup[];
  return cachedGroups;
}

export async function findCodeByRegionName(
  region: string,
): Promise<string | null> {
  const groups = await loadOpenAtmyGroups();
  const found = groups.find(
    (g) => g.name.includes(region) || region.includes(g.name),
  );
  return found?.code ?? null;
}

export async function findOpenAtmyCodeByAddress(
  address: string,
): Promise<string | null> {
  const groups = await loadOpenAtmyGroups();

  // 시/도, 시/군/구 정도까지만 잘라서 비교
  const tokens = address.split(" ").slice(0, 2).join(" ").replaceAll(" ", "");
  // address 앞부분(시/군/구)과 부분 일치
  const found = groups.find(
    (g) => g.name.startsWith(tokens) || tokens.startsWith(g.name),
  );
  return found?.code ?? null;
}
