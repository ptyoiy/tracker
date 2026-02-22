import { describe, expect, it } from "vitest";
import { turso } from "@/shared/lib/turso";
import { CctvSyncService } from "../cctv-sync";

// 실제 API와 DB를 사용하므로 수동 실행을 위해 skip 처리해 둡니다.
describe("CctvSyncService Integration (Real API & DB)", () => {
  const service = new CctvSyncService();
  const GANGNAM_CODE = "3220000"; // 강남구 지역코드

  it("강남구 CCTV 데이터를 전수 수집하여 Turso에 저장한다", async () => {
    console.log("🚀 강남구 CCTV 전수 수집 시작...");

    // 기존 데이터 삭제 (ID 체계 변경으로 인한 혼선 방지)
    await turso.execute({
      sql: "DELETE FROM cctv WHERE org_code = ?",
      args: [GANGNAM_CODE],
    });
    await turso.execute({
      sql: "DELETE FROM cctv_region_sync WHERE org_code = ?",
      args: [GANGNAM_CODE],
    });

    // 1. 동기화 실행 (강제 새로고침 옵션)
    const result = await service.sync(GANGNAM_CODE, { forceRefresh: true });

    console.log(
      `✅ 수집 결과 - 지역코드: ${result.orgCode}, 전체: ${result.totalCount}, 저장됨: ${result.insertedCount}`,
    );

    // 2. 결과 검증
    expect(result.orgCode).toBe(GANGNAM_CODE);
    expect(result.totalCount).toBeGreaterThan(0);
    expect(result.insertedCount).toBe(result.totalCount);

    // 3. DB 실제 저장 상태 확인
    const dbCheck = await turso.execute({
      sql: "SELECT count(*) as cnt FROM cctv WHERE org_code = ?",
      args: [GANGNAM_CODE],
    });
    const countInDb = Number(dbCheck.rows[0].cnt);

    console.log(
      `📊 Turso DB 확인: ${countInDb}개의 데이터가 저장되어 있습니다.`,
    );
    expect(countInDb).toBe(result.totalCount);

    // 4. 동기화 상태 테이블 확인
    const syncCheck = await turso.execute({
      sql: "SELECT total_count, last_synced_at FROM cctv_region_sync WHERE org_code = ?",
      args: [GANGNAM_CODE],
    });
    expect(syncCheck.rows.length).toBe(1);
    expect(Number(syncCheck.rows[0].total_count)).toBe(result.totalCount);
    console.log(`📅 마지막 동기화 시간: ${syncCheck.rows[0].last_synced_at}`);
  }, 60000); // API 호출이 많으므로 타임아웃을 60초로 넉넉히 잡습니다.
});
