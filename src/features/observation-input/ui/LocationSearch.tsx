// LocationSearch.tsx (폼 의존성 없음)
"use client";

import { useState } from "react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";

export type LocationResult = {
  label: string;
  address: string;
  lat: number;
  lng: number;
  type: "place" | "address";
};

type Props = {
  id: string;
  value: string;
  onChange: (value: string) => void; // 검색창 텍스트
  onSelect: (payload: LocationResult) => void; // 결과 선택 시
};

export function LocationSearch({ id, value, onChange, onSelect }: Props) {
  const [activeTab, setActiveTab] = useState<"place" | "address">("place");
  const [results, setResults] = useState<LocationResult[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!value.trim()) return;
    setLoading(true);
    try {
      const endpoint =
        activeTab === "place" ? "/api/place-search" : "/api/address-search";

      const res = await fetch(`${endpoint}?q=${encodeURIComponent(value)}`);
      const data = (await res.json()) as { results: LocationResult[] };
      setResults(data.results);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      void handleSearch();
    }
  };

  const handleSelect = (r: LocationResult) => {
    onSelect(r);
    setResults([]);
    onChange(r.label); // 검색창에는 선택한 label 표시
  };

  return (
    <div className="space-y-1">
      <div className="flex gap-1 mb-1 text-xs">
        <button
          type="button"
          className={`px-2 py-1 rounded ${
            activeTab === "place" ? "bg-gray-900 text-white" : "bg-gray-100"
          }`}
          onClick={() => setActiveTab("place")}
        >
          장소명
        </button>
        <button
          type="button"
          className={`px-2 py-1 rounded ${
            activeTab === "address" ? "bg-gray-900 text-white" : "bg-gray-100"
          }`}
          onClick={() => setActiveTab("address")}
        >
          주소
        </button>
      </div>

      <div className="flex gap-2">
        <Input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            activeTab === "place"
              ? "예: 서울역, 투썸플레이스 합정"
              : "예: 서울 중구 세종대로 110"
          }
        />
        <Button
          type="button"
          variant="outline"
          onClick={handleSearch}
          disabled={loading}
        >
          검색
        </Button>
      </div>

      {results.length > 0 && (
        <div className="border rounded-md max-h-40 overflow-auto bg-white shadow-sm mt-1">
          {results.map((r, idx) => (
            <button
              key={`${r.type}-${idx}`}
              type="button"
              className="w-full text-left px-2 py-1 text-xs hover:bg-gray-100"
              onClick={() => handleSelect(r)}
            >
              <span className="font-medium">{r.label}</span>
              {r.address && r.address !== r.label && (
                <span className="block text-[10px] text-gray-500">
                  {r.address}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
