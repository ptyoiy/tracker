// src/features/transit-lookup/ui/TransitModeToggle.tsx

import { useAtom } from "jotai";
import { Button } from "@/shared/ui/button";
import { transitSelectedModeAtom } from "../model/atoms";

export function TransitModeToggle() {
  const [selectedMode, setSelectedMode] = useAtom(transitSelectedModeAtom);

  return (
    <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
      <Button
        variant={selectedMode === "auto" ? "default" : "ghost"}
        size="sm"
        className="flex-1 h-8 text-xs font-semibold"
        onClick={() => setSelectedMode("auto")}
      >
        자동
      </Button>
      <Button
        variant={selectedMode === "realtime" ? "default" : "ghost"}
        size="sm"
        className="flex-1 h-8 text-xs font-semibold"
        onClick={() => setSelectedMode("realtime")}
      >
        실시간
      </Button>
      <Button
        variant={selectedMode === "timetable" ? "default" : "ghost"}
        size="sm"
        className="flex-1 h-8 text-xs font-semibold"
        onClick={() => setSelectedMode("timetable")}
      >
        시간표
      </Button>
    </div>
  );
}
