"use client";

import { useAtom, useAtomValue } from "jotai";
import {
  Bus,
  ChevronDown,
  ChevronUp,
  Info,
  MapPin,
  Navigation,
  Shield,
} from "lucide-react";
import { useLoadCctvOnce } from "@/features/cctv-mapping/lib/cctv-api";
import { useComputeRouteCctvCount } from "@/features/cctv-mapping/lib/route-cctv-count";
import { CCTVSearchTab } from "@/features/cctv-mapping/ui/CCTVSearchTab";
import { IsochroneControls } from "@/features/map-view/ui/IsochroneControls";
import { MapView } from "@/features/map-view/ui/MapView";
import { observationsAtom } from "@/features/observation-input/model/atoms";
import { ObservationForm } from "@/features/observation-input/ui/ObservationForm";
import { selectedRouteInfosAtom } from "@/features/route-analysis/model/atoms";
import { RouteListPanel } from "@/features/route-analysis/ui/RouteAnalysisPanel";
import { TransitLookupTab } from "@/features/transit-lookup/ui/TransitLookupTab";
import { KakaoLoader } from "@/shared/lib/KakaoLoader";
import { cn } from "@/shared/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/shared/ui/accordion";
import { Badge } from "@/shared/ui/badge";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/shared/ui/drawer";
import {
  type ActiveSection,
  activeSectionAtom,
  bottomSheetOpenAtom,
  bottomSheetSnapAtom,
} from "@/store/atoms";

export default function Home() {
  const [isOpen, setIsOpen] = useAtom(bottomSheetOpenAtom);
  const [snap, setSnap] = useAtom(bottomSheetSnapAtom);
  const [activeSection, setActiveSection] = useAtom(activeSectionAtom);

  const observations = useAtomValue(observationsAtom);
  const selectedRoutes = useAtomValue(selectedRouteInfosAtom);

  const lastObs =
    observations.length > 0 ? observations[observations.length - 1] : null;
  const bestRoute = selectedRoutes.length > 0 ? selectedRoutes[0] : null;

  const snapPoints = ["84px", 0.5, 0.9];

  const toggleSnap = () => {
    if (snap === "84px") setSnap(0.5);
    else if (snap === 0.5) setSnap(0.9);
    else setSnap("84px");
  };

  useLoadCctvOnce();
  useComputeRouteCctvCount();

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden relative bg-white">
      <KakaoLoader />

      <main className="flex-1 flex flex-col h-full w-full relative">
        {/* Map Layer */}
        <div className="absolute inset-0 z-0 w-full h-full" aria-hidden="true">
          <MapView />
        </div>

        {/* Bottom Sheet UI */}
        <Drawer
          open={isOpen}
          onOpenChange={(open) => !open && setIsOpen(true)} // 닫힘 방지
          snapPoints={snapPoints}
          activeSnapPoint={snap}
          setActiveSnapPoint={setSnap}
          modal={false}
          dismissible={false}
          fadeFromIndex={2}
        >
          <DrawerContent className="z-50 shadow-[0_-8px_30px_rgb(0,0,0,0.12)] select-none flex flex-col outline-none border-t border-gray-200 h-full overflow-hidden">
            <DrawerHeader className="sr-only">
              <DrawerTitle>분석 및 제어 센터</DrawerTitle>
            </DrawerHeader>

            {/* Drawer Handle Visualizer */}
            {/* <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1.5 bg-gray-300 rounded-full z-30" /> */}

            {/* Summary Context Bar - Proper Button Implementation */}
            <button
              type="button"
              aria-label={`제어판 높이 조절 (현재: ${snap === "84px" ? "최소" : snap === 0.5 ? "중간" : "최대"})`}
              className={cn(
                "w-full h-[84px] px-4 pt-4 pb-3 border-b flex items-center justify-between transition-all sticky top-0 z-20 shrink-0",
                "bg-white/95 backdrop-blur-md hover:bg-gray-50 active:bg-gray-100 active:scale-[0.98] touch-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
              )}
              onClick={toggleSnap}
            >
              <div className="flex gap-2 items-center overflow-x-auto no-scrollbar pointer-events-none">
                <Badge
                  variant="outline"
                  className="flex gap-1 whitespace-nowrap bg-white border-red-200 text-red-600 font-bold px-2 py-0.5"
                >
                  <MapPin className="w-3 h-3" /> {observations.length}
                </Badge>
                {bestRoute && (
                  <Badge
                    variant="secondary"
                    className="flex gap-1 whitespace-nowrap bg-blue-100 text-blue-700 border-blue-200 px-2 py-0.5"
                  >
                    <Navigation className="w-3 h-3" />{" "}
                    {Math.round(bestRoute.totalDurationSeconds / 60)}분
                  </Badge>
                )}
                {lastObs && (
                  <span className="text-[11px] text-gray-500 font-semibold whitespace-nowrap truncate max-w-[140px] ml-1">
                    {lastObs.address}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 shrink-0 ml-2">
                <div className="flex flex-col items-center justify-center">
                  {snap === "84px" ? (
                    <ChevronUp className="w-4 h-4 text-blue-500 animate-bounce" />
                  ) : snap === 0.9 ? (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  ) : (
                    <div className="flex flex-col -space-y-2">
                      <ChevronUp className="w-3 h-3 text-gray-300" />
                      <ChevronDown className="w-3 h-3 text-gray-300" />
                    </div>
                  )}
                </div>
                <Info className="w-4 h-4 text-gray-400" />
              </div>
            </button>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto px-4 pb-12 bg-white">
              <Accordion
                type="single"
                collapsible
                value={activeSection || ""}
                onValueChange={(v) => {
                  setActiveSection(v as ActiveSection);
                  if (v && snap === "84px") {
                    setSnap(0.5);
                  }
                }}
                className="w-full"
              >
                <AccordionItem
                  value="observation"
                  className="border-b-gray-100"
                >
                  <AccordionTrigger className="hover:no-underline py-5 group">
                    <div className="flex items-center gap-3 text-gray-900 transition-transform group-active:scale-95">
                      <div className="p-2.5 bg-red-50 rounded-xl">
                        <MapPin className="w-5 h-5 text-red-500" />
                      </div>
                      <span className="font-bold text-[17px]">
                        관측 지점 입력
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <ObservationForm />
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="route" className="border-b-gray-100">
                  <AccordionTrigger className="hover:no-underline py-5 group">
                    <div className="flex items-center gap-3 text-gray-900 transition-transform group-active:scale-95">
                      <div className="p-2.5 bg-blue-50 rounded-xl">
                        <Navigation className="w-5 h-5 text-blue-500" />
                      </div>
                      <span className="font-bold text-[17px]">
                        경로 분석 결과
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <RouteListPanel />
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="isochrone" className="border-b-gray-100">
                  <AccordionTrigger className="hover:no-underline py-5 group">
                    <div className="flex items-center gap-3 text-gray-900 transition-transform group-active:scale-95">
                      <div className="p-2.5 bg-purple-50 rounded-xl">
                        <Info className="w-5 h-5 text-purple-500" />
                      </div>
                      <span className="font-bold text-[17px]">
                        이동 범위 (Isochrone)
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <IsochroneControls />
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="cctv" className="border-b-gray-100">
                  <AccordionTrigger className="hover:no-underline py-5 group">
                    <div className="flex items-center gap-3 text-gray-900 transition-transform group-active:scale-95">
                      <div className="p-2.5 bg-green-50 rounded-xl">
                        <Shield className="w-5 h-5 text-green-600" />
                      </div>
                      <span className="font-bold text-[17px]">
                        주변 CCTV 검색
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <CCTVSearchTab />
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="transit" className="border-none">
                  <AccordionTrigger className="hover:no-underline py-5 group">
                    <div className="flex items-center gap-3 text-gray-900 transition-transform group-active:scale-95">
                      <div className="p-2.5 bg-orange-50 rounded-xl">
                        <Bus className="w-5 h-5 text-orange-500" />
                      </div>
                      <span className="font-bold text-[17px]">
                        대중교통 직접 조회
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <TransitLookupTab />
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              {/* snap이 최대가 아닐 때 하단 여백 보정 */}
              {snap !== 0.9 && (
                <div className="pb-[var(--snap-point-height,0px)]" />
              )}
            </div>
          </DrawerContent>
        </Drawer>
      </main>
    </div>
  );
}
