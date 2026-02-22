import { turso } from "@/shared/lib/turso";
import type { CctvRow } from "@/types/cctv";

export class CctvRepository {
  async getSyncStatus(orgCode: string) {
    const result = await turso.execute({
      sql: "SELECT total_count FROM cctv_region_sync WHERE org_code = ?",
      args: [orgCode],
    });
    return result.rows.length > 0 ? Number(result.rows[0].total_count) : null;
  }

  async saveCctvs(rows: CctvRow[]) {
    const CHUNK_SIZE = 50;
    for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
      const chunk = rows.slice(i, i + CHUNK_SIZE);
      const statements = chunk.map((row) => ({
        sql: `INSERT OR REPLACE INTO cctv (id, purpose, lot_address, road_address, manager_name, org_code, shot_angle, lat, lng)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          row.id,
          row.purpose,
          row.lot_address,
          row.road_address,
          row.manager_name,
          row.org_code,
          row.shot_angle,
          row.lat,
          row.lng,
        ],
      }));
      await turso.batch(statements, "write");
    }
  }

  async updateSyncStatus(orgCode: string, totalCount: number) {
    await turso.execute({
      sql: "INSERT OR REPLACE INTO cctv_region_sync (org_code, total_count, last_synced_at) VALUES (?, ?, ?)",
      args: [orgCode, totalCount, new Date().toISOString()],
    });
  }
}
