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
import { formSchema, type ObservationFormValues } from "../model/schema";
import { ObservationFormFields } from "./ObservationFormField";

export function ObservationForm() {
  const [observations, setObservations] = useAtom(observationsAtom);
  const currentFutureMinutes = useAtomValue(futureMinutesAtom);
  const setObservationForm = useSetAtom(observationFormAtom);
  const { analyze } = useAnalyze();

  const form = useForm<ObservationFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      observations,
      futureMinutes: currentFutureMinutes,
    },
    mode: "onBlur",
  });

  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: "observations",
  });

  // 1) atom -> RHF: 지도 클릭 등으로 observationsAtom이 바뀌면 폼에 반영
  useEffect(() => {
    console.log({ observations });
    replace(observations);
  }, [observations, replace]);

  const watchObservations = form.watch("observations");
  const canSubmit = watchObservations.length >= 2;

  const onSubmit = (values: ObservationFormValues) => {
    setObservationForm(values);
    void analyze(); // 분석 호출
  };

  // 관측 추가 버튼은 atom에도 반영
  const handleAppend = () => {
    const newObs = {
      lat: 37.5665,
      lng: 126.978,
      timestamp: new Date().toISOString(),
      label: "",
      address: "",
    };
    append(newObs);
    setObservations((prev) => [...prev, newObs]);
  };

  // remove도 atom과 동기화
  const handleRemove = (index: number) => {
    remove(index);
    setObservations((prev) => prev.filter((_, i) => i !== index));
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
