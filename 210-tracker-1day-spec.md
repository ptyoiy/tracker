# 210 트래커 — 1일 프로토타입 개발 기획서

## 프로젝트 개요

### 목표
서울 도시 내에서 거수자(용의자) 추적을 위한 웹 애플리케이션.  
2~7개의 발견 지점(위경도 + 시각)을 입력하면, 이동 경로를 추론하고 마지막 발견 지점 기준 n분 후 이동 가능 범위(isochrone)를 지도에 표시하여 작전팀의 의사결정을 지원.

### 기술 스택
- **프레임워크**: Next.js 15 (App Router, TypeScript)
- **스타일링**: Tailwind CSS + shadcn/ui
- **상태관리**: Jotai
- **지도**: 카카오맵 JS SDK (react-kakao-maps-sdk)
- **린트/포맷**: Biome
- **배포**: Vercel
- **API**: TMAP (보행자/차량 경로), Mapbox (Isochrone)

### 오늘(1일차) 목표
**"기능적으로 사용 가능한 프로토타입"** 완성
- 발견 지점 입력 → 경로 추론 → 지도 표시 → isochrone 시각화
- 모바일 우선 UI/UX
- Vercel 배포 후 실제 동작 확인

---

## 시스템 아키텍처

### 데이터 플로우
```
[사용자 입력] 
  → (위경도 + 시각) × 2~7개
  ↓
[/api/analyze] 
  → 구간별 속도 계산 
  → TMAP 보행자/차량 경로 API 호출 
  → 실제 시간과 비교 필터링
  ↓
[경로 데이터] 
  → 폴리라인, 교통수단, 소요시간
  ↓
[/api/isochrone]
  → 마지막 발견 지점 + n분 
  → Mapbox Isochrone API 호출
  ↓
[GeoJSON 폴리곤]
  ↓
[프론트엔드]
  → 카카오맵에 경로 + isochrone 표시
```

---

## 핵심 기능 명세

### 1. 발견 지점 입력 (Input Form)

#### 요구사항
- 사용자가 2~7개의 발견 지점을 입력할 수 있어야 함
- 각 지점은 위도, 경도, 발견 시각(datetime)으로 구성
- 시각순 자동 정렬
- 모바일에서 사용하기 편한 UI

#### 데이터 스키마 (Zod)
```typescript
import { z } from 'zod'

export const observationSchema = z.object({
  lat: z.number().min(33).max(38), // 한국 위도 범위
  lng: z.number().min(124).max(132), // 한국 경도 범위
  timestamp: z.string().datetime(), // ISO 8601
})

export const analyzeRequestSchema = z.object({
  observations: z.array(observationSchema).min(2).max(7),
  futureMinutes: z.number().min(1).max(60).optional().default(10), // isochrone 시간
})

export type Observation = z.infer<typeof observationSchema>
export type AnalyzeRequest = z.infer<typeof analyzeRequestSchema>
```

#### UI 컴포넌트
- `ObservationForm.tsx` (shadcn/ui Input, Button 사용)
  - 발견 지점 추가/삭제 버튼
  - 위경도 입력 필드 (number input)
  - 시각 입력 (datetime-local input)
  - "분석하기" 버튼 → API 호출

---

### 2. 경로 분석 API (`/api/analyze`)

#### Endpoint
`POST /api/analyze`

#### Request Body
```typescript
{
  observations: [
    { lat: 37.5547, lng: 126.9707, timestamp: "2026-02-09T08:00:00Z" },
    { lat: 37.5637, lng: 126.9770, timestamp: "2026-02-09T08:15:00Z" }
  ],
  futureMinutes: 10
}
```

#### Response
```typescript
{
  segments: [
    {
      from: { lat: 37.5547, lng: 126.9707, timestamp: "..." },
      to: { lat: 37.5637, lng: 126.9770, timestamp: "..." },
      distance: 1200, // 미터
      duration: 900, // 초 (실제 Δt)
      avgSpeed: 4.8, // km/h
      transportMode: "walking" | "vehicle" | "transit",
      routes: [
        {
          mode: "walking",
          polyline: [[lng, lat], ...], // GeoJSON 형식
          estimatedDuration: 960, // TMAP API 반환값 (초)
          distance: 1250
        }
      ]
    }
  ],
  isochrone: {
    // /api/isochrone 결과를 여기 포함 (선택적)
  }
}
```

#### 로직 흐름

##### 2.1. 구간별 기초 분석
```typescript
// src/lib/analyze/segment.ts
import { getDistance } from 'geolib'
import { differenceInSeconds } from 'date-fns'

export function analyzeSegment(from: Observation, to: Observation) {
  const distance = getDistance(
    { latitude: from.lat, longitude: from.lng },
    { latitude: to.lat, longitude: to.lng }
  ) // 미터

  const duration = differenceInSeconds(
    new Date(to.timestamp),
    new Date(from.timestamp)
  ) // 초

  const avgSpeed = (distance / 1000) / (duration / 3600) // km/h

  // 교통수단 1차 판정
  let transportMode: 'walking' | 'vehicle' | 'transit'
  if (avgSpeed < 6) {
    transportMode = 'walking'
  } else if (avgSpeed < 15) {
    transportMode = 'transit' // 버스/자전거
  } else {
    transportMode = 'vehicle'
  }

  return { distance, duration, avgSpeed, transportMode }
}
```

##### 2.2. TMAP API 호출
```typescript
// src/lib/tmap/pedestrian.ts
import ky from 'ky'

interface TmapPedestrianRequest {
  startX: number // 경도
  startY: number // 위도
  endX: number
  endY: number
  startName?: string
  endName?: string
}

interface TmapPedestrianResponse {
  type: 'FeatureCollection'
  features: Array<{
    type: 'Feature'
    geometry: {
      type: 'LineString'
      coordinates: number[][] // [lng, lat]
    }
    properties: {
      totalDistance: number // 미터
      totalTime: number // 초
    }
  }>
}

export async function getTmapPedestrianRoute(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number }
): Promise<TmapPedestrianResponse> {
  const response = await ky.post('https://apis.openapi.sk.com/tmap/routes/pedestrian', {
    headers: {
      appKey: process.env.TMAP_APP_KEY!,
      'Content-Type': 'application/json',
    },
    json: {
      startX: from.lng,
      startY: from.lat,
      endX: to.lng,
      endY: to.lat,
      startName: '출발',
      endName: '도착',
      reqCoordType: 'WGS84GEO',
      resCoordType: 'WGS84GEO',
    },
    timeout: 10000,
  }).json<TmapPedestrianResponse>()

  return response
}
```

```typescript
// src/lib/tmap/driving.ts
interface TmapDrivingResponse {
  type: 'FeatureCollection'
  features: Array<{
    type: 'Feature'
    geometry: {
      type: 'LineString'
      coordinates: number[][]
    }
    properties: {
      totalDistance: number
      totalTime: number
    }
  }>
}

export async function getTmapDrivingRoute(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number }
): Promise<TmapDrivingResponse> {
  const response = await ky.post('https://apis.openapi.sk.com/tmap/routes', {
    headers: {
      appKey: process.env.TMAP_APP_KEY!,
      'Content-Type': 'application/json',
    },
    json: {
      startX: from.lng,
      startY: from.lat,
      endX: to.lng,
      endY: to.lat,
      reqCoordType: 'WGS84GEO',
      resCoordType: 'WGS84GEO',
    },
    timeout: 10000,
  }).json<TmapDrivingResponse>()

  return response
}
```

##### 2.3. 경로 필터링
```typescript
// src/lib/analyze/filter.ts
export function filterRoutesByTime(
  routes: Array<{ mode: string; estimatedDuration: number }>,
  actualDuration: number,
  tolerance: number = 0.3 // 30% 허용 오차
) {
  return routes.filter((route) => {
    const lower = actualDuration * (1 - tolerance)
    const upper = actualDuration * (1 + tolerance)
    return route.estimatedDuration >= lower && route.estimatedDuration <= upper
  })
}
```

##### 2.4. API Route 구현
```typescript
// src/app/api/analyze/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { analyzeRequestSchema } from '@/types/analyze'
import { analyzeSegment } from '@/lib/analyze/segment'
import { getTmapPedestrianRoute, getTmapDrivingRoute } from '@/lib/tmap'
import { filterRoutesByTime } from '@/lib/analyze/filter'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { observations, futureMinutes } = analyzeRequestSchema.parse(body)

    // 시간순 정렬
    const sorted = [...observations].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    )

    const segments = []

    // 구간별 분석
    for (let i = 0; i < sorted.length - 1; i++) {
      const from = sorted[i]
      const to = sorted[i + 1]

      const basic = analyzeSegment(from, to)
      const routes = []

      // 도보 가능 시 TMAP 보행자 경로
      if (basic.transportMode === 'walking' || basic.avgSpeed < 15) {
        try {
          const pedestrianRoute = await getTmapPedestrianRoute(from, to)
          const feature = pedestrianRoute.features[0]
          if (feature) {
            routes.push({
              mode: 'walking',
              polyline: feature.geometry.coordinates,
              estimatedDuration: feature.properties.totalTime,
              distance: feature.properties.totalDistance,
            })
          }
        } catch (err) {
          console.error('TMAP pedestrian error:', err)
        }
      }

      // 차량 가능 시 TMAP 자동차 경로
      if (basic.transportMode === 'vehicle' || basic.avgSpeed >= 6) {
        try {
          const drivingRoute = await getTmapDrivingRoute(from, to)
          const feature = drivingRoute.features[0]
          if (feature) {
            routes.push({
              mode: 'driving',
              polyline: feature.geometry.coordinates,
              estimatedDuration: feature.properties.totalTime,
              distance: feature.properties.totalDistance,
            })
          }
        } catch (err) {
          console.error('TMAP driving error:', err)
        }
      }

      // 실제 시간과 비교해서 타당한 경로만 필터링
      const validRoutes = filterRoutesByTime(routes, basic.duration)

      segments.push({
        from,
        to,
        distance: basic.distance,
        duration: basic.duration,
        avgSpeed: basic.avgSpeed,
        transportMode: basic.transportMode,
        routes: validRoutes,
      })
    }

    return NextResponse.json({ segments })
  } catch (error) {
    console.error('Analyze error:', error)
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 })
  }
}
```

---

### 3. Isochrone API (`/api/isochrone`)

#### Endpoint
`POST /api/isochrone`

#### Request Body
```typescript
{
  lat: 37.5637,
  lng: 126.9770,
  minutes: 10,
  profile: "walking" | "driving" | "cycling"
}
```

#### Response
```typescript
{
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [[[lng, lat], ...]]
      },
      properties: {
        contour: 10, // 분
        color: "#ff0000"
      }
    }
  ]
}
```

#### 구현
```typescript
// src/app/api/isochrone/route.ts
import { NextRequest, NextResponse } from 'next/server'
import ky from 'ky'
import { z } from 'zod'

const isochroneRequestSchema = z.object({
  lat: z.number(),
  lng: z.number(),
  minutes: z.number().min(1).max(60),
  profile: z.enum(['walking', 'driving', 'cycling']).default('walking'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { lat, lng, minutes, profile } = isochroneRequestSchema.parse(body)

    const mapboxProfile = profile === 'driving' ? 'driving' : profile === 'cycling' ? 'cycling' : 'walking'
    
    const url = `https://api.mapbox.com/isochrone/v1/mapbox/${mapboxProfile}/${lng},${lat}`
    
    const geojson = await ky.get(url, {
      searchParams: {
        contours_minutes: minutes,
        polygons: 'true',
        access_token: process.env.MAPBOX_ACCESS_TOKEN!,
      },
      timeout: 10000,
    }).json()

    return NextResponse.json(geojson)
  } catch (error) {
    console.error('Isochrone error:', error)
    return NextResponse.json({ error: 'Isochrone failed' }, { status: 500 })
  }
}
```

---

### 4. 모바일 UI (프론트엔드)

#### 페이지 구조
```
src/app/page.tsx (메인 페이지)
  ├── ObservationForm (발견 지점 입력)
  ├── MapView (카카오맵 + 경로/isochrone 표시)
  └── AnalysisResult (분석 결과 요약)
```

#### 상태 관리 (Jotai)
```typescript
// src/store/atoms.ts
import { atom } from 'jotai'
import type { Observation } from '@/types/analyze'

export const observationsAtom = atom<Observation[]>([])
export const analysisResultAtom = atom<any>(null) // API 결과
export const isochroneDataAtom = atom<any>(null)
export const isLoadingAtom = atom(false)
```

#### 4.1. ObservationForm 컴포넌트
```typescript
// src/components/ObservationForm.tsx
'use client'

import { useAtom } from 'jotai'
import { observationsAtom, isLoadingAtom } from '@/store/atoms'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { useState } from 'react'
import ky from 'ky'

export function ObservationForm() {
  const [observations, setObservations] = useAtom(observationsAtom)
  const [isLoading, setIsLoading] = useAtom(isLoadingAtom)
  const [futureMinutes, setFutureMinutes] = useState(10)

  const addObservation = () => {
    setObservations([
      ...observations,
      {
        lat: 37.5547,
        lng: 126.9707,
        timestamp: new Date().toISOString(),
      },
    ])
  }

  const updateObservation = (index: number, field: string, value: any) => {
    const updated = [...observations]
    updated[index] = { ...updated[index], [field]: value }
    setObservations(updated)
  }

  const removeObservation = (index: number) => {
    setObservations(observations.filter((_, i) => i !== index))
  }

  const handleAnalyze = async () => {
    setIsLoading(true)
    try {
      const result = await ky.post('/api/analyze', {
        json: { observations, futureMinutes },
      }).json()

      // 결과를 전역 상태에 저장 (MapView에서 사용)
      // 실제로는 analysisResultAtom에 저장
      console.log('Analysis result:', result)
    } catch (error) {
      console.error('Analysis failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="p-4 space-y-4">
      <div>
        <Label>발견 지점 ({observations.length}/7)</Label>
        <Button onClick={addObservation} disabled={observations.length >= 7} size="sm" className="ml-2">
          추가
        </Button>
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {observations.map((obs, i) => (
          <div key={i} className="flex gap-2 items-end">
            <div className="flex-1">
              <Label className="text-xs">위도</Label>
              <Input
                type="number"
                step="0.0001"
                value={obs.lat}
                onChange={(e) => updateObservation(i, 'lat', parseFloat(e.target.value))}
                className="text-sm"
              />
            </div>
            <div className="flex-1">
              <Label className="text-xs">경도</Label>
              <Input
                type="number"
                step="0.0001"
                value={obs.lng}
                onChange={(e) => updateObservation(i, 'lng', parseFloat(e.target.value))}
                className="text-sm"
              />
            </div>
            <div className="flex-1">
              <Label className="text-xs">시각</Label>
              <Input
                type="datetime-local"
                value={obs.timestamp.slice(0, 16)}
                onChange={(e) => updateObservation(i, 'timestamp', new Date(e.target.value).toISOString())}
                className="text-sm"
              />
            </div>
            <Button variant="destructive" size="sm" onClick={() => removeObservation(i)}>
              삭제
            </Button>
          </div>
        ))}
      </div>

      <div>
        <Label>예상 이동 시간 (분)</Label>
        <Input
          type="number"
          min={1}
          max={60}
          value={futureMinutes}
          onChange={(e) => setFutureMinutes(parseInt(e.target.value))}
        />
      </div>

      <Button 
        onClick={handleAnalyze} 
        disabled={observations.length < 2 || isLoading}
        className="w-full"
      >
        {isLoading ? '분석 중...' : '경로 분석'}
      </Button>
    </Card>
  )
}
```

#### 4.2. MapView 컴포넌트
```typescript
// src/components/MapView.tsx
'use client'

import { useAtomValue } from 'jotai'
import { observationsAtom, analysisResultAtom, isochroneDataAtom } from '@/store/atoms'
import { Map, MapMarker, Polyline, Polygon } from 'react-kakao-maps-sdk'
import { useEffect, useState } from 'react'

export function MapView() {
  const observations = useAtomValue(observationsAtom)
  const analysisResult = useAtomValue(analysisResultAtom)
  const isochroneData = useAtomValue(isochroneDataAtom)
  const [center, setCenter] = useState({ lat: 37.5665, lng: 126.9780 }) // 서울시청

  useEffect(() => {
    if (observations.length > 0) {
      const last = observations[observations.length - 1]
      setCenter({ lat: last.lat, lng: last.lng })
    }
  }, [observations])

  return (
    <Map
      center={center}
      style={{ width: '100%', height: '100%' }}
      level={5}
    >
      {/* 발견 지점 마커 */}
      {observations.map((obs, i) => (
        <MapMarker
          key={i}
          position={{ lat: obs.lat, lng: obs.lng }}
          title={`지점 ${i + 1}`}
        />
      ))}

      {/* 경로 폴리라인 */}
      {analysisResult?.segments?.map((segment: any, i: number) =>
        segment.routes?.map((route: any, j: number) => (
          <Polyline
            key={`${i}-${j}`}
            path={route.polyline.map(([lng, lat]: number[]) => ({ lat, lng }))}
            strokeWeight={5}
            strokeColor={route.mode === 'walking' ? '#4A90E2' : '#E24A4A'}
            strokeOpacity={0.8}
          />
        ))
      )}

      {/* Isochrone 폴리곤 */}
      {isochroneData?.features?.map((feature: any, i: number) => {
        const coords = feature.geometry.coordinates[0]
        return (
          <Polygon
            key={i}
            path={coords.map(([lng, lat]: number[]) => ({ lat, lng }))}
            strokeWeight={2}
            strokeColor="#FF6B6B"
            strokeOpacity={0.8}
            fillColor="#FF6B6B"
            fillOpacity={0.2}
          />
        )
      })}
    </Map>
  )
}
```

#### 4.3. 메인 페이지
```typescript
// src/app/page.tsx
'use client'

import { ObservationForm } from '@/components/ObservationForm'
import { MapView } from '@/components/MapView'
import { useEffect } from 'react'

export default function Home() {
  useEffect(() => {
    // 카카오맵 SDK 로드
    const script = document.createElement('script')
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_JS_KEY}&autoload=false`
    script.async = true
    document.head.appendChild(script)

    script.onload = () => {
      window.kakao.maps.load(() => {
        console.log('Kakao Maps SDK loaded')
      })
    }
  }, [])

  return (
    <div className="h-screen flex flex-col md:flex-row">
      {/* 왼쪽: 입력 폼 (모바일에서는 상단) */}
      <div className="w-full md:w-96 p-4 overflow-y-auto bg-background">
        <h1 className="text-2xl font-bold mb-4">210 트래커</h1>
        <ObservationForm />
      </div>

      {/* 오른쪽: 지도 (모바일에서는 하단) */}
      <div className="flex-1 relative">
        <MapView />
      </div>
    </div>
  )
}
```

---

## 타입 정의 총정리

```typescript
// src/types/analyze.ts
import { z } from 'zod'

export const observationSchema = z.object({
  lat: z.number().min(33).max(38),
  lng: z.number().min(124).max(132),
  timestamp: z.string().datetime(),
})

export const analyzeRequestSchema = z.object({
  observations: z.array(observationSchema).min(2).max(7),
  futureMinutes: z.number().min(1).max(60).optional().default(10),
})

export type Observation = z.infer<typeof observationSchema>
export type AnalyzeRequest = z.infer<typeof analyzeRequestSchema>

export interface SegmentAnalysis {
  from: Observation
  to: Observation
  distance: number // 미터
  duration: number // 초
  avgSpeed: number // km/h
  transportMode: 'walking' | 'vehicle' | 'transit'
  routes: RouteInfo[]
}

export interface RouteInfo {
  mode: 'walking' | 'driving'
  polyline: number[][] // [lng, lat][]
  estimatedDuration: number // 초
  distance: number // 미터
}

export interface AnalyzeResponse {
  segments: SegmentAnalysis[]
}
```

---

## 환경변수 최종 체크

`.env.local`:
```env
NEXT_PUBLIC_KAKAO_JS_KEY=카카오_JAVASCRIPT_KEY
KAKAO_REST_API_KEY=카카오_REST_API_KEY
TMAP_APP_KEY=TMAP_APP_KEY
MAPBOX_ACCESS_TOKEN=MAPBOX_ACCESS_TOKEN
```

Vercel에도 동일하게 등록.

---

## 개발 순서 (시간순)

### 1단계: 타입 및 유틸 세팅 (30분)
- `src/types/analyze.ts` 생성 — 모든 타입 정의
- `src/lib/analyze/segment.ts` — 구간 분석 유틸
- `src/lib/analyze/filter.ts` — 경로 필터링 유틸
- `src/store/atoms.ts` — Jotai 전역 상태

### 2단계: TMAP API 래퍼 작성 (30분)
- `src/lib/tmap/pedestrian.ts` — 보행자 경로
- `src/lib/tmap/driving.ts` — 자동차 경로
- 에러 핸들링, 타임아웃 10초

### 3단계: 백엔드 API 구현 (1.5시간)
- `src/app/api/analyze/route.ts` — 경로 분석 API
- `src/app/api/isochrone/route.ts` — Isochrone API
- 로컬에서 curl/Postman으로 테스트

### 4단계: 프론트엔드 컴포넌트 (2시간)
- `src/components/ObservationForm.tsx` — 입력 폼
- `src/components/MapView.tsx` — 카카오맵 + 경로/isochrone 표시
- `src/app/page.tsx` — 메인 레이아웃
- 모바일 반응형 확인

### 5단계: 통합 테스트 + 배포 (1시간)
- 실제 서울 좌표로 E2E 플로우 테스트
- Vercel 배포 후 프로덕션 URL 확인
- 모바일 브라우저에서 실제 테스트

---

## 체크리스트 (오늘 안에 완료)

- [ ] 타입 정의 (`src/types/analyze.ts`)
- [ ] 구간 분석 유틸 (`src/lib/analyze/segment.ts`)
- [ ] 경로 필터 유틸 (`src/lib/analyze/filter.ts`)
- [ ] Jotai 상태 (`src/store/atoms.ts`)
- [ ] TMAP 보행자 API 래퍼 (`src/lib/tmap/pedestrian.ts`)
- [ ] TMAP 자동차 API 래퍼 (`src/lib/tmap/driving.ts`)
- [ ] `/api/analyze` Route 구현
- [ ] `/api/isochrone` Route 구현
- [ ] `ObservationForm` 컴포넌트
- [ ] `MapView` 컴포넌트
- [ ] `page.tsx` 메인 레이아웃
- [ ] 로컬 E2E 테스트 (서울역→시청 등)
- [ ] Vercel 배포 + 모바일 확인

---

## 미룬 것 (v0.2 이후)

- CCTV 매칭 모듈 (행안부 API + @turf/turf 버퍼)
- TMAP 대중교통 API 연동
- Storybook stories 전체
- vitest 단위 테스트
- 엣지 케이스 처리 (야간, 정지, 극단 속도)
- UI/UX 디테일 (애니메이션, 토스트, 에러 상태)
- 성능 최적화 (API 호출 병렬화, 캐싱)

---

## 예상 산출물

**프로토타입 v0.1 (오늘 완성)**
- 발견 지점 입력 → 경로 추론 → 지도 표시 → isochrone 시각화
- Vercel 배포 URL
- 모바일에서 실제 사용 가능

이 기획서를 Roo Code Architect 모드에 전달하면 → Code 모드로 단계별 파일 생성 자동화할 수 있습니다.
