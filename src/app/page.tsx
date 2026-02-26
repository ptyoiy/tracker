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
import { useEffect, useRef } from "react";
import { useLoadCctvOnce } from "@/features/cctv-mapping/lib/cctv-api";
import { useComputeRouteCctvCount } from "@/features/cctv-mapping/lib/route-cctv-count";
import { CCTVSearchTab } from "@/features/cctv-mapping/ui/CCTVSearchTab";
import { IsochroneControls } from "@/features/map-view/ui/IsochroneControls";
import { MapView } from "@/features/map-view/ui/MapView";
import { observationsAtom } from "@/features/observation-input/model/atoms";
import { ObservationForm } from "@/features/observation-input/ui/ObservationForm";
import { useSelectedRoutes } from "@/features/route-analysis/lib/useSelectedRoutes";
import { analysisResultAtom } from "@/features/route-analysis/model/atoms";
import { RouteListPanel } from "@/features/route-analysis/ui/RouteAnalysisPanel";
import { TransitLookupTab } from "@/features/transit-lookup/ui/TransitLookupTab";
import { KakaoLoader } from "@/shared/lib/KakaoLoader";
import { cn } from "@/shared/lib/utils";
import { Accordion } from "@/shared/ui/accordion";
import { Badge } from "@/shared/ui/badge";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/shared/ui/drawer";
import { SectionItem } from "@/shared/ui/section-item";
import {
  type ActiveSection,
  activeSectionAtom,
  bottomSheetOpenAtom,
  bottomSheetSnapAtom,
} from "@/store/atoms";

const snapPoints = ["84px", 0.5, 0.9];
export default function Home() {
  const [isOpen, setIsOpen] = useAtom(bottomSheetOpenAtom);
  const [snap, setSnap] = useAtom(bottomSheetSnapAtom);
  const [activeSection, setActiveSection] = useAtom(activeSectionAtom);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const observations = useAtomValue(observationsAtom);
  const selectedRoutes = useSelectedRoutes();
  const analysisResult = useAtomValue(analysisResultAtom);

  useEffect(() => {
    if (activeSection) {
      const timer = setTimeout(() => {
        const element = document.getElementById(`section-${activeSection}`);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [activeSection]);

  const lastObs =
    observations.length > 0 ? observations[observations.length - 1] : null;
  const bestRoute = selectedRoutes.length > 0 ? selectedRoutes[0] : null;

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
          setActiveSnapPoint={(sp) => sp && setSnap(sp)}
          modal={false}
          dismissible={false}
          fadeFromIndex={2}
        >
          <DrawerContent className="z-50 shadow-[0_-8px_30px_rgb(0,0,0,0.12)] select-none flex flex-col outline-none border-t border-gray-200 h-full overflow-hidden">
            <DrawerHeader className="sr-only">
              <DrawerTitle>분석 및 제어 센터</DrawerTitle>
            </DrawerHeader>

            {/* Summary Context Bar - Proper Button Implementation */}
            <button
              type="button"
              aria-label={`제어판 높이 조절 (현재: ${snap === "84px" ? "최소" : snap === 0.5 ? "중간" : "최대"})`}
              className={cn(
                "w-full h-[64px] px-4 pt-4 pb-3 border-b flex items-center justify-between transition-all sticky top-0 z-20 shrink-0",
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
                {analysisResult.stale && (
                  <span className="ml-2 text-[11px] text-red-500 font-bold whitespace-nowrap flex items-center gap-1 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    관측 변경됨 · 재분석 필요
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
                      <ChevronUp className="w-4 h-4 text-gray-300" />
                      {/* <ChevronDown className="w-4 h-4 text-gray-300" /> */}
                    </div>
                  )}
                </div>
                <Info className="w-4 h-4 text-gray-400" />
              </div>
            </button>

            {/* Content Area */}
            <div
              ref={scrollContainerRef}
              className="overflow-y-auto px-4 pb-12 bg-white transition-all duration-300 ease-in-out"
              style={{
                height:
                  snap === "84px"
                    ? "0px"
                    : typeof snap === "number"
                      ? `calc(${snap * 100}vh - 84px)`
                      : "calc(100vh - 84px)",
              }}
            >
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
                <SectionItem
                  value="observation"
                  title="관측 지점 입력"
                  icon={<MapPin className="w-5 h-5 text-red-500" />}
                  iconBgClass="bg-red-50"
                >
                  <ObservationForm />
                </SectionItem>

                <SectionItem
                  value="route"
                  title="경로 분석 결과"
                  icon={<Navigation className="w-5 h-5 text-blue-500" />}
                  iconBgClass="bg-blue-50"
                >
                  <RouteListPanel />
                </SectionItem>

                <SectionItem
                  value="isochrone"
                  title="이동 범위"
                  icon={<Info className="w-5 h-5 text-purple-500" />}
                  iconBgClass="bg-purple-50"
                >
                  <IsochroneControls />
                </SectionItem>

                <SectionItem
                  value="cctv"
                  title="주변 CCTV 검색"
                  icon={<Shield className="w-5 h-5 text-green-600" />}
                  iconBgClass="bg-green-50"
                >
                  <CCTVSearchTab />
                </SectionItem>

                <SectionItem
                  value="transit"
                  title="대중교통 직접 조회"
                  icon={<Bus className="w-5 h-5 text-orange-500" />}
                  iconBgClass="bg-orange-50"
                  isLast
                >
                  <TransitLookupTab />
                </SectionItem>
              </Accordion>
            </div>
          </DrawerContent>
        </Drawer>
      </main>
    </div>
  );
}
