import ky from "ky";
import { env } from "@/shared/config/env";

export type SubwayTimetableRaw = {
  statnId: string;
  statnNm: string;
  updnLine: string; // "0" 상행, "1" 하행
  trainNo: string;
  arrTime: string; // 도착시간 (HH:mm:ss)
  depTime: string; // 출발시간 (HH:mm:ss)
  expressYn: string; // 급행여부 "G" 일반, "D" 급행 (노선마다 다를 수 있음)
  endStatnNm: string; // 종점 역명
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

/**
 * @param stationCode 4자리 역코드
 * @param weekTag 요일 (1: 평일, 2: 토요일, 3: 휴일/일요일)
 * @param inoutTag 상하행 (1: 상행/내선, 2: 하행/외선)
 */
export async function getSubwayTimetable(
  stationCode: string,
  weekTag: "1" | "2" | "3",
  inoutTag: "1" | "2",
) {
  // 실제 서울교통공사 API 엔드포인트
  // 기관별로 다를 수 있으나 가장 보편적인 공공데이터포털 API 포맷을 가정
  const url =
    "http://apis.data.go.kr/B553766/smt-stn-train-schedule/stn-train-schedule";

  const searchParams = new URLSearchParams({
    serviceKey: env.DATA_GO_KR_API_KEY,
    pageNo: "1",
    numOfRows: "500", // 하루치 다 가져오기 위해 넉넉히
    statnId: stationCode,
    weekTag: weekTag,
    inoutTag: inoutTag,
    _type: "json", // json 리턴
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
