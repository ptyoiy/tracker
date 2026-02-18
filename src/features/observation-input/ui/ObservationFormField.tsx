// src/features/observation-input/ui/ObservationFormField.tsx
"use client";

import { Controller, type UseFormReturn } from "react-hook-form";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import type { ObservationFormValuesRaw } from "../model/schema";
import { type LocationResult, LocationSearch } from "./LocationSearch";

type Props = {
  index: number;
  form: UseFormReturn<ObservationFormValuesRaw>;
  onRemove: () => void;
};

export function ObservationFormFields({ index, form, onRemove }: Props) {
  const {
    register,
    control,
    formState: { errors },
  } = form;

  const obsErrors = errors.observations?.[index];

  return (
    <div className="border rounded-md p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">관측 #{index + 1}</span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onRemove}
          aria-label={`관측 #${index + 1} 삭제`}
        >
          ✕
        </Button>
      </div>

      {/* 위경도 */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label htmlFor={`lat-${index}`} className="text-xs font-medium">
            위도(lat)
          </label>
          <Input
            id={`lat-${index}`}
            type="number"
            step="any"
            inputMode="decimal"
            {...register(`observations.${index}.lat`, { valueAsNumber: true })}
            aria-invalid={obsErrors?.lat ? "true" : "false"}
          />
          {obsErrors?.lat && (
            <p className="text-xs text-red-500" role="alert">
              {obsErrors.lat.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor={`lng-${index}`} className="text-xs font-medium">
            경도(lng)
          </label>
          <Input
            id={`lng-${index}`}
            type="number"
            step="any"
            inputMode="decimal"
            {...register(`observations.${index}.lng`, { valueAsNumber: true })}
            aria-invalid={obsErrors?.lng ? "true" : "false"}
          />
          {obsErrors?.lng && (
            <p className="text-xs text-red-500" role="alert">
              {obsErrors.lng.message}
            </p>
          )}
        </div>
      </div>

      {/* 시간 (datetime-local, RHF에 그대로 맡김) */}
      <div className="space-y-1">
        <label htmlFor={`ts-${index}`} className="text-xs font-medium">
          시간
        </label>
        <Input
          id={`ts-${index}`}
          type="datetime-local"
          {...register(`observations.${index}.timestamp`)}
          aria-invalid={obsErrors?.timestamp ? "true" : "false"}
        />
        {obsErrors?.timestamp && (
          <p className="text-xs text-red-500" role="alert">
            {obsErrors.timestamp.message}
          </p>
        )}
      </div>

      {/* 주소/장소 (Controller + LocationSearch) */}
      <div className="space-y-1">
        <label htmlFor={`address-${index}`} className="text-xs font-medium">
          주소 / 장소
        </label>

        <Controller
          control={control}
          name={`observations.${index}.label`}
          render={({ field }) => (
            <LocationSearch
              id={`address-${index}`}
              value={field.value ?? ""}
              onChange={(v) => field.onChange(v)}
              onSelect={(r: LocationResult) => {
                // RHF 값만 갱신, atom은 submit 시 동기화
                form.setValue(`observations.${index}.label`, r.label, {
                  shouldValidate: true,
                  shouldDirty: true,
                });
                form.setValue(`observations.${index}.address`, r.address, {
                  shouldValidate: true,
                  shouldDirty: true,
                });
                form.setValue(`observations.${index}.lat`, r.lat, {
                  shouldValidate: true,
                  shouldDirty: true,
                });
                form.setValue(`observations.${index}.lng`, r.lng, {
                  shouldValidate: true,
                  shouldDirty: true,
                });
              }}
            />
          )}
        />

        {obsErrors?.address && (
          <p className="text-xs text-red-500" role="alert">
            {obsErrors.address.message as string}
          </p>
        )}
      </div>
    </div>
  );
}
