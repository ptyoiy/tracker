// src/features/observation-input/ui/__tests__/ObservationForm.test.tsx
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Provider } from "jotai";
import { describe, expect, it } from "vitest";
import { ObservationForm } from "../ObservationForm";

function renderWithJotai(ui: React.ReactElement) {
  return render(<Provider>{ui}</Provider>);
}

describe("ObservationForm", () => {
  it("초기에는 최소 2개의 관측 필드를 렌더링한다", () => {
    renderWithJotai(<ObservationForm />);
    expect(screen.getAllByText(/관측 #/)).toHaveLength(2);
  });

  it("관측 지점을 추가/삭제할 수 있다", async () => {
    renderWithJotai(<ObservationForm />);

    const addButton = screen.getByText("관측 지점 추가");
    fireEvent.click(addButton);
    expect(screen.getAllByText(/관측 #/)).toHaveLength(3);

    const removeButtons = screen.getAllByRole("button", { name: "✕" });
    fireEvent.click(removeButtons[0]);
    await waitFor(() => {
      expect(screen.getAllByText(/관측 #/)).toHaveLength(2);
    });
  });

  it("futureMinutes에 잘못된 값이 있으면 에러를 보여준다", async () => {
    renderWithJotai(<ObservationForm />);

    const futureInput = screen.getByLabelText("추정 대상 시간(+분)");
    fireEvent.change(futureInput, { target: { value: "0" } });

    // 블러 이벤트를 발생시켜 유효성 검사 트리거 (mode: onBlur)
    fireEvent.blur(futureInput);

    const submit = screen.getByText("분석 시작");
    fireEvent.click(submit);

    expect(await screen.findByText(/1 이상이어야 합니다/i)).toBeInTheDocument();
  });
});
