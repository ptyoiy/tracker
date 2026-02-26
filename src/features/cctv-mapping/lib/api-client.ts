import { env } from "@/shared/config/env";
import type { RawCctvItem } from "@/types/cctv";

const CCTV_BASE_URL = "https://apis.data.go.kr/1741000/cctv_info/info";

export class CctvApiClient {
  private apiKey = env.DATA_GO_KR_API_KEY;

  async fetchPage(orgCode: string, pageNo: number, numOfRows: number = 100) {
    const upstreamParams = new URLSearchParams({
      serviceKey: this.apiKey,
      pageNo: String(pageNo),
      numOfRows: String(numOfRows),
      returnType: "json",
      "cond[OPN_ATMY_GRP_CD::EQ]": orgCode,
    });

    const res = await fetch(`${CCTV_BASE_URL}?${upstreamParams.toString()}`);
    if (!res.ok) throw new Error(`Upstream API error: ${res.statusText}`);

    const data = await res.json();
    if (data.response.header.resultCode !== "0") {
      throw new Error(
        `API Error: ${data.response.header.resultCode} - ${data.response.header.resultMsg}`,
      );
    }
    return data.response;
  }

  async fetchAll(
    orgCode: string,
  ): Promise<{ items: RawCctvItem[]; totalCount: number }> {
    const firstPage = await this.fetchPage(orgCode, 1);
    const totalCount = Number(firstPage.body.totalCount);
    if (totalCount === 0) return { items: [], totalCount: 0 };

    const normalizeItems = (items: { item: RawCctvItem[] }): RawCctvItem[] => {
      if (!items?.item) return [];
      return Array.isArray(items.item) ? items.item : [items.item];
    };

    let allItems: RawCctvItem[] = normalizeItems(firstPage.body.items);
    const totalPages = Math.ceil(totalCount / 100);

    const CONCURRENCY = 3;
    for (let i = 2; i <= totalPages; i += CONCURRENCY) {
      const batch = [];
      for (let j = 0; j < CONCURRENCY && i + j <= totalPages; j++) {
        batch.push(this.fetchPage(orgCode, i + j));
      }
      const results = await Promise.all(batch);
      for (const res of results) {
        allItems = allItems.concat(normalizeItems(res.body.items));
      }
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    return { items: allItems, totalCount };
  }
}
