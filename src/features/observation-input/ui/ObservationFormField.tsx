// src/features/observation-input/ui/ObservationFormField.tsx
"use client";

import { Clock, MapPin, Trash2 } from "lucide-react";
import { Controller, type UseFormReturn } from "react-hook-form";
import { cn } from "@/shared/lib/utils";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/shared/ui/accordion";
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
    watch,
    formState: { errors },
  } = form;

  const obsErrors = errors.observations?.[index];
  const watchTimestamp = watch(`observations.${index}.timestamp`);
  const watchLabel = watch(`observations.${index}.label`);

  // hh:mm 형식으로 시간 추출
  const formatTimeSummary = (ts: string) => {
    if (!ts) return "--:--";
    const parts = ts.split("T");
    if (parts.length < 2) return "--:--";
    return parts[1]; // hh:mm
  };

  return (
    <AccordionItem
      value={`item-${index}`}
      className="border rounded-xl px-3 bg-white mb-2 last:mb-0 overflow-hidden shadow-sm transition-all hover:border-blue-100"
    >
      <div className="flex items-center w-full">
        <AccordionTrigger className="hover:no-underline py-4 flex-1">
          <div className="flex items-center justify-between w-full pr-2">
            {/* Left: Index & Time */}
            <div className="flex items-center gap-3 shrink-0">
              <span className="shrink-0 flex items-center justify-center w-6 h-6 text-[10px] font-black bg-gray-900 text-white rounded-md">
                {index + 1}
              </span>
              <div className="flex flex-col items-start -space-y-0.5">
                <span className="text-[13px] font-bold tabular-nums text-gray-700">
                  {formatTimeSummary(watchTimestamp)}
                </span>
              </div>
            </div>

            {/* Right: Label (Place) & Address - Pushed to right */}
            <div className="flex-1 flex flex-col items-end min-w-0 ml-4 text-right">
              <span className="text-[14px] font-black text-gray-900 truncate w-full">
                {watchLabel || "장소 미지정"}
              </span>
              {form.watch(`observations.${index}.address`) && (
                <span className="text-[11px] text-gray-400 truncate w-full font-medium">
                  {form.watch(`observations.${index}.address`)}
                </span>
              )}
            </div>
          </div>
        </AccordionTrigger>

        <div className="flex items-center pr-1 border-l ml-1 pl-1 border-gray-100 shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            aria-label={`관측 #${index + 1} 삭제`}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <AccordionContent className="pt-0 pb-5 space-y-4">
        {/* 위경도 - 화면에서 제거하되 값은 유지 (Hidden inputs) */}
        <input
          type="hidden"
          {...register(`observations.${index}.lat`, { valueAsNumber: true })}
        />
        <input
          type="hidden"
          {...register(`observations.${index}.lng`, { valueAsNumber: true })}
        />

        {/* 시간 (datetime-local) */}
        <div className="space-y-1.5">
          <label
            htmlFor={`ts-${index}`}
            className="text-[13px] font-semibold text-gray-700 flex items-center gap-1.5"
          >
            <Clock className="w-3.5 h-3.5 text-blue-500" />
            관측 시각
          </label>
          <Input
            id={`ts-${index}`}
            type="datetime-local"
            className={cn(
              "h-11 rounded-lg border-gray-200 focus:ring-blue-500/20",
              obsErrors?.timestamp && "border-red-500 focus:ring-red-500/20",
            )}
            {...register(`observations.${index}.timestamp`)}
            aria-invalid={obsErrors?.timestamp ? "true" : "false"}
          />
          {obsErrors?.timestamp && (
            <p className="text-xs text-red-500 mt-1 font-medium" role="alert">
              {obsErrors.timestamp.message}
            </p>
          )}
        </div>

        {/* 주소/장소 */}
        <div className="space-y-1.5">
          <label
            htmlFor={`address-${index}`}
            className="text-[13px] font-semibold text-gray-700 flex items-center gap-1.5"
          >
            <MapPin className="w-3.5 h-3.5 text-red-500" />
            장소 검색
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
            <p className="text-xs text-red-500 mt-1 font-medium" role="alert">
              {obsErrors.address.message as string}
            </p>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
