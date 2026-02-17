// src/shared/api/kakao/__tests__/geocoder.test.ts

import ky from "ky";
import { describe, expect, it, vi } from "vitest";
import { coordToAddress } from "../geocoder";

vi.mock("ky");

describe("coordToAddress", () => {
  it("도로명 주소가 있으면 road_address.address_name을 반환한다", async () => {
    (ky.get as any).mockReturnValueOnce({
      json: async () => ({
        documents: [
          {
            road_address: { address_name: "서울특별시 중구 세종대로 110" },
            address: { address_name: "서울특별시 중구 태평로1가 31" },
          },
        ],
      }),
    });

    const addr = await coordToAddress(37.5665, 126.978);
    expect(addr).toBe("서울특별시 중구 세종대로 110");
  });

  it("도로명이 없으면 지번 주소를 반환한다", async () => {
    (ky.get as any).mockReturnValueOnce({
      json: async () => ({
        documents: [
          {
            address: { address_name: "서울특별시 중구 태평로1가 31" },
          },
        ],
      }),
    });

    const addr = await coordToAddress(37.5665, 126.978);
    expect(addr).toBe("서울특별시 중구 태평로1가 31");
  });

  it("documents가 없으면 null을 반환한다", async () => {
    (ky.get as any).mockReturnValueOnce({
      json: async () => ({ documents: [] }),
    });

    const addr = await coordToAddress(0, 0);
    expect(addr).toBeNull();
  });

  it("예외 발생 시 null을 반환한다", async () => {
    (ky.get as any).mockImplementationOnce(() => {
      throw new Error("network");
    });

    const addr = await coordToAddress(0, 0);
    expect(addr).toBeNull();
  });
});
