"use client";

import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { ChevronDown } from "lucide-react";
import type * as React from "react";

import { cn } from "@/shared/lib/utils";

function Accordion({
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Root>) {
  return <AccordionPrimitive.Root data-slot="accordion" {...props} />;
}

function AccordionItem({
  className,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Item>) {
  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      className={cn("border-b", className)}
      {...props}
    />
  );
}

function AccordionTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Trigger>) {
  return (
    <AccordionPrimitive.Header className="flex w-full">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        className={cn(
          "focus-visible:ring-ring flex flex-1 items-center justify-between py-4 text-left text-sm font-medium transition-all hover:underline focus-visible:outline-none focus-visible:ring-1 disabled:pointer-events-none disabled:opacity-50 [&[data-state=open]>svg]:rotate-180",
          className,
        )}
        {...props}
      >
        {children}
        <ChevronDown className="text-muted-foreground pointer-events-none size-4 shrink-0 transition-transform duration-200" />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}

type AccordionTriggerContentProps = {
  index: number;
  watchTimestamp: string;
  watchLabel?: string;
  watchAddress?: string;
};
// hh:mm 형식으로 시간 추출
const formatTimeSummary = (ts: string) => {
  if (!ts) return "--:--";
  const parts = ts.split("T");
  if (parts.length < 2) return "--:--";
  return parts[1]; // hh:mm
};

function AccordionTriggerContent({
  index,
  watchTimestamp,
  watchLabel,
  watchAddress,
}: AccordionTriggerContentProps) {
  return (
    <div className="flex items-center justify-between w-full pr-2">
      {/* Left: Index & Time */}
      <div className="flex items-center gap-3 shrink-0">
        <span className="shrink-0 flex items-center justify-center w-6 h-6 text-[10px] font-black bg-gray-900 text-white rounded-md">
          {index + 1}
        </span>
        <div className="flex flex-col items-start -space-y-0.5">
          <span className="text-[13px] font-bold tabular-nums text-gray-700">
            {formatTimeSummary(watchTimestamp)}
          </span>
        </div>
      </div>

      {/* Right: Label (Place) & Address - Pushed to right */}
      <div className="flex-1 flex flex-col items-end min-w-0 ml-4 text-right">
        <span className="text-[14px] font-black text-gray-900 truncate w-full">
          {watchLabel || "장소 미지정"}
        </span>
        {watchAddress && (
          <span className="text-[11px] text-gray-400 truncate w-full font-medium">
            {watchAddress}
          </span>
        )}
      </div>
    </div>
  );
}

function AccordionContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Content>) {
  return (
    <AccordionPrimitive.Content
      data-slot="accordion-content"
      className="data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down overflow-hidden text-sm"
      {...props}
    >
      <div className={cn("pt-0 pb-4", className)}>{children}</div>
    </AccordionPrimitive.Content>
  );
}

export {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionTriggerContent,
  AccordionContent,
};
