// src/features/observation-input/ui/ObservationFormField.tsx
"use client";

import { Clock, MapPin, Trash2 } from "lucide-react";
import { Controller, type UseFormReturn, useWatch } from "react-hook-form";
import { cn } from "@/shared/lib/utils";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  AccordionTriggerContent,
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
    formState: { errors },
  } = form;

  const obsErrors = errors.observations?.[index];
  const watchTimestamp = useWatch({
    control,
    name: `observations.${index}.timestamp`,
  });

  const watchLabel = useWatch({
    control,
    name: `observations.${index}.label`,
  });

  const watchAddress = useWatch({
    control,
    name: `observations.${index}.address`,
  });

  return (
    <AccordionItem
      value={`item-${index}`}
      className="border rounded-xl px-3 bg-white mb-2 last:mb-0 overflow-hidden shadow-sm transition-all hover:border-blue-100"
    >
      <div className="flex items-center w-full">
        <AccordionTrigger className="hover:no-underline py-4 flex-1">
          <AccordionTriggerContent
            index={index}
            watchTimestamp={watchTimestamp}
            watchLabel={watchLabel}
            watchAddress={watchAddress}
          />
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
