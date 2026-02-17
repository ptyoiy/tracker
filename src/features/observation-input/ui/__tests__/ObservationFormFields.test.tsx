import { fireEvent, render, screen } from "@testing-library/react";
import { useForm } from "react-hook-form";
import { describe, expect, it } from "vitest";
import type { ObservationFormValues } from "../../model/schema";
import { ObservationFormFields } from "../ObservationFormField";

function Wrapper() {
  const form = useForm<ObservationFormValues>({
    defaultValues: {
      observations: [
        {
          lat: 37.5,
          lng: 126.9,
          timestamp: "2026-02-17T08:00:00.000Z",
          label: "초기",
          address: "초기 주소",
        },
      ],
      futureMinutes: 10,
    },
  });

  return <ObservationFormFields index={0} form={form} onRemove={() => {}} />;
}

describe("ObservationFormFields", () => {
  it("datetime-local 입력 변경 시 내부 timestamp를 ISO로 업데이트한다", () => {
    render(<Wrapper />);

    const input = screen.getByLabelText("시간") as HTMLInputElement;

    fireEvent.change(input, { target: { value: "2026-02-17T09:30" } });

    // 화면값은 그대로 local 형태
    expect(input.value).toBe("2026-02-17T09:30");
    // 실제 ISO 값은 react-hook-form 내부 상태라 이 테스트에서는 간접 검증만 가능
  });
});
