// src/features/observation-input/ui/ObservationForm.tsx
"use client";

import { useAnalyze } from "@/features/route-analysis/lib/useAnalyze";
import { useIsochrone } from "@/features/map-view/lib/useIsochrone";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAtom, useSetAtom } from "jotai";
import { useEffect, useRef } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import {
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

export function ObservationForm() {
  const [observationsAtomValue, setObservations] = useAtom(observationsAtom);
  const [currentFutureMinutes, setFutureMinutes] = useAtom(futureMinutesAtom);
  const setObservationForm = useSetAtom(observationFormAtom);
  const { analyze } = useAnalyze();
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
    const subscription = form.watch((values, { name }) => {
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
    void analyze();
    void computeIsochrone("walking");
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
    <Card className="p-4 space-y-4">
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <h2 className="text-lg font-semibold">관측 지점 입력</h2>
        <div className="space-y-3">
          {fields.map((field, index) => (
            <ObservationFormFields
              key={field.id}
              index={index}
              form={form}
              onRemove={() => handleRemove(index)}
            />
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={fields.length >= 15}
            onClick={handleAppend}
          >
            관측 지점 추가
          </Button>
        </div>

        <div className="space-y-1">
          <label htmlFor="futureMinutes" className="text-sm font-medium">
            추정 대상 시간(+분)
          </label>
          <Input
            id="futureMinutes"
            type="number"
            min={1}
            max={60}
            {...form.register("futureMinutes", { valueAsNumber: true })}
          />
          {form.formState.errors.futureMinutes && (
            <p className="text-xs text-red-500">
              {form.formState.errors.futureMinutes.message}
            </p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={!canSubmit}>
          분석 시작
        </Button>
        {!canSubmit && (
          <p className="text-xs text-gray-500">
            분석을 시작하려면 관측 지점을 최소 2개 등록해야 합니다.
          </p>
        )}
      </form>
    </Card>
  );
}
