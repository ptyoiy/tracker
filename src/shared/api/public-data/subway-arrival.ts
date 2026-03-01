import { env } from "@/shared/config/env";
import ky from "ky";

export type SubwayArrivalRaw = {
  rowNum: number;
  subwayId: string; // 1001: 1호선, 1002: 2호선 등
  trainLineNm: string; // 방면 (예: "성수행 - 내선")
  statnNm: string; // 역이름
  bstatnNm: string; // 종착지
  arvlMsg2: string; // "3분 후", "[7]번째 전역" 등
  arvlMsg3: string; // 현재 위치 등
  arvlCd: string; // 도착코드 (0: 진입, 1: 도착 등)
  btrainNo: string; // 열차번호
};

type SubwayArrivalResponse = {
  realtimeArrivalList?: SubwayArrivalRaw[];
  errorMessage?: {
    status: number;
    code: string;
    message: string;
  };
};

export async function getSubwayArrival(stationName: string) {
  // 한글 역명 인코딩
  const encodedName = encodeURIComponent(stationName);
  const url = `http://swopenAPI.seoul.go.kr/api/subway/${env.SEOUL_SUBWAY_API_KEY}/json/realtimeStationArrival/0/10/${encodedName}`;

  const res = await ky.get(url).json<SubwayArrivalResponse>();
  console.log({ res });
  if (!res.realtimeArrivalList?.length) {
    if (res.errorMessage && res.errorMessage.code !== "INFO-200") {
      console.error("getSubwayArrival API Error:", res.errorMessage);
    }
    return [];
  }

  return res.realtimeArrivalList;
}
