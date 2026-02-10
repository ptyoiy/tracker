"use client";

import { useAtom, useSetAtom } from "jotai";
import ky from "ky";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import type { TmapDrivingResponse } from "@/lib/tmap/driving";
import {
  activeTabAtom,
  analysisResultAtom,
  futureMinutesAtom,
  isLoadingAtom,
  isochroneDataAtom,
  observationsAtom,
} from "@/store/atoms";

function toDatetimeLocalMinutesOnly(value: string | Date) {
  const d = value instanceof Date ? value : new Date(value);

  // 로컬 타임으로 보정
  const local = new Date(d.getTime());

  const year = local.getFullYear();
  const month = String(local.getMonth() + 1).padStart(2, "0");
  const day = String(local.getDate()).padStart(2, "0");
  const hours = String(local.getHours()).padStart(2, "0");
  const minutes = String(local.getMinutes()).padStart(2, "0");

  // 초·밀리초 제거: YYYY-MM-DDTHH:mm
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function ObservationForm() {
  const [observations, setObservations] = useAtom(observationsAtom);
  const [isLoading, setIsLoading] = useAtom(isLoadingAtom);
  const [futureMinutes, setFutureMinutes] = useAtom(futureMinutesAtom);
  const setAnalysisResult = useSetAtom(analysisResultAtom);
  const setIsochroneData = useSetAtom(isochroneDataAtom);
  const setActiveTab = useSetAtom(activeTabAtom);

  const updateObservation = (index: number, field: string, value: any) => {
    setObservations((prev) =>
      prev.map((obs, i) => (i === index ? { ...obs, [field]: value } : obs)),
    );
  };

  const removeObservation = (index: number) => {
    setObservations((prev) => prev.filter((_, i) => i !== index));
  };

  // ① 경로 분석 (2개 이상 지점 필요)
  const handleAnalyzeRoutes = async () => {
    if (observations.length < 2) return;
    setIsLoading(true);

    try {
      // datetime-local 문자열 → ISO로 변환한 사본
      const normalizedObservations = observations.map((obs) => ({
        ...obs,
        timestamp: new Date(obs.timestamp).toISOString(),
      }));

      // 1. 경로 분석
      const analyzeResult = await ky
        .post("/api/analyze", {
          json: { observations: normalizedObservations, futureMinutes },
        })
        .json();

      setAnalysisResult(analyzeResult as any);

      // 2. Isochrone 요청 (마지막 지점 기준)
      const lastObs = normalizedObservations[normalizedObservations.length - 1];
      const isoResult = await ky
        .post<TmapDrivingResponse>("/api/isochrone", {
          json: {
            lat: lastObs.lat,
            lng: lastObs.lng,
            minutes: futureMinutes,
            profile: "walking",
          },
        })
        .json();

      setIsochroneData(isoResult);

      // 분석 완료 → 지도 탭으로 전환
      setActiveTab("map");
    } catch (error) {
      console.error("경로 분석 실패:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // ② 이동 가능 범위만 표시 (1개 이상 지점이면 가능)
  const handleIsochroneOnly = async () => {
    if (observations.length < 1) return;
    setIsLoading(true);

    try {
      const lastObs = observations[observations.length - 1];

      const isoResult = await ky
        .post<TmapDrivingResponse>("/api/isochrone", {
          json: {
            lat: lastObs.lat,
            lng: lastObs.lng,
            minutes: futureMinutes,
            profile: "walking",
          },
        })
        .json();

      setIsochroneData(isoResult);
      // 경로 분석 결과는 그대로 두고, 지도 탭으로만 전환
      setActiveTab("map");
    } catch (error) {
      console.error("Isochrone 계산 실패:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* 안내 */}
      <div className="text-sm text-muted-foreground">
        지도 탭에서 위치를 탭하거나, 아래에서 직접 수정하세요.
      </div>

      {/* 발견 지점 리스트 */}
      <div className="space-y-3">
        {observations.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              아직 발견 지점이 없습니다.
              <br />
              <Button
                variant="link"
                className="p-0 h-auto"
                onClick={() => setActiveTab("map")}
              >
                지도 탭에서 추가하기
              </Button>
            </CardContent>
          </Card>
        )}

        {observations.map((obs, i) => (
          <Card key={i.toString()}>
            <CardContent className="p-3 space-y-2">
              <div className="flex items-center justify-between">
                <Badge variant="outline">지점 {i + 1}</Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive h-6 px-2"
                  onClick={() => removeObservation(i)}
                >
                  삭제
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-muted-foreground">위도</Label>
                  <Input
                    type="number"
                    step="0.0001"
                    value={obs.lat}
                    onChange={(e) =>
                      updateObservation(
                        i,
                        "lat",
                        Number.parseFloat(e.target.value),
                      )
                    }
                    className="h-9 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">경도</Label>
                  <Input
                    type="number"
                    step="0.0001"
                    value={obs.lng}
                    onChange={(e) =>
                      updateObservation(
                        i,
                        "lng",
                        Number.parseFloat(e.target.value),
                      )
                    }
                    className="h-9 text-sm"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">
                  발견 시각
                </Label>
                <Input
                  type="datetime-local"
                  value={toDatetimeLocalMinutesOnly(obs.timestamp)} // datetime-local 문자열 그대로
                  onChange={(e) =>
                    updateObservation(i, "timestamp", e.target.value)
                  }
                  step="60"
                  className="h-9 text-sm"
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 이동 가능 시간 (isochrone 용) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>마지막 지점 기준 이동 가능 시간</Label>
          <span className="text-sm font-medium">{futureMinutes}분</span>
        </div>
        <Slider
          value={[futureMinutes]}
          onValueChange={([v]) => setFutureMinutes(v)}
          min={1}
          max={60}
          step={1}
        />
      </div>

      {/* 분석 버튼들 */}
      <div className="flex flex-col gap-2">
        <Button
          onClick={handleAnalyzeRoutes}
          disabled={observations.length < 2 || isLoading}
          className="w-full h-12 text-base"
        >
          {isLoading
            ? "분석 중..."
            : `경로 분석 (${observations.length}개 지점)`}{" "}
        </Button>

        <Button
          onClick={handleIsochroneOnly}
          disabled={observations.length < 1 || isLoading}
          variant="outline"
          className="w-full h-11 text-sm"
        >
          {isLoading
            ? "계산 중..."
            : `이동 가능 범위만 표시 (마지막 지점 기준)`}{" "}
        </Button>
      </div>
    </div>
  );
}
