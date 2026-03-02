import { env } from "@/shared/config/env";
import ky from "ky";

export type SubwayArrivalRaw = {
  beginRow: number | null;
  endRow: number | null;
  curPage: number | null;
  pageRow: number | null;
  totalCount: number;
  rowNum: number;
  selectedCount: number;
  subwayId: string; // 1001: 1호선, 1002: 2호선 등
  subwayNm: string | null;
  updnLine: string; // "외선", "내선", "상행", "하행"
  trainLineNm: string; // 방면 (예: "성수행 - 삼성방면")
  subwayHeading: string | null;
  statnFid: string; // 이전역 ID
  statnTid: string; // 다음역 ID
  statnId: string; // 역 ID
  statnNm: string; // 역이름
  trainCo: string | null;
  trnsitCo: string; // 환승노선 수
  ordkey: string; // 도착순서
  subwayList: string; // 해당 역 경유 노선 목록
  statnList: string; // 해당 역 노선별 역 ID 목록
  btrainSttus: string; // 열차 종류 ("일반", "급행" 등)
  barvlDt: string; // 도착예정시간 (초)
  btrainNo: string; // 열차번호
  bstatnId: string; // 종착역 ID
  bstatnNm: string; // 종착지
  recptnDt: string; // 수신시간
  arvlMsg2: string; // "전역 출발", "3분 후" 등
  arvlMsg3: string; // 현재 위치 역명
  arvlCd: string; // 도착코드 (0: 진입, 1: 도착, 2: 출발, 3: 전역출발 등)
  lstcarAt: string; // 막차 여부 ("0": 아님, "1": 막차)
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
  if (!res.realtimeArrivalList?.length) {
    if (res.errorMessage && res.errorMessage.code !== "INFO-200") {
      console.error("getSubwayArrival API Error:", res.errorMessage);
    }
    return [];
  }

  return res.realtimeArrivalList;
}
