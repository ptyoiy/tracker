import {
  booleanPointInPolygon,
  buffer,
  lineString,
  point,
  polygon,
} from "@turf/turf";
import type { CCTV, CCTVFilterContext } from "@/types/cctv";

export function filterCctvByContext(
  cctvs: CCTV[],
  ctx: CCTVFilterContext,
): CCTV[] {
  if (cctvs.length === 0) return [];

  if (ctx.type === "ROUTE") {
    const line = lineString(ctx.polyline);

    const buffered = buffer(line, ctx.bufferMeters, { units: "meters" });
    if (!buffered || !buffered.geometry || !buffered.geometry.coordinates) {
      return [];
    }

    return filterByPolygonGeom(
      cctvs,
      buffered.geometry.coordinates as [number, number][][],
    );
  }

  if (ctx.type === "ISOCHRONE") {
    const basePoly = polygon(ctx.polygon);

    const maybeBuffered =
      ctx.bufferMeters && ctx.bufferMeters > 0
        ? buffer(basePoly, ctx.bufferMeters, { units: "meters" })
        : basePoly;

    const effectivePoly = maybeBuffered?.geometry?.coordinates
      ? maybeBuffered
      : basePoly;

    return filterByPolygonGeom(
      cctvs,
      effectivePoly.geometry.coordinates as [number, number][][],
    );
  }

  // VIEWPORT: 단순 bbox
  const {
    bounds: { sw, ne },
  } = ctx;

  return cctvs.filter(
    (c) => c.lat >= sw[1] && c.lat <= ne[1] && c.lng >= sw[0] && c.lng <= ne[0],
  );
}

function filterByPolygonGeom(
  cctvs: CCTV[],
  coordinates: [number, number][][],
): CCTV[] {
  const poly = polygon(coordinates);

  return cctvs.filter((c) => {
    const pt = point([c.lng, c.lat]);
    return booleanPointInPolygon(pt, poly);
  });
}
