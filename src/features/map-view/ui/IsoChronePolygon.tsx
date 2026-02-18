"use client";

import { useAtomValue } from "jotai";
import { Polygon } from "react-kakao-maps-sdk";
import { isochroneAtom } from "../model/atoms";

// Mapbox/GeoJSON: [polygon][ring][vertex][lng,lat][web:145]
function toPolygonPath(polygons: number[][][][]) {
  return polygons.map((poly) => poly[0].map(([lng, lat]) => ({ lat, lng })));
}

export function IsochronePolygon() {
  const isochrone = useAtomValue(isochroneAtom);

  if (!isochrone || isochrone.polygons.length === 0) return null;

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
