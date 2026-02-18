// src/features/observation-input/ui/ObservationForm.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useEffect } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { useAnalyze } from "@/features/route-analysis/lib/useAnalyze";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
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
  const currentFutureMinutes = useAtomValue(futureMinutesAtom);
  const setObservationForm = useSetAtom(observationFormAtom);
  const { analyze } = useAnalyze();

  // RHF는 datetime-local 문자열을 사용
  const form = useForm<ObservationFormValuesRaw>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      observations: observationsAtomValue.map((o) => ({
        ...o,
        // atom에는 ISO가 들어있다고 가정, 폼에는 로컬 문자열로 변환
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

  // atom -> RHF: 지도 클릭 등으로 observationsAtom이 바뀌면 폼에 반영
  useEffect(() => {
    replace(
      observationsAtomValue.map((o) => ({
        ...o,
        timestamp: toLocalDatetimeInput(o.timestamp),
      })),
    );
  }, [observationsAtomValue, replace]);

  const watchObservations = form.watch("observations");
  const canSubmit = watchObservations.length >= 2;

  const onSubmit = (values: ObservationFormValuesRaw) => {
    // 1) datetime-local -> ISO 변환
    const normalizedObservations: ObservationFormValues["observations"] =
      values.observations.map((o) => ({
        ...o,
        timestamp: new Date(o.timestamp).toISOString(),
      }));

    const normalized: ObservationFormValues = {
      observations: normalizedObservations,
      futureMinutes: values.futureMinutes,
    };

    // 2) atom에 최종값 반영 (단일 방향: RHF -> atom)
    setObservationForm(normalized);
    setObservations(normalizedObservations);

    // 3) 분석 호출
    void analyze();
  };

  // 관측 추가 버튼 (폼만 건드림, atom은 submit 시 동기화)
  const handleAppend = () => {
    const nowIso = new Date().toISOString();
    const localNow = toLocalDatetimeInput(nowIso);

    const newObs = {
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
      <h2 className="text-lg font-semibold">관측 지점 입력</h2>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
