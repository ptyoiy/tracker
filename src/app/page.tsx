"use client";

import { useAtom } from "jotai";
import { MapView } from "@/components/MapView";
import { ObservationForm } from "@/components/ObservationForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { activeTabAtom } from "@/store/atoms";

export default function Home() {
  const [activeTab, setActiveTab] = useAtom(activeTabAtom);

  return (
    <div className="h-dvh flex flex-col bg-background">
      {/* 헤더 */}
      <header className="shrink-0 px-4 py-3 border-b">
        <h1 className="text-lg font-bold">210 트래커</h1>
      </header>

      {/* 탭 */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex-1 flex flex-col min-h-0"
      >
        <TabsList className="shrink-0 grid w-full grid-cols-2 rounded-none">
          <TabsTrigger value="input">입력</TabsTrigger>
          <TabsTrigger value="map">지도</TabsTrigger>
        </TabsList>

        <TabsContent value="input" className="flex-1 overflow-y-auto p-4 mt-0">
          <ObservationForm />
        </TabsContent>

        <TabsContent value="map" className="flex-1 relative mt-0">
          <MapView />
        </TabsContent>
      </Tabs>
    </div>
  );
}
