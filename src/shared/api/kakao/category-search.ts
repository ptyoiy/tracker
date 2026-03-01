import ky from "ky";
import { env } from "@/shared/config/env";

export type KakaoLocalDocument = {
  id: string;
  place_name: string;
  category_name: string;
  category_group_code: string;
  category_group_name: string;
  phone: string;
  address_name: string;
  road_address_name: string;
  x: string;
  y: string;
  place_url: string;
  distance: string;
};

export type KakaoCategoryResponse = {
  meta: {
    total_count: number;
    pageable_count: number;
    is_end: boolean;
    same_name: {
      region: string[];
      keyword: string;
      selected_region: string;
    };
  };
  documents: KakaoLocalDocument[];
};

export async function getCategorySearch(
  categoryCode:
    | "SW8"
    | "MT1"
    | "CS2"
    | "PS3"
    | "SC4"
    | "AC5"
    | "PK6"
    | "OL7"
    | "BK9"
    | "CT1"
    | "AG2"
    | "PO3"
    | "AT4"
    | "AD5"
    | "FD6"
    | "CE7"
    | "HP8"
    | "PM9",
  x: number, // 경도 lng
  y: number, // 위도 lat
  radius = 1000, // 미터 단위 (최대 20000)
) {
  const url = "https://dapi.kakao.com/v2/local/search/category.json";

  const searchParams = new URLSearchParams({
    category_group_code: categoryCode,
    x: String(x),
    y: String(y),
    radius: String(radius),
    sort: "distance",
  });

  const res = await ky
    .get(`${url}?${searchParams.toString()}`, {
      headers: {
        Authorization: `KakaoAK ${env.KAKAO_REST_API_KEY}`,
      },
    })
    .json<KakaoCategoryResponse>();

  return res.documents;
}
