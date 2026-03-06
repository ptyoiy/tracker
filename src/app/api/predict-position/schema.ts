import { z } from "zod";

export const PredictPositionRequestSchema = z.object({
  observations: z
    .array(
      z.object({
        lat: z.number().min(-90).max(90),
        lng: z.number().min(-180).max(180),
        timestamp: z.string().datetime(),
        address: z.string().optional(),
      }),
    )
    .min(2)
    .max(7),
  futureMinutes: z.number().min(0).max(120).default(60),
  currentTime: z.string().datetime(),
  options: z
    .object({
      maxHypotheses: z.number().min(1).max(5).default(3),
      includeDestination: z.boolean().default(true),
      includeTransit: z.boolean().default(true),
    })
    .optional(),
});

export const PredictPositionResponseSchema = z.object({
  hypotheses: z.array(
    z.object({
      id: z.string(),
      mode: z.enum(["walking", "vehicle", "transit"]),
      probability: z.number().min(0).max(1),
      currentPosition: z.object({
        lat: z.number(),
        lng: z.number(),
      }),
      confidenceZone: z.object({
        high: z.any(), // GeoJSON.Polygon
        medium: z.any(),
        low: z.any(),
      }),
      estimatedDestination: z
        .object({
          id: z.string(),
          lat: z.number(),
          lng: z.number(),
          name: z.string().optional(),
          probability: z.number(),
        })
        .optional(),
      routeGeometry: z.any().optional(), // GeoJSON.LineString
      transitDetails: z
        .object({
          lineId: z.string(),
          lineName: z.string(),
          fromStation: z.string(),
          toStation: z.string(),
          currentSegment: z.tuple([z.number(), z.number()]),
        })
        .optional(),
      metadata: z.object({
        avgSpeed: z.number(),
        lastObservedTime: z.string(),
        predictionTime: z.string(),
        elapsedMinutes: z.number(),
      }),
    }),
  ),
  timestamp: z.string(),
  inputObservations: z.array(z.any()),
  futureMinutes: z.number(),
  status: z.enum(["success", "partial", "error"]),
  warnings: z.array(z.string()).optional(),
});

export type PredictPositionRequest = z.infer<
  typeof PredictPositionRequestSchema
>;
export type PredictPositionResponse = z.infer<
  typeof PredictPositionResponseSchema
>;
