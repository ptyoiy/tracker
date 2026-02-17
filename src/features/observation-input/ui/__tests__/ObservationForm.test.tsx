import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { getDefaultStore, Provider } from "jotai";
import { describe, expect, it } from "vitest";
import { observationsAtom } from "../../model/atoms";
import { ObservationForm } from "../ObservationForm";

function renderWithStore(ui: React.ReactElement, store = getDefaultStore()) {
  return render(<Provider store={store}>{ui}</Provider>);
}

describe("ObservationForm", () => {
  it("초기에는 관측이 0개이고, 분석 버튼은 비활성화된다", () => {
    const store = getDefaultStore();
    renderWithStore(<ObservationForm />, store);

    expect(screen.queryAllByText(/관측 #/)).toHaveLength(0);

    const submitBtn = screen.getByRole("button", { name: "분석 시작" });
    expect(submitBtn).toBeDisabled();
  });

  it("관측 지점을 추가하면 폼과 atom 모두에 반영되고, 2개 이상일 때 분석 버튼이 활성화된다", async () => {
    const store = getDefaultStore();
    renderWithStore(<ObservationForm />, store);

    const addButton = screen.getByText("관측 지점 추가");

    fireEvent.click(addButton);
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getAllByText(/관측 #/)).toHaveLength(2);
    });

    const submitBtn = screen.getByRole("button", { name: "분석 시작" });
    expect(submitBtn).not.toBeDisabled();

    const obs = store.get(observationsAtom);
    expect(obs).toHaveLength(2);
  });

  it("관측을 삭제하면 atom에서도 제거된다", async () => {
    const store = getDefaultStore();
    store.set(observationsAtom, [
      {
        lat: 1,
        lng: 1,
        timestamp: "2026-02-17T08:00:00.000Z",
        label: "A",
        address: "A addr",
      },
      {
        lat: 2,
        lng: 2,
        timestamp: "2026-02-17T09:00:00.000Z",
        label: "B",
        address: "B addr",
      },
    ]);

    renderWithStore(<ObservationForm />, store);

    await waitFor(() => {
      expect(screen.getAllByText(/관측 #/)).toHaveLength(2);
    });

    const removeButtons = screen.getAllByRole("button", { name: "✕" });
    fireEvent.click(removeButtons[0]);

    await waitFor(() => {
      expect(screen.getAllByText(/관측 #/)).toHaveLength(1);
    });

    const obs = store.get(observationsAtom);
    expect(obs).toHaveLength(1);
    expect(obs[0].label).toBe("B");
  });
});
