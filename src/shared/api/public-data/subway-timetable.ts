import { env } from "@/shared/config/env";
import ky from "ky";

export type SubwayTimetableRaw = {
  trainno: string;
  trainKnd: string | null;
  upbdnbSe: string;
  wkndSe: string;
  lineNm: string;
  brlnNm: string | null;
  stnCd: string;
  stnNo: string;
  stnNm: string;
  dptreLineNm: string;
  dptreStnCd: string;
  dptreStnNm: string;
  dptreStnNo: string;
  arvlLineNm: string;
  arvlStnCd: string;
  arvlStnNm: string;
  arvlStnNo: string;
  trainDptreTm: string; // 출발시간 (HH:mm:ss)
  trainArvlTm: string; // 도착시간 (HH:mm:ss)
  etrnYn: string;
  lnkgTrainno: string;
  tmprTmtblYn: string;
  vldBgngDt: string;
  vldEndDt: string | null;
  crtrYmd: string;
};

type SubwayTimetableResponse = {
  response?: {
    header: {
      resultCode: string;
      resultMsg: string;
    };
    body?: {
      items?: {
        item?: SubwayTimetableRaw | SubwayTimetableRaw[];
      };
    };
  };
};

type Line2Group = "2" | "2호선";

export type UpbdnbSe<T extends string> = T extends Line2Group
  ? "내선" | "외선"
  : "상행" | "하행";

/**
 * @param lineNm 노선명 (예: "2", "3")
 * @param stnNm 역명 (예: "사당")
 * @param weekTag 요일 (1: 평일, 2: 토요일, 3: 휴일/일요일)
 * @param upbdnbSe 상하행/내외선 구분 (2호선은 내선/외선, 그 외 노선은 상행/하행)
 */
export async function getSubwayTimetable<T extends string>(
  lineNm: T,
  stnNm: string,
  weekTag: "1" | "2" | "3",
  upbdnbSe: UpbdnbSe<T>,
) {
  // 실제 서울교통공사 API 엔드포인트
  // 기관별로 다를 수 있으나 가장 보편적인 공공데이터포털 API 포맷을 가정
  const url = "http://apis.data.go.kr/B553766/schedule/getTrainSch";

  const wkndSe = weekTag === "1" ? "평일" : weekTag === "2" ? "토요일" : "휴일";

  const searchParams = new URLSearchParams({
    serviceKey: env.DATA_GO_KR_API_SUBWAY_TIMETABLE_KEY,
    pageNo: "1",
    numOfRows: "260",
    lineNm,
    stnNm,
    tmprTmtblYn: "N",
    upbdnbSe,
    wkndSe,
    dataType: "JSON",
  });

  try {
    const res = await ky
      .get(`${url}?${searchParams.toString()}`)
      .json<SubwayTimetableResponse>();

    const header = res.response?.header;
    if (header?.resultCode !== "00") {
      console.error("getSubwayTimetable API Error:", header);
      return [];
    }

    const itemList = res.response?.body?.items?.item;
    if (!itemList) return [];

    return Array.isArray(itemList) ? itemList : [itemList];
  } catch (error) {
    console.error("getSubwayTimetable request failed:", error);
    return [];
  }
}
