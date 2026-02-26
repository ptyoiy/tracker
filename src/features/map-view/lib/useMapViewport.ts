// src/features/map-view/lib/useMapViewport.ts
"use client";

import { useAtomValue, useSetAtom } from "jotai";
import {
  type RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { observationsAtom } from "@/features/observation-input/model/atoms";
import { DEFAULT_CENTER } from "@/shared/config/constant";
import { bottomSheetSnapAtom } from "@/store/atoms";
import { viewportAtom } from "../model/atoms";

export function useMapViewport(mapRef: RefObject<kakao.maps.Map | null>) {
  const snap = useAtomValue(bottomSheetSnapAtom);
  const observations = useAtomValue(observationsAtom);
  const setViewport = useSetAtom(viewportAtom);

  const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);
  const [mapLevel, setMapLevel] = useState(7);

  const panToWithOffset = useCallback(
    (lat: number, lng: number) => {
      const map = mapRef.current;
      if (!map) return;

      const targetLatLng = new kakao.maps.LatLng(lat, lng);

      let offsetRatio = 0;
      if (snap === 0.5) offsetRatio = 0.25;
      else if (snap === 0.9) offsetRatio = 0.45;

      if (offsetRatio === 0) {
        map.setCenter(targetLatLng);
      } else {
        const projection = map.getProjection();
        const offsetPixel = map.getNode().offsetHeight * offsetRatio;

        // 1. 타겟 좌표를 픽셀 평면상의 포인트로 변환
        const point = projection.pointFromCoords(targetLatLng);

        // 2. 화면 중앙(지도의 중심)이 타겟보다 아래에 위치해야 타겟이 위로 올라가 보이므로,
        // 픽셀 좌표계(y가 아래로 증가)에서 y값을 오프셋만큼 증가시킨 새로운 중심점 계산
        const newCenterPoint = new kakao.maps.Point(
          point.x,
          point.y + offsetPixel,
        );
        const newCenterLatLng = projection.coordsFromPoint(newCenterPoint);

        // 3. 계산된 새로운 중심점으로 한 번에 이동 (애니메이션 없이 즉시 이동하여 어지러움 방지)
        map.setCenter(newCenterLatLng);
      }
    },
    [mapRef, snap],
  );

  const handleIdle = useCallback(
    (map: kakao.maps.Map) => {
      const bounds = map.getBounds();
      const sw = bounds.getSouthWest();
      const ne = bounds.getNorthEast();
      const center = map.getCenter();

      // 바텀 시트 snap에 따른 visual center 계산 (화면상에서 가려지지 않은 부분의 중심)
      let offsetRatio = 0;
      if (snap === 0.5) offsetRatio = 0.25;
      else if (snap === 0.9) offsetRatio = 0.45;

      const projection = map.getProjection();
      const centerPoint = projection.pointFromCoords(center);
      const offsetPixel = map.getNode().offsetHeight * offsetRatio;

      // 지도의 기하학적 중심보다 offset만큼 위(y가 작음)에 있는 좌표를 visualCenter로 계산
      const visualCenterPoint = new kakao.maps.Point(
        centerPoint.x,
        centerPoint.y - offsetPixel,
      );
      const visualCenterLatLng = projection.coordsFromPoint(visualCenterPoint);

      setViewport({
        sw: { lat: sw.getLat(), lng: sw.getLng() },
        ne: { lat: ne.getLat(), lng: ne.getLng() },
        center: { lat: center.getLat(), lng: center.getLng() },
        visualCenter: {
          lat: visualCenterLatLng.getLat(),
          lng: visualCenterLatLng.getLng(),
        },
      });
    },
    [setViewport, snap],
  );

  const recenter = useCallback(() => {
    const last = observations[observations.length - 1];
    if (last) {
      panToWithOffset(last.lat, last.lng);
    } else {
      panToWithOffset(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng);
    }
    setMapLevel(7);
  }, [observations, panToWithOffset]);

  const prevCountRef = useRef(observations.length);
  const prevLastCoordRef = useRef<{ lat: number; lng: number } | null>(null);

  // Sync with last observation only when count increases or last coordinate changes
  useEffect(() => {
    const last = observations[observations.length - 1];
    if (!last) {
      prevCountRef.current = 0;
      prevLastCoordRef.current = null;
      return;
    }

    const countChanged = observations.length > prevCountRef.current;
    const coordChanged =
      !prevLastCoordRef.current ||
      prevLastCoordRef.current.lat !== last.lat ||
      prevLastCoordRef.current.lng !== last.lng;

    // length가 줄어드는 경우(삭제)는 이동하지 않음
    if (
      countChanged ||
      (coordChanged && observations.length === prevCountRef.current)
    ) {
      panToWithOffset(last.lat, last.lng);
    }

    prevCountRef.current = observations.length;
    prevLastCoordRef.current = { lat: last.lat, lng: last.lng };
  }, [observations, panToWithOffset]);

  return {
    mapCenter,
    setMapCenter,
    mapLevel,
    setMapLevel,
    panToWithOffset,
    handleIdle,
    recenter,
  };
}
