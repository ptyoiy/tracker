import { mapRawToRow } from "@/shared/lib/utils";
import { CctvApiClient } from "./api-client";
import { CctvRepository } from "./repository";

export interface SyncResult {
  orgCode: string;
  totalCount: number;
  insertedCount: number;
}

export class CctvSyncService {
  constructor(
    private apiClient = new CctvApiClient(),
    private repository = new CctvRepository(),
  ) {}

  async sync(
    orgCode: string,
    options: { forceRefresh?: boolean } = {},
  ): Promise<SyncResult> {
    const { forceRefresh = false } = options;

    // 1. Check sync status
    if (!forceRefresh) {
      const existingCount = await this.repository.getSyncStatus(orgCode);
      if (existingCount !== null) {
        return { orgCode, totalCount: existingCount, insertedCount: 0 };
      }
    }

    // 2. Fetch all from API
    const { items, totalCount } = await this.apiClient.fetchAll(orgCode);
    if (totalCount === 0) {
      return { orgCode, totalCount: 0, insertedCount: 0 };
    }

    // 3. Save to DB
    const rows = items.map((item) => mapRawToRow(item));
    await this.repository.saveCctvs(rows);

    // 4. Update sync status
    await this.repository.updateSyncStatus(orgCode, totalCount);

    return {
      orgCode,
      totalCount,
      insertedCount: rows.length,
    };
  }
}

// 하위 호환성을 위해 기존 함수 형태도 유지 (내부적으로 서비스 호출)
export async function syncRegionCctv(
  orgCode: string,
  options?: { forceRefresh?: boolean },
) {
  const service = new CctvSyncService();
  return service.sync(orgCode, options);
}
