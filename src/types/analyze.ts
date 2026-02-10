// src/types/analyze.ts
import { z } from "zod";

export const observationSchema = z.object({
  lat: z.number().min(33).max(38),
  lng: z.number().min(124).max(132),
  timestamp: z.string().datetime(),
});

export const analyzeRequestSchema = z.object({
  observations: z.array(observationSchema).min(2).max(7),
  futureMinutes: z.number().min(1).max(60).optional().default(10),
});

export type Observation = z.infer<typeof observationSchema>;
export type AnalyzeRequest = z.infer<typeof analyzeRequestSchema>;

export interface SegmentAnalysis {
  from: Observation;
  to: Observation;
  distance: number; // 미터
  duration: number; // 초
  avgSpeed: number; // km/h
  transportMode: "walking" | "vehicle" | "transit";
  routes: RouteInfo[];
}

export interface RouteInfo {
  mode: "walking" | "driving";
  polyline: number[][]; // [lng, lat][]
  estimatedDuration: number; // 초
  distance: number; // 미터
}

export interface AnalyzeResponse {
  segments: SegmentAnalysis[];
}
