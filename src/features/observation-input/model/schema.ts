import { z } from "zod";

const datetimeLocalRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

export const observationRawSchema = z.object({
  id: z.string(),
  lat: z
    .number({ error: "위도를 입력해주세요" })
    .min(33, "33~38 사이여야 합니다")
    .max(38, "33~38 사이여야 합니다"),
  lng: z
    .number({ error: "경도를 입력해주세요" })
    .min(124, "124~132 사이여야 합니다")
    .max(132, "124~132 사이여야 합니다"),
  timestamp: z
    .string()
    .regex(
      datetimeLocalRegex,
      "올바른 시간 형식이 아닙니다. (예: 2026-02-18T16:22)",
    ),
  address: z.string().optional(),
  label: z.string().optional(),
});

export const formSchema = z.object({
  observations: z
    .array(observationRawSchema)
    .min(2, "최소 2개의 관측 지점이 필요합니다")
    .max(15),
  futureMinutes: z
    .number({ error: "시간을 입력해주세요" })
    .min(1, "1 이상이어야 합니다")
    .max(60, "60 이하여야 합니다")
    .default(10)
    .nonoptional(),
});

export type ObservationFormValues = {
  observations: (Omit<z.infer<typeof observationRawSchema>, "timestamp"> & {
    timestamp: string; // ISO
  })[];
  futureMinutes: number;
};
export type ObservationFormValuesRaw = z.infer<typeof formSchema>;
