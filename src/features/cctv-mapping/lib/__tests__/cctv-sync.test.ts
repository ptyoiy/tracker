import { beforeEach, describe, expect, it, vi } from "vitest";
import { CctvApiClient } from "../api-client";
import { CctvSyncService } from "../cctv-sync";
import { CctvRepository } from "../repository";

// Mock the classes
vi.mock("../api-client");
vi.mock("../repository");

describe("CctvSyncService", () => {
  let service: CctvSyncService;
  let mockApiClient: any;
  let mockRepository: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockApiClient = new CctvApiClient();
    mockRepository = new CctvRepository();
    service = new CctvSyncService(mockApiClient, mockRepository);
  });

  it("이미 동기화된 지역은 레포지토리만 확인하고 즉시 반환해야 한다", async () => {
    // Arrange
    const orgCode = "11110";
    mockRepository.getSyncStatus.mockResolvedValue(500);

    // Act
    const result = await service.sync(orgCode);

    // Assert
    expect(result.totalCount).toBe(500);
    expect(result.insertedCount).toBe(0);
    expect(mockApiClient.fetchAll).not.toHaveBeenCalled();
    expect(mockRepository.saveCctvs).not.toHaveBeenCalled();
  });

  it("동기화가 필요한 지역은 API에서 전체 데이터를 가져와 저장해야 한다", async () => {
    // Arrange
    const orgCode = "11110";
    mockRepository.getSyncStatus.mockResolvedValue(null);
    mockApiClient.fetchAll.mockResolvedValue({
      totalCount: 2,
      items: [
        { MNG_NO: "1", WGS84_LAT: "37", WGS84_LOT: "127" },
        { MNG_NO: "2", WGS84_LAT: "37", WGS84_LOT: "127" },
      ],
    });

    // Act
    const result = await service.sync(orgCode);

    // Assert
    expect(result.totalCount).toBe(2);
    expect(result.insertedCount).toBe(2);
    expect(mockRepository.saveCctvs).toHaveBeenCalled();
    expect(mockRepository.updateSyncStatus).toHaveBeenCalledWith(orgCode, 2);
  });

  it("forceRefresh 옵션이 true이면 기존 동기화 상태를 무시하고 API를 호출해야 한다", async () => {
    // Arrange
    const orgCode = "11110";
    mockRepository.getSyncStatus.mockResolvedValue(500);
    mockApiClient.fetchAll.mockResolvedValue({ totalCount: 1, items: [] });

    // Act
    await service.sync(orgCode, { forceRefresh: true });

    // Assert
    expect(mockApiClient.fetchAll).toHaveBeenCalled();
  });
});
