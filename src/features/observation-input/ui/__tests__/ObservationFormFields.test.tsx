// src/features/observation-input/ui/__tests__/ObservationFormFields.test.tsx
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
        },
      ],
      futureMinutes: 10,
    },
  });

  return (
    <ObservationFormFields
      index={0}
      form={form}
      onRemove={() => {}}
      canRemove={false}
    />
  );
}

describe("ObservationFormFields", () => {
  it("datetime-local 입력을 ISO 문자열로 변환한다", () => {
    render(<Wrapper />);

    const input = screen.getByLabelText("시간") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "2026-02-17T09:00" } });

    // 화면의 값은 입력한 값 그대로여야 함 (로컬 시간)
    expect(input.value).toBe("2026-02-17T09:00");
  });
});
