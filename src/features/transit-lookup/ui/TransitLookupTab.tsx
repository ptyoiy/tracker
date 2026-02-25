"use client";

import { useAtom } from "jotai";
import { ArrowRight, Loader2, MapPin } from "lucide-react";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { useTransitLookup } from "../lib/useTransitLookup";
import { transitLookupPickingAtom } from "../model/atoms";

export function TransitLookupTab() {
  const { start, end, time, setTime, result, loading, lookup } =
    useTransitLookup();
  const [picking, setPicking] = useAtom(transitLookupPickingAtom);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="grid gap-2">
          <Label>출발지</Label>
          <div className="flex gap-2">
            <div className="flex-1 px-3 py-2 border rounded-md bg-gray-50 text-xs truncate">
              {start
                ? `${start.lat.toFixed(5)}, ${start.lng.toFixed(5)}`
                : "지도에서 선택하세요"}
            </div>
            <Button
              size="sm"
              variant={picking === "start" ? "default" : "outline"}
              onClick={() => setPicking(picking === "start" ? null : "start")}
            >
              <MapPin className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="grid gap-2">
          <Label>목적지</Label>
          <div className="flex gap-2">
            <div className="flex-1 px-3 py-2 border rounded-md bg-gray-50 text-xs truncate">
              {end
                ? `${end.lat.toFixed(5)}, ${end.lng.toFixed(5)}`
                : "지도에서 선택하세요"}
            </div>
            <Button
              size="sm"
              variant={picking === "end" ? "default" : "outline"}
              onClick={() => setPicking(picking === "end" ? null : "end")}
            >
              <MapPin className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="grid gap-2">
          <Label>조회 시각</Label>
          <Input
            type="datetime-local"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
        </div>

        <Button
          className="w-full"
          disabled={loading || !start || !end}
          onClick={lookup}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          경로 조회
        </Button>
      </div>

      {picking && (
        <div className="rounded-lg bg-orange-50 p-3 border border-orange-100 text-xs text-orange-800">
          📍 지도의 특정 지점을 클릭하여{" "}
          <strong>{picking === "start" ? "출발지" : "목적지"}</strong>를
          선택하세요.
        </div>
      )}

      {result && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold">조회 결과</h3>
          <Card className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold">
                {Math.round(result.durationSeconds / 60)}분
              </span>
              <span className="text-sm text-gray-500">
                {(result.distanceMeters / 1000).toFixed(1)}km
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {result.legs.map((leg, idx) => (
                <div
                  key={`${leg.mode}-${idx}`}
                  className="flex items-center gap-1"
                >
                  <Badge variant={leg.mode === "WALK" ? "outline" : "default"}>
                    {leg.mode}
                  </Badge>
                  {idx < result.legs.length - 1 && (
                    <ArrowRight className="w-3 h-3 text-gray-400" />
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
