// src/features/map-view/lib/useKakaoMapSdk.ts
"use client";

import { type RefObject, useEffect, useState } from "react";

export function useKakaoMapSdk(mapRef: RefObject<kakao.maps.Map | null>) {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const checkSdk = setInterval(() => {
      if (typeof window !== "undefined" && window.kakao && window.kakao.maps) {
        setIsLoaded(true);
        clearInterval(checkSdk);
      }
    }, 200);
    return () => clearInterval(checkSdk);
  }, []);

  useEffect(() => {
    if (isLoaded && mapRef.current) {
      mapRef.current.relayout();
    }
  }, [isLoaded, mapRef]);

  return { isLoaded };
}
