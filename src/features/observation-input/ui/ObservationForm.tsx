// src/features/observation-input/ui/ObservationForm.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { Plus } from "lucide-react";
import { useEffect, useRef } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { useIsochrone } from "@/features/map-view/lib/useIsochrone";
import { useAnalyzeMutation } from "@/features/route-analysis/api/useAnalyzeMutation";
import {
  analysisResultAtom,
  lastAnalysisParamsAtom,
} from "@/features/route-analysis/model/atoms";
import { Accordion } from "@/shared/ui/accordion";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { Slider } from "@/shared/ui/slider";
import { activeSectionAtom, bottomSheetSnapAtom } from "@/store/atoms";
import {
  committedFutureMinutesAtom,
  futureMinutesAtom,
  observationFormAtom,
  observationsAtom,
} from "../model/atoms";
import {
  formSchema,
  type ObservationFormValues,
  type ObservationFormValuesRaw,
} from "../model/schema";
import { ObservationFormFields } from "./ObservationFormField";

// datetime-local 형식으로 초기값 생성
function toLocalDatetimeInput(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().slice(0, 16);
}

import { useQuery } from "@tanstack/react-query";
import { analyzeQueries } from "@/shared/api/queries";

export function ObservationForm() {
  const [observationsAtomValue, setObservations] = useAtom(observationsAtom);
  const [currentFutureMinutes, setFutureMinutes] = useAtom(futureMinutesAtom);
  const setCommittedMinutes = useSetAtom(committedFutureMinutesAtom);
  const analysisResult = useAtomValue(analysisResultAtom);
  const [lastParams, setLastParams] = useAtom(lastAnalysisParamsAtom);

  const { data: analysisData } = useQuery(
    analyzeQueries.segments(
      lastParams?.observations,
      lastParams?.futureMinutes,
    ),
  );

  const hasSegments =
    !!analysisData?.segments && analysisData.segments.length > 0;
  const { mutateAsync: analyze, isPending: isAnalyzing } = useAnalyzeMutation();
  const setObservationForm = useSetAtom(observationFormAtom);
  const setActiveSection = useSetAtom(activeSectionAtom);
  const setSnap = useSetAtom(bottomSheetSnapAtom);
  const { computeIsochrone } = useIsochrone();

  const isInternalUpdate = useRef(false);

  const form = useForm<ObservationFormValuesRaw>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      observations: observationsAtomValue.map((o) => ({
        ...o,
        timestamp: toLocalDatetimeInput(o.timestamp),
      })),
      futureMinutes: currentFutureMinutes,
    },
    mode: "onBlur",
  });

  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: "observations",
  });

  // 1) Atom -> Form: 외부(지도 등)에서 데이터가 변경된 경우에만 폼 업데이트
  useEffect(() => {
    if (isInternalUpdate.current) return;

    // 현재 폼의 값과 Atom의 값을 비교하여 실제 차이가 있을 때만 replace
    const currentFormValues = form.getValues("observations");
    const isDifferent =
      observationsAtomValue.length !== currentFormValues.length ||
      observationsAtomValue.some((obs, i) => {
        const formObs = currentFormValues[i];
        if (!formObs) return true;
        return (
          obs.id !== formObs.id ||
          obs.lat !== formObs.lat ||
          obs.lng !== formObs.lng ||
          toLocalDatetimeInput(obs.timestamp) !== formObs.timestamp
        );
      });

    if (isDifferent) {
      isInternalUpdate.current = true;
      replace(
        observationsAtomValue.map((o) => ({
          ...o,
          timestamp: toLocalDatetimeInput(o.timestamp),
        })),
      );
      // RHF의 replace가 완료된 후 플래그 해제 (다음 틱)
      setTimeout(() => {
        isInternalUpdate.current = false;
      }, 0);
    }
  }, [observationsAtomValue, replace, form]);

  // 2) Form -> Atom: 폼에서 직접 수정이 발생한 경우에만 Atom 업데이트
  useEffect(() => {
    const subscription = form.watch((values) => {
      // 폼 내부 업데이트(replace 등) 중이거나 필요한 값이 없으면 무시
      if (isInternalUpdate.current || !values.observations) return;

      const normalizedObservations = values.observations.map((o) => ({
        ...o,
        id: o?.id ?? crypto.randomUUID(),
        lat: o?.lat ?? 0,
        lng: o?.lng ?? 0,
        timestamp: o?.timestamp
          ? new Date(o.timestamp).toISOString()
          : new Date().toISOString(),
        label: o?.label ?? "",
        address: o?.address ?? "",
      }));

      // 실제 데이터가 다른 경우에만 Atom 업데이트
      const isActuallyDifferent =
        JSON.stringify(normalizedObservations) !==
        JSON.stringify(observationsAtomValue);

      if (isActuallyDifferent) {
        setObservations(normalizedObservations);
      }

      if (
        typeof values.futureMinutes === "number" &&
        values.futureMinutes !== currentFutureMinutes
      ) {
        setFutureMinutes(values.futureMinutes);
      }
    });

    return () => subscription.unsubscribe();
  }, [
    form,
    observationsAtomValue,
    currentFutureMinutes,
    setObservations,
    setFutureMinutes,
  ]);

  const watchObservations = form.watch("observations");
  const canSubmit = watchObservations.length >= 2;

  const onSubmit = (values: ObservationFormValuesRaw) => {
    // 최종 분석 시에는 정렬하여 반영
    const normalizedObservations: ObservationFormValues["observations"] =
      values.observations.map((o) => ({
        ...o,
        timestamp: new Date(o.timestamp).toISOString(),
      }));

    const normalized: ObservationFormValues = {
      observations: normalizedObservations,
      futureMinutes: values.futureMinutes,
    };

    setObservationForm(normalized);
    setLastParams({
      observations: normalizedObservations,
      futureMinutes: values.futureMinutes,
    });
    void analyze(normalized);
    void computeIsochrone("walking");

    // 경로 분석 결과 탭 자동 활성화 및 Drawer 상태 변경
    setActiveSection("route");
    setSnap(0.5);
  };

  // 관측 추가 버튼 (폼만 건드림, atom은 submit 시 동기화)
  const handleAppend = () => {
    const nowIso = new Date().toISOString();
    const localNow = toLocalDatetimeInput(nowIso);

    const newObs = {
      id: crypto.randomUUID(),
      lat: 37.5665,
      lng: 126.978,
      timestamp: localNow,
      label: "",
      address: "",
    };

    append(newObs);
  };

  const handleRemove = (index: number) => {
    remove(index);
  };

  return (
    <Card className="px-5 pb-5 pt-0 space-y-6 shadow-none border-none bg-gray-50/50">
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-3">
          <Accordion type="single" collapsible className="w-full">
            {fields.map((field, index) => (
              <ObservationFormFields
                key={field.id}
                index={index}
                form={form}
                onRemove={() => handleRemove(index)}
              />
            ))}
          </Accordion>

          <Button
            type="button"
            variant="outline"
            className="w-full h-12 border-dashed border-2 text-gray-500 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-all rounded-xl gap-2"
            disabled={fields.length >= 15}
            onClick={handleAppend}
          >
            <Plus className="w-4 h-4" />
            관측 지점 추가
          </Button>
        </div>

        <div className="space-y-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center">
            <label
              htmlFor="futureMinutes"
              className="text-sm font-bold text-gray-700"
            >
              최대 이동 가능 범위 (분)
            </label>
            <span className="text-sm font-bold text-blue-600">
              {form.watch("futureMinutes")}분 후
            </span>
          </div>
          <div className="px-1 py-2">
            <Slider
              value={[form.watch("futureMinutes")]}
              min={1}
              max={60}
              step={1}
              onValueChange={(val) =>
                form.setValue("futureMinutes", val[0] ?? 1)
              }
              onValueCommit={(val) => {
                if (val[0]) setCommittedMinutes(val[0]);
              }}
            />
          </div>
          {form.formState.errors.futureMinutes && (
            <p className="text-xs text-red-500 font-medium">
              {form.formState.errors.futureMinutes.message}
            </p>
          )}
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            className="w-full h-14 text-[16px] font-bold rounded-xl shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-transform"
            disabled={!canSubmit || isAnalyzing}
          >
            {isAnalyzing
              ? "분석 중..."
              : analysisResult.stale
                ? "재분석하기"
                : hasSegments
                  ? "다시 분석하기"
                  : "경로 분석 시작"}
          </Button>
          {!canSubmit && (
            <p className="text-center text-[12px] text-gray-400 mt-3 font-medium">
              분석을 시작하려면 최소 2개의 관측 지점이 필요합니다.
            </p>
          )}
        </div>
      </form>
    </Card>
  );
}
