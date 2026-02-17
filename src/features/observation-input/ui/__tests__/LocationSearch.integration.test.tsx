// src/features/observation-input/ui/__tests__/LocationSearch.integration.test.tsx
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { getDefaultStore, Provider } from "jotai";
import { useForm } from "react-hook-form";
import { describe, expect, it, vi } from "vitest";
import { observationsAtom } from "../../model/atoms";
import type { ObservationFormValues } from "../../model/schema";
import { ObservationFormFields } from "../ObservationFormField";

// LocationSearch 내부 fetch를 mock
global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  json: async () => ({
    results: [
      {
        label: "서울역",
        address: "서울특별시 용산구 한강대로 405",
        lat: 37.5547,
        lng: 126.9707,
        type: "place",
      },
    ],
  }),
}) as any;

function Wrapper() {
  const form = useForm<ObservationFormValues>({
    defaultValues: {
      observations: [
        {
          lat: 0,
          lng: 0,
          timestamp: "2026-02-17T08:00:00.000Z",
          label: "",
          address: "",
        },
      ],
      futureMinutes: 10,
    },
  });

  return <ObservationFormFields index={0} form={form} onRemove={() => {}} />;
}

describe("LocationSearch with ObservationFormFields", () => {
  it("검색 후 항목 선택 시 label/address/lat/lng가 폼과 atom에 반영된다", async () => {
    const store = getDefaultStore();
    render(
      <Provider store={store}>
        <Wrapper />
      </Provider>,
    );

    const input = screen.getByPlaceholderText("예: 서울역, 투썸플레이스 합정");
    fireEvent.change(input, { target: { value: "서울역" } });

    const searchBtn = screen.getByText("검색");
    fireEvent.click(searchBtn);

    await waitFor(() => {
      expect(screen.getByText("서울역")).toBeInTheDocument();
    });

    const resultBtn = screen.getByText("서울역");
    fireEvent.click(resultBtn);

    await waitFor(() => {
      // 검색창 value가 '서울역'으로 바뀌었는지
      expect(screen.getByDisplayValue("서울역")).toBeInTheDocument();
    });

    const obs = store.get(observationsAtom);
    expect(obs[0].label).toBe("서울역");
    expect(obs[0].address).toBe("서울특별시 용산구 한강대로 405");
    expect(obs[0].lat).toBeCloseTo(37.554);
    expect(obs[0].lng).toBeCloseTo(126.9707);
  });
});
