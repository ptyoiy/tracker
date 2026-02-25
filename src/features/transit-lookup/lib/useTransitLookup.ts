"use client";

import { format } from "date-fns";
import { useAtom } from "jotai";
import {
  transitLookupEndAtom,
  transitLookupLoadingAtom,
  transitLookupResultAtom,
  transitLookupStartAtom,
  transitLookupTimeAtom,
} from "../model/atoms";

export function useTransitLookup() {
  const [start, setStart] = useAtom(transitLookupStartAtom);
  const [end, setEnd] = useAtom(transitLookupEndAtom);
  const [time, setTime] = useAtom(transitLookupTimeAtom);
  const [result, setResult] = useAtom(transitLookupResultAtom);
  const [loading, setLoading] = useAtom(transitLookupLoadingAtom);

  const lookup = async () => {
    if (!start || !end) return;

    setLoading(true);
    try {
      // YYYYMMDDHHmm 형식으로 변환
      const searchDttm = format(new Date(time), "yyyyMMddHHmm");

      const res = await fetch("/api/transit-lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startX: start.lng,
          startY: start.lat,
          endX: end.lng,
          endY: end.lat,
          searchDttm,
        }),
      });

      if (!res.ok) throw new Error("Lookup failed");
      const data = await res.json();
      setResult(data);
    } catch (error) {
      console.error(error);
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return {
    start,
    setStart,
    end,
    setEnd,
    time,
    setTime,
    result,
    loading,
    lookup,
  };
}
