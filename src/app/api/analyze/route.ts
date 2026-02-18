// biome-ignore assist/source/organizeImports: <bug>
import { buildSegmentAnalyses } from "@/features/route-analysis/lib/segment-analyzer";
import type { AnalyzeRequest, AnalyzeResponse } from "@/types/analyze";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as AnalyzeRequest;

    // 간단 검증 (Zod로 강화해도 됨)
    if (!body.observations || body.observations.length < 2) {
      return NextResponse.json(
        {
          segments: [],
          fallbackUsed: true,
          errors: "At least 2 observations required",
        } satisfies AnalyzeResponse,
        { status: 400 },
      );
    }

    const segments = buildSegmentAnalyses(body.observations);

    const res: AnalyzeResponse = {
      segments,
      fallbackUsed: false,
      errors: undefined,
    };

    return NextResponse.json(res);
  } catch (e) {
    return NextResponse.json(
      {
        segments: [],
        fallbackUsed: true,
        errors: e instanceof Error ? e.message : "Unknown error",
      } satisfies AnalyzeResponse,
      { status: 500 },
    );
  }
}
