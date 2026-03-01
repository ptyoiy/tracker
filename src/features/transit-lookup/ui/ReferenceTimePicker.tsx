// src/features/transit-lookup/ui/ReferenceTimePicker.tsx
import { useAtom } from "jotai";
import { Clock } from "lucide-react";
import { transitReferenceTimeAtom } from "../model/atoms";

export function ReferenceTimePicker() {
  const [refTime, setRefTime] = useAtom(transitReferenceTimeAtom);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.value) {
      setRefTime(null);
    } else {
      setRefTime(new Date(e.target.value).toISOString());
    }
  };

  // datetime-local 형식 (YYYY-MM-DDThh:mm)
  const formattedVal = refTime
    ? new Date(refTime).toISOString().slice(0, 16)
    : "";

  return (
    <div className="flex items-center gap-2">
      <Clock className="w-4 h-4 text-gray-500" />
      <div className="relative flex-1">
        <input
          type="datetime-local"
          value={formattedVal}
          onChange={handleChange}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>
      <button
        type="button"
        onClick={() => setRefTime(null)}
        disabled={!refTime}
        className="text-xs text-blue-600 font-medium px-2 py-1 hover:bg-blue-50 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        현재
      </button>
    </div>
  );
}
