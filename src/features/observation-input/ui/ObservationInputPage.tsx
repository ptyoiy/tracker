"use client";

import { useAtom } from "jotai";
import React, { useEffect, useState } from "react";
import { MapView } from "@/features/map-view/ui/MapView";
import {
  FormSchema,
  Observation,
} from "@/features/observation-input/model/schema";
import { ObservationForm } from "@/features/observation-input/ui/ObservationForm";
import { Button } from "@/shared/ui/button";

import {
  activeTabAtom,
  analysisResultAtom,
  futureMinutesAtom,
  isLoadingAtom,
  isochroneDataAtom,
  observationsAtom,
} from "@/store/atoms";

export function ObservationInputPage() {
  const [observations, setObservations] = useAtom(observationsAtom);
  const [isLoading] = useAtom(isLoadingAtom);
  const [activeTab, setActiveTab] = useAtom(activeTabAtom);
  const [futureMinutes, setFutureMinutes] = useAtom(futureMinutesAtom);

  // State to manage which observation is currently active (focused/selected) for form input and map highlighting.
  // This state is managed by the parent component to coordinate between Form and Map.
  const [activeObservationIndex, setActiveObservationIndex] = useState<
    number | null
  >(null);

  // Handler for when a map point is clicked.
  // This will update the selected observation in the form and potentially add a new one.
  const handleMapClick = (coords: { lat: number; lng: number }) => {
    // Check if there's an active observation to update
    if (
      activeObservationIndex !== null &&
      activeObservationIndex < observations.length
    ) {
      setObservations((prevObservations) =>
        prevObservations.map((obs, index) =>
          index === activeObservationIndex
            ? { ...obs, lat: coords.lat, lng: coords.lng, address: undefined } // Clear address on coordinate change
            : obs,
        ),
      );
    } else if (observations.length < 7) {
      // If no active observation or below max, add a new one
      const currentTime = new Date();
      // Use the existing format from ObservationForm
      const defaultTimestamp = currentTime.toISOString().slice(0, 16);

      setObservations((prevObservations) => [
        ...prevObservations,
        {
          lat: coords.lat,
          lng: coords.lng,
          timestamp: defaultTimestamp,
          address: undefined, // Address will be fetched
        },
      ]);
      // Set the newly added observation as active
      setActiveObservationIndex(observations.length);
    }
  };

  // Effect to update activeObservationIndex when observations array changes, e.g., after adding/removing points.
  // This ensures the map marker and form field highlighting stay synchronized.
  useEffect(() => {
    // If the active index is out of bounds (e.g., after removing an item),
    // reset it or set it to the last available index.
    if (
      activeObservationIndex !== null &&
      activeObservationIndex >= observations.length
    ) {
      if (observations.length > 0) {
        setActiveObservationIndex(observations.length - 1);
      } else {
        setActiveObservationIndex(null);
      }
    }
  }, [observations, activeObservationIndex]);

  // The 'initialObservations' for ObservationForm should come from the 'observationsAtom'
  // and the 'activeObservationIndex' should be managed here and passed down.

  return (
    <div className="flex flex-col h-screen lg:flex-row">
      {/* Input Panel (ObservationForm) */}
      <div
        className={`w-full lg:w-1/3 p-4 overflow-y-auto transition-all duration-300 ease-in-out ${activeTab === "input" ? "block" : "hidden lg:block"}`}
      >
        <h2 className="text-xl font-semibold mb-4">발견 지점 입력</h2>
        <ObservationForm
          initialObservations={observations} // Pass observations from atom
          setActiveObservationIndex={setActiveObservationIndex}
          onMapClickCoordinates={handleMapClick} // Use the parent's handler
        />
      </div>

      {/* Map Panel */}
      <div
        className={`w-full lg:w-2/3 h-full transition-all duration-300 ease-in-out ${activeTab === "map" ? "block" : "hidden lg:block"}`}
      >
        <h2 className="text-xl font-semibold mb-4 px-4 pt-4">지도</h2>
        <MapView
          observations={observations}
          activeObservationIndex={activeObservationIndex}
          onMapClick={handleMapClick} // Pass the parent's handler directly to MapView
        />
      </div>
    </div>
  );
}
