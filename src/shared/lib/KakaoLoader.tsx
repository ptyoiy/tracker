"use client";

import { useEffect } from "react";

export function KakaoLoader() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if ((window as any).kakao?.maps) return;

    const script = document.createElement("script");
    script.id = "kakao-maps-sdk";
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_JS_KEY}&autoload=false`;
    script.async = true;
    script.referrerPolicy = "same-origin";

    document.body.appendChild(script);

    script.onload = () => {
      (window as any).kakao.maps.load(() => {
        console.log("Kakao Maps SDK loaded");
      });
    };

    script.onerror = (err) => {
      console.error("Kakao Maps SDK load error:", err);
    };
  }, []);

  return null;
}
