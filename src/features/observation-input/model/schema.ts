import { z } from "zod";

export const observationSchema = z.object({
  lat: z.number().min(33).max(38),
  lng: z.number().min(124).max(132),
  timestamp: z.iso.datetime(),
  address: z.string().optional(), // 역지오코딩 결과
});

export const formSchema = z.object({
  observations: z.array(observationSchema).min(2).max(15),
  futureMinutes: z.number().min(1).max(60).default(10).nonoptional(),
});

export type Observation = z.infer<typeof observationSchema>;
export type FormSchema = z.infer<typeof formSchema>;
