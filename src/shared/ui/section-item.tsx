import type React from "react";
import { cn } from "@/shared/lib/utils";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/shared/ui/accordion";

interface SectionItemProps {
  value: string;
  title: string;
  icon: React.ReactNode;
  iconBgClass: string;
  children: React.ReactNode;
  isLast?: boolean;
}

export function SectionItem({
  value,
  title,
  icon,
  iconBgClass,
  children,
  isLast = false,
}: SectionItemProps) {
  return (
    <AccordionItem
      value={value}
      id={`section-${value}`}
      className={cn(isLast ? "border-none" : "border-b-gray-100")}
    >
      <AccordionTrigger className="hover:no-underline py-3.5 group">
        <div className="flex items-center gap-3 text-gray-900 transition-transform group-active:scale-95">
          <div className={cn("p-2.5 rounded-xl", iconBgClass)}>{icon}</div>
          <span className="font-bold text-[17px]">{title}</span>
        </div>
      </AccordionTrigger>
      <AccordionContent>{children}</AccordionContent>
    </AccordionItem>
  );
}
