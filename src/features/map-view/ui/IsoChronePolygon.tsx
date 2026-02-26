"use client";

import { useAtomValue } from "jotai";
import { Polygon } from "react-kakao-maps-sdk";
import { useIsochroneQuery } from "@/features/isochrone/api/useIsochroneQuery";
import {
  committedFutureMinutesAtom,
  observationsAtom,
} from "@/features/observation-input/model/atoms";
import { isochroneSelectionAtom } from "../model/atoms";

// Mapbox/GeoJSON: [polygon][ring][vertex][lng,lat]
function toPolygonPath(polygons: { coordinates: number[][][] }[]) {
  return polygons.map((poly) =>
    poly.coordinates[0].map(([lng, lat]) => ({ lat, lng })),
  );
}

export function IsochronePolygon() {
  const selection = useAtomValue(isochroneSelectionAtom);
  const observations = useAtomValue(observationsAtom);
  const futureMinutes = useAtomValue(committedFutureMinutesAtom);

  const { profile, observationIndex } = selection;
  const target = observations[observationIndex];

  const { data: isochrone } = useIsochroneQuery(
    target?.lat ?? 0,
    target?.lng ?? 0,
    futureMinutes,
    profile,
  );

  if (!isochrone || !isochrone.polygons || isochrone.polygons.length === 0)
    return null;

  const paths = toPolygonPath(isochrone.polygons);

  return (
    <>
      {paths.map((path, idx) => (
        <Polygon
          key={`${path[0]?.lat}-${path[0]?.lng}-${idx}`}
          path={path}
          strokeWeight={1}
          strokeColor="#4A90E2"
          strokeOpacity={0.8}
          strokeStyle="solid"
          fillColor="#4A90E2"
          fillOpacity={0.2}
        />
      ))}
    </>
  );
}
