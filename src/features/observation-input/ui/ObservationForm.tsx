"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useAtom, useSetAtom } from "jotai";
import ky from "ky";
import React, { useEffect, useState } from "react";
import {
  Controller,
  FormProvider,
  useFieldArray,
  useForm,
} from "react-hook-form";
import type { TmapDrivingResponse } from "@/shared/api/tmap/driving"; // Assuming this path is correct
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Slider } from "@/shared/ui/slider";
import {
  activeTabAtom,
  analysisResultAtom,
  isLoadingAtom,
  isochroneDataAtom,
  // observationsAtom, // We will manage observations via RHF, so this might not be needed for form state
} from "@/store/atoms";
import { type FormSchema, formSchema, type Observation } from "../model/schema"; // Corrected path

// Helper to format Date object to "YYYY-MM-DDTHH:mm" for datetime-local input
function toDatetimeLocalMinutesOnly(value: string | Date) {
  const d = value instanceof Date ? value : new Date(value);

  // Local time adjustment
  const local = new Date(d.getTime());

  const year = local.getFullYear();
  const month = String(local.getMonth() + 1).padStart(2, "0");
  const day = String(local.getDate()).padStart(2, "0");
  const hours = String(local.getHours()).padStart(2, "0");
  const minutes = String(local.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

interface ObservationFormProps {
  // Callback to receive coordinates from MapView
  onMapClickCoordinates?: (coords: { lat: number; lng: number }) => void;
  // Callback to set focus on a specific observation field
  setActiveObservationIndex?: (index: number) => void;
  initialObservations?: Observation[]; // For pre-populating
}

export function ObservationForm({
  onMapClickCoordinates,
  setActiveObservationIndex,
  initialObservations = [],
}: ObservationFormProps) {
  const [isLoading, setIsLoading] = useAtom(isLoadingAtom);
  const setAnalysisResult = useSetAtom(analysisResultAtom);
  const setIsochroneData = useSetAtom(isochroneDataAtom);
  const setActiveTab = useSetAtom(activeTabAtom);

  const methods = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      observations: initialObservations,
      futureMinutes: 10, // Default value from schema, will be overridden if Jotai atom exists
    },
  });

  const {
    handleSubmit,
    control,
    formState: { errors, isValid, isDirty },
    setValue,
    getValues,
    watch,
    reset, // To reset form with new values
  } = methods;

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: "observations",
  });

  // Watch for changes in observations (lat, lng, timestamp) to trigger geocoding and validation
  const observationsWatched = watch("observations");

  // State to track the currently active observation index for highlighting
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // Geocoding effect
  useEffect(() => {
    const geocodeObservation = async (
      obs: Observation & { id: string },
      index: number,
    ) => {
      // Only geocode if lat/lng are valid and address is not yet set or is an error message
      if (
        obs.lat >= 33 &&
        obs.lat <= 38 &&
        obs.lng >= 124 &&
        obs.lng <= 132 &&
        (obs.address === undefined || obs.address === "주소 확인 불가")
      ) {
        try {
          const response = await ky.post("/api/geocode", {
            json: { lat: obs.lat, lng: obs.lng },
          });
          if (response.ok) {
            const data = await response.json();
            console.log("Geocoding result:", { data });
            setValue(`observations.${index}.address`, data.address);
          } else {
            setValue(`observations.${index}.address`, "주소 확인 불가");
          }
        } catch (error) {
          console.error("Geocoding error:", error);
          setValue(`observations.${index}.address`, "주소 확인 불가");
        }
      }
    };

    // Debounce geocoding to avoid excessive API calls
    const debounceTimer = setTimeout(() => {
      observationsWatched.forEach((obs, index) => {
        // Trigger geocoding if lat/lng are valid and address is not set
        // Check if lat/lng are valid numbers before proceeding
        if (
          typeof obs.lat === "number" &&
          typeof obs.lng === "number" &&
          !obs.address
        ) {
          geocodeObservation(obs as Observation & { id: string }, index); // Cast to allow index access
        }
      });
    }, 500); // 500ms debounce

    return () => clearTimeout(debounceTimer);
  }, [observationsWatched, setValue]); // Re-run when observations array changes

  // Handler for adding a new observation point
  const handleAddObservation = () => {
    // Check if observations array is already at max capacity
    if (fields.length >= 7) {
      // Using the max value from formSchema
      console.warn("Maximum number of observations reached.");
      return;
    }

    // Add a new observation with default values
    const currentTime = new Date();
    const defaultTimestamp = toDatetimeLocalMinutesOnly(currentTime);

    append({
      lat: 37.5665, // Default to Seoul, South Korea
      lng: 126.978,
      timestamp: defaultTimestamp,
      address: undefined, // Address will be fetched
    });
  };

  // Handler for removing an observation point
  const removeObservation = (index: number) => {
    remove(index);
    if (activeIndex === index) {
      setActiveIndex(null); // Clear active index if the removed item was active
    }
  };

  // Handler for when a map point is clicked
  // This function would be passed down to MapView
  const handleMapClick = (coords: { lat: number; lng: number }) => {
    if (activeIndex !== null && activeIndex < fields.length) {
      // Update the currently active observation
      setValue(`observations.${activeIndex}.lat`, coords.lat);
      setValue(`observations.${activeIndex}.lng`, coords.lng);
      // Address will be updated via the useEffect hook watching lat/lng changes
      if (setActiveObservationIndex) {
        setActiveObservationIndex(activeIndex); // Keep it active visually
      }
    } else if (fields.length < 7) {
      // Check if we can add a new observation
      // If no field is active, or we are below max capacity, add a new observation
      const currentTime = new Date();
      const defaultTimestamp = toDatetimeLocalMinutesOnly(currentTime);
      append({
        lat: coords.lat,
        lng: coords.lng,
        timestamp: defaultTimestamp,
        address: undefined, // Address will be fetched
      });
      // Set the newly appended field as active
      setActiveIndex(fields.length); // The new field will be at this index
      if (setActiveObservationIndex) {
        setActiveObservationIndex(fields.length);
      }
    }
  };

  // Re-apply initial observations if they change (e.g., from a parent component)
  useEffect(() => {
    if (initialObservations.length > 0) {
      reset({
        observations: initialObservations,
        futureMinutes: 10, // Or fetch from Jotai atom if managed globally
      });
    }
  }, [initialObservations, reset]);

  // Handler for analysis submission
  const onSubmit = handleSubmit(async (data) => {
    setIsLoading(true);
    try {
      // Normalize timestamps to ISO string for API
      const normalizedObservations = data.observations.map((obs) => ({
        ...obs,
        timestamp: new Date(obs.timestamp).toISOString(),
      }));

      // Auto-sort by timestamp as per requirement 5
      normalizedObservations.sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
      );

      // 1. Route Analysis API Call
      const analyzeResult = await ky
        .post("/api/analyze", {
          json: {
            observations: normalizedObservations,
            futureMinutes: data.futureMinutes,
          },
        })
        .json();
      setAnalysisResult(analyzeResult as any);

      // 2. Isochrone API Call (based on the last observation)
      const lastObs = normalizedObservations[normalizedObservations.length - 1];
      const isoResult = await ky
        .post<TmapDrivingResponse>("/api/isochrone", {
          json: {
            lat: lastObs.lat,
            lng: lastObs.lng,
            minutes: data.futureMinutes, // Use futureMinutes from form
            profile: "walking", // Assuming walking profile
          },
        })
        .json();
      setIsochroneData(isoResult);

      // Switch to the map tab after successful analysis
      setActiveTab("map");
    } catch (error) {
      console.error("Analysis failed:", error);
      // Handle API errors, e.g., show a user-facing error message
    } finally {
      setIsLoading(false);
    }
  });

  // Handler for displaying only the isochrone area
  const handleIsochroneOnly = handleSubmit(async (data) => {
    setIsLoading(true);
    try {
      const lastObs = data.observations[data.observations.length - 1];
      const isoResult = await ky
        .post<TmapDrivingResponse>("/api/isochrone", {
          json: {
            lat: lastObs.lat,
            lng: lastObs.lng,
            minutes: data.futureMinutes,
            profile: "walking",
          },
        })
        .json();
      setIsochroneData(isoResult);
      setActiveTab("map");
    } catch (error) {
      console.error("Isochrone calculation failed:", error);
    } finally {
      setIsLoading(false);
    }
  });

  return (
    <FormProvider {...methods}>
      <div className="space-y-4">
        {/* Instructions */}
        <div className="text-sm text-muted-foreground">
          지도 탭에서 위치를 탭하거나, 아래에서 직접 수정하세요.
        </div>

        {/* Discovery Points List */}
        <div className="space-y-3">
          {fields.length === 0 && (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                아직 발견 지점이 없습니다.
                <br />
                <Button
                  variant="link"
                  className="p-0 h-auto"
                  onClick={() => {
                    setActiveTab("map"); // Switch to map tab
                    // Optionally, trigger a state update to indicate adding a new point on map
                  }}
                >
                  지도 탭에서 추가하기
                </Button>
              </CardContent>
            </Card>
          )}

          {fields.map((field, index) => (
            <Card key={field.id}>
              <CardContent className="p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="outline">지점 {index + 1}</Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive h-6 px-2"
                    onClick={() => removeObservation(index)}
                    disabled={fields.length <= 2} // Minimum 2 observations required
                  >
                    삭제
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      위도
                    </Label>
                    <Controller
                      name={`observations.${index}.lat`}
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          type="number"
                          step="0.0001"
                          value={field.value ?? ""} // Handle potential undefined/null
                          onChange={(e) => {
                            field.onChange(e); // Update RHF state
                            setActiveIndex(index); // Set this field as active
                            if (setActiveObservationIndex)
                              setActiveObservationIndex(index);
                          }}
                          className={`h-9 text-sm ${activeIndex === index ? "border-blue-500" : ""}`}
                          onFocus={() => {
                            setActiveIndex(index);
                            if (setActiveObservationIndex)
                              setActiveObservationIndex(index);
                          }}
                        />
                      )}
                    />
                    {/* Display validation error for lat */}
                    {errors.observations?.[index]?.lat && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.observations[index].lat.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      경도
                    </Label>
                    <Controller
                      name={`observations.${index}.lng`}
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          type="number"
                          step="0.0001"
                          value={field.value ?? ""} // Handle potential undefined/null
                          onChange={(e) => {
                            field.onChange(e); // Update RHF state
                            setActiveIndex(index); // Set this field as active
                            if (setActiveObservationIndex)
                              setActiveObservationIndex(index);
                          }}
                          className={`h-9 text-sm ${activeIndex === index ? "border-blue-500" : ""}`}
                          onFocus={() => {
                            setActiveIndex(index);
                            if (setActiveObservationIndex)
                              setActiveObservationIndex(index);
                          }}
                        />
                      )}
                    />
                    {/* Display validation error for lng */}
                    {errors.observations?.[index]?.lng && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.observations[index].lng.message}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">
                    발견 시각
                  </Label>
                  <Controller
                    name={`observations.${index}.timestamp`}
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        type="datetime-local"
                        value={
                          field.value
                            ? toDatetimeLocalMinutesOnly(field.value)
                            : ""
                        }
                        onChange={(e) => {
                          field.onChange(e); // Update RHF state
                          setActiveIndex(index);
                          if (setActiveObservationIndex)
                            setActiveObservationIndex(index);
                        }}
                        step="60"
                        className={`h-9 text-sm ${activeIndex === index ? "border-blue-500" : ""}`}
                        onFocus={() => {
                          setActiveIndex(index);
                          if (setActiveObservationIndex)
                            setActiveObservationIndex(index);
                        }}
                      />
                    )}
                  />
                  {/* Display validation error for timestamp */}
                  {errors.observations?.[index]?.timestamp && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.observations[index].timestamp.message}
                    </p>
                  )}
                </div>
                {/* Address Display */}
                <div className="mt-1">
                  <Label className="text-xs text-muted-foreground">주소</Label>
                  <Controller
                    name={`observations.${index}.address`}
                    control={control}
                    render={({ field }) => (
                      <p className="text-sm text-gray-500 break-words">
                        {field.value ||
                          "주소를 입력하거나 지도에서 선택하세요."}
                      </p>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Add Observation Button */}
        <Button
          onClick={handleAddObservation}
          disabled={fields.length >= 7} // Disable if max observations reached
          variant="outline"
          className="w-full h-10 text-sm"
        >
          + 발견 지점 추가
        </Button>

        {/* Future Minutes Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>마지막 지점 기준 이동 가능 시간</Label>
            <span className="text-sm font-medium">
              {watch("futureMinutes")}분
            </span>
          </div>
          <Controller
            name="futureMinutes"
            control={control}
            render={({ field }) => (
              <Slider
                value={[field.value]}
                onValueChange={(v) => field.onChange(v[0])}
                min={1}
                max={60}
                step={1}
              />
            )}
          />
        </div>

        {/* Analysis Buttons */}
        <div className="flex flex-col gap-2">
          <Button
            onClick={onSubmit} // onSubmit is from handleSubmit
            disabled={fields.length < 2 || isLoading}
            className="w-full h-12 text-base"
          >
            {isLoading ? "분석 중..." : `경로 분석 (${fields.length}개 지점)`}
          </Button>

          <Button
            onClick={handleIsochroneOnly} // handleIsochroneOnly is from handleSubmit
            disabled={fields.length < 1 || isLoading}
            variant="outline"
            className="w-full h-11 text-sm"
          >
            {isLoading
              ? "계산 중..."
              : `이동 가능 범위만 표시 (마지막 지점 기준)`}
          </Button>
        </div>
      </div>
    </FormProvider>
  );
}
