// ObservationFormFields.tsx
"use client";

import { useSetAtom } from "jotai";
import { Controller, type UseFormReturn } from "react-hook-form";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { observationsAtom } from "../model/atoms";
import type { ObservationFormValues } from "../model/schema";
import { type LocationResult, LocationSearch } from "./LocationSearch";

type Props = {
  index: number;
  form: UseFormReturn<ObservationFormValues>;
  onRemove: () => void;
};

export function ObservationFormFields({ index, form, onRemove }: Props) {
  const {
    register,
    control,
    formState: { errors },
    watch,
    setValue,
  } = form;

  const setObservations = useSetAtom(observationsAtom);

  const tsPath = `observations.${index}.timestamp` as const;
  const currentIso = watch(tsPath);
  console.log({ currentIso });

  const currentDateTimeLocal =
    currentIso && !Number.isNaN(new Date(currentIso).getTime())
      ? (() => {
          const d = new Date(currentIso);
          const offset = d.getTimezoneOffset() * 60000;
          return new Date(d.getTime() - offset).toISOString().slice(0, 16);
        })()
      : "";

  const handleDateTimeChange = (value: string) => {
    if (!value) return;
    const d = new Date(value);
    setValue(tsPath, d.toISOString(), {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    });
  };

  const obsErrors = errors.observations?.[index];

  const applyLocation = (r: LocationResult) => {
    // RHF 값 갱신
    setValue(`observations.${index}.label`, r.label, {
      shouldValidate: true,
      shouldDirty: true,
    });
    setValue(`observations.${index}.address`, r.address, {
      shouldValidate: true,
      shouldDirty: true,
    });
    setValue(`observations.${index}.lat`, r.lat, {
      shouldValidate: true,
      shouldDirty: true,
    });
    setValue(`observations.${index}.lng`, r.lng, {
      shouldValidate: true,
      shouldDirty: true,
    });

    // 지도(Jotai)도 즉시 갱신
    setObservations((prev) => {
      const next = [...prev];
      next[index] = {
        ...(next[index] ?? {
          timestamp: new Date().toISOString(),
        }),
        lat: r.lat,
        lng: r.lng,
        address: r.address,
        label: r.label,
      };
      return next;
    });
  };

  return (
    <div className="border rounded-md p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">관측 #{index + 1}</span>
        <Button type="button" variant="ghost" size="icon" onClick={onRemove}>
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
            {...register(`observations.${index}.lat`, { valueAsNumber: true })}
          />
          {obsErrors?.lat && (
            <p className="text-xs text-red-500">{obsErrors.lat.message}</p>
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
            {...register(`observations.${index}.lng`, { valueAsNumber: true })}
          />
          {obsErrors?.lng && (
            <p className="text-xs text-red-500">{obsErrors.lng.message}</p>
          )}
        </div>
      </div>

      {/* 시간 */}
      <div className="space-y-1">
        <label htmlFor={`ts-${index}`} className="text-xs font-medium">
          시간
        </label>
        <Input
          id={`ts-${index}`}
          type="datetime-local"
          value={currentDateTimeLocal}
          onChange={(e) => handleDateTimeChange(e.target.value)}
        />
        {obsErrors?.timestamp && (
          <p className="text-xs text-red-500">{obsErrors.timestamp.message}</p>
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
              onSelect={applyLocation}
            />
          )}
        />

        {obsErrors?.address && (
          <p className="text-xs text-red-500">
            {obsErrors.address.message as string}
          </p>
        )}
      </div>
    </div>
  );
}
