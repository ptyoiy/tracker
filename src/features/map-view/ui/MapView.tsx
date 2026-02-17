"use client";

import React, { useEffect, useRef, useState } from "react";
import { Map as KakaoMap, MapMarker } from "react-kakao-maps-sdk";
import type { Observation } from "@/features/observation-input/model/schema";

interface MapViewProps {
  observations: Observation[];
  // Index of the observation that is currently active in the form.
  // Used to highlight the corresponding marker on the map.
  activeObservationIndex: number | null;
  // Callback function to be executed when the map is clicked.
  // It receives the latitude and longitude of the click event.
  onMapClick: (coords: { lat: number; lng: number }) => void;
}

export function MapView({
  observations,
  activeObservationIndex,
  onMapClick,
}: MapViewProps) {
  const [map, setMap] = useState<kakao.maps.Map>();
  const mapInstanceRef = useRef<kakao.maps.Map | null>(null);

  const defaultCenter = { lat: 37.5665, lng: 126.978 }; // Default to Seoul

  // Determine the center of the map
  let mapCenter = defaultCenter;
  if (observations.length > 0) {
    // If an observation is active and has valid coordinates, center on it.
    // Otherwise, center on the first observation if available.
    const targetIndex =
      activeObservationIndex !== null &&
      activeObservationIndex < observations.length
        ? activeObservationIndex
        : observations.length > 0
          ? 0
          : null;

    if (targetIndex !== null) {
      const targetObs = observations[targetIndex];
      if (
        typeof targetObs.lat === "number" &&
        typeof targetObs.lng === "number"
      ) {
        mapCenter = { lat: targetObs.lat, lng: targetObs.lng };
      }
    }
  }

  // Effect to add click listener when map instance is ready
  useEffect(() => {
    if (mapInstanceRef.current) {
      // Define the click handler inside useEffect to ensure it has access to the latest `onMapClick` prop
      const handleMapClick = (mouseEvent: kakao.maps.event.MouseEvent) => {
        const lat = mouseEvent.latLng.getLat();
        const lng = mouseEvent.latLng.getLng();
        onMapClick({ lat, lng });
      };

      kakao.maps.event.addListener(
        mapInstanceRef.current,
        "click",
        handleMapClick,
      );

      // Cleanup listener on component unmount or when dependencies change
      return () => {
        if (mapInstanceRef.current) {
          kakao.maps.event.removeListener(
            mapInstanceRef.current,
            "click",
            handleMapClick,
          );
        }
      };
    }
  }, [onMapClick]); // Re-attach if map instance or callback changes

  // Effect to center the map when observations or active index changes
  useEffect(() => {
    if (mapInstanceRef.current && observations.length > 0) {
      let centerLat = defaultCenter.lat;
      let centerLng = defaultCenter.lng;

      const targetIndex =
        activeObservationIndex !== null &&
        activeObservationIndex < observations.length
          ? activeObservationIndex
          : observations.length > 0
            ? 0
            : null;

      if (targetIndex !== null) {
        const targetObs = observations[targetIndex];
        if (
          typeof targetObs.lat === "number" &&
          typeof targetObs.lng === "number"
        ) {
          centerLat = targetObs.lat;
          centerLng = targetObs.lng;
        }
      }
      mapInstanceRef.current.setCenter(
        new kakao.maps.LatLng(centerLat, centerLng),
      );
    }
  }, [observations, activeObservationIndex]); // Depend on observations and activeObservationIndex

  const handleMapCreate = (mapInstance: kakao.maps.Map) => {
    mapInstanceRef.current = mapInstance; // Store in ref
    setMap(mapInstance); // Also set state if needed elsewhere in the component
  };

  return (
    <KakaoMap
      center={mapCenter}
      level={3} // Default zoom level
      onCreate={handleMapCreate}
      style={{
        width: "100%",
        height: "100%",
      }}
    >
      {/* Render markers for each observation point */}
      {observations.map((obs, index) => (
        <MapMarker
          key={index.toString()} // Use index as key if no unique ID
          position={{ lat: obs.lat, lng: obs.lng }}
          image={
            // Highlight the marker if it corresponds to the active observation index
            activeObservationIndex === index
              ? {
                  src: "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_red.png", // Example red marker for active
                  options: {
                    alt: `Active Observation Point ${index + 1}`,
                  },
                  size: {
                    width: 36,
                    height: 35,
                  },
                }
              : {
                  src: "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_number_blue.png", // Example blue numbered marker
                  options: {
                    alt: `Observation Point ${index + 1}`,
                  },
                  size: {
                    width: 36,
                    height: 35,
                  },
                }
          }
          // Optional: Add click handler on marker to select that observation point in the form
          onClick={() => {
            if (onMapClick) {
              // When a marker is clicked, simulate a map click at its location
              // This will trigger the form to update the corresponding field
              onMapClick({ lat: obs.lat, lng: obs.lng });
            }
          }}
        ></MapMarker>
      ))}
    </KakaoMap>
  );
}
