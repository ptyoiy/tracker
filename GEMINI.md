# `tracker` 프로젝트 작업 현황 및 구조 (work.md)

## 프로젝트 개요
본 프로젝트는 Next.js (App Router, TypeScript) 기반의 웹 애플리케이션으로, 지도 상의 위치 추적, 다중 지점 간 경로 분석, 대중교통 경로 탐색, 그리고 주변 CCTV 및 도달 가능 영역(Isochrone)을 시각화하는 기능을 주요 목적으로 합니다. 

기술 스택:
*   **프론트엔드 프레임워크:** Next.js 16 (Turbopack, App Router)
*   **언어:** TypeScript
*   **상태 관리:** Jotai (글로벌/UI 상태), React Hook Form (폼/유효성 검증)
*   **스타일링:** Tailwind CSS v4, `tw-animate-css`, `lucide-react`
*   **지도 및 지리 정보:** Kakao Maps API (`react-kakao-maps-sdk`), `@turf/turf`, `geolib`
*   **데이터 통신:** `ky`, `@tanstack/react-query`
*   **테스트 및 품질:** Vitest, Storybook, Biome, Husky

## 폴더 구조 및 아키텍처
Feature-Sliced Design 원칙이 적용되어 관심사가 뚜렷하게 분리된 아키텍처를 유지하고 있습니다.

```text
src/
├── app/                  # Next.js App Router (페이지 컴포넌트 및 API 라우트)
│   ├── api/              # 다수의 기능별 API 라우트 엔드포인트
│   │   ├── address-search/
│   │   ├── analyze/      # 다중 지점 경로 분석 API
│   │   ├── bus-station-arrivals/
│   │   ├── cctv/         # 공공데이터 연동 CCTV 리스트 및 동기화 API
│   │   ├── cctv-nearby/  
│   │   ├── geocode/      # 역지오코딩 API
│   │   ├── isochrone/    # 도달 가능 영역(Isochrone) API
│   │   ├── place-search/ 
│   │   ├── transit-lookup/   # 대중교통 경로 탐색 API
│   │   ├── transit-nearby/   # 주변 대중교통(버스/지하철) 정류장 API
│   │   └── transit-trace/    # 노선 내 정류장 추적 API
│   ├── page.tsx          # 애플리케이션 메인 페이지
│   └── layout.tsx        # 최상위 레이아웃
│
├── features/             # 비즈니스 로직 및 도메인 단위 모듈 (ui, model, lib 위주 분리)
│   ├── cctv-mapping/     # CCTV 검색 및 지도 매핑 기능
│   ├── isochrone/        # Isochrone (도달 시간 영역) 처리 로직
│   ├── map-view/         # 전역적인 Kakao 지도 표시 방식을 컨트롤
│   ├── observation-input/# 경로 탐색을 위한 발견 지점(Spot) 입력 및 관리
│   ├── result-export/    # 분석된 결과 데이터 저장, Export/Import
│   ├── route-analysis/   # 입력받은 지점들을 통한 교통/도보 멀티모달 경로 분석 및 핫스팟 UI
│   ├── timeline-playback/# 시간 흐름에 따른 위치 애니메이션(재생) 기능
│   └── transit-lookup/   # (신규) 대중교통 및 노선 정보 룩업, 도착 시간 조회 등 대중교통 모듈
│
├── shared/               # 여러 Feature에서 의존하는 공용 모듈 집합
│   ├── api/              # T-map, Kakao, Mapbox, Public Data 등 서드파티 서비스 클라이언트 구현
│   ├── config/           # 환경 변수, 상수 세팅
│   ├── lib/              # 공통 유틸 함수 (거리 계산, 시간 계산기 등)
│   └── ui/               # 단순화된 컴포넌트 UI (Shadcn 기반 공용 버튼, 카드 등)
│
├── store/                # 애플리케이션 전역 상태 조각들 (Jotai Atom 모음)
├── stories/              # Storybook UI 문서화
└── types/                # 시스템 전반에서 사용되는 타입스크립트 인터페이스 (TS Types)
```

## 주요 기능 (Features) 상세 현황

### 1. 지점 검색 및 입력 (`features/observation-input`)
*   사용자가 최소 2개~최대 7개 사이의 발견 지점(Observation Point)을 등록.
*   `kakao-local-api`와 연동된 지오코딩/역지오코딩(`address-search`, `place-search`)을 사용해 주소와 좌표를 식별 및 변환.
*   Zod와 React Hook Form을 이용해 위/경도 범위, 입력 포맷, 시간순 배치 등을 검증.

### 2. 다중 지점 및 핫스팟 경로 분석 (`features/route-analysis`)
*   등록된 발견 지점을 바탕으로 주요 통과 지점, 경로 그룹(`RouteGroupCard`), 그리고 집중 분포 지역(`HotspotList`, `HotspotMarkers` 컴포넌트)을 분석 및 요약.
*   `/api/analyze`로 분석 요청 후 Tmap 등의 외부 API를 이용해 이동 거리, 시간 데이터 산출.

### 3. 멀티모달 지도 통합 표시 (`features/map-view`)
*   `react-kakao-maps-sdk`를 활용해 커스텀 컨트롤(`IsochroneControls`), CCTV, Hotspot, 보행자/차량 폴리라인 등을 지도 레이어로 결합 표시.
*   사용자 반응형(viewport-filter, marker-clustering 등) 성능 최적화 적용중.

### 4. 확장된 대중교통 탐색 및 추적 (`features/transit-lookup`)
*   가장 최근에 대폭 추가 및 보강된 기능.
*   지하철/버스 정류장 주변 탐색(`transit-nearby`), 도착 예상 시간 제공(`bus-station-arrivals`), 노선 흐름 추적(`transit-trace`).
*   사용자가 UI 상에서 교통편을 선별하면 그에 맞춘 위치 이동 데이터가 지도/분석에 종합됨.

### 5. CCTV 공간 검색 (`features/cctv-mapping`)
*   공공데이터 API에 기반해 반경 내의 CCTV 위치 목록 렌더링.
*   DB 핑 처리(`ping-db`) 및 로컬 맵과의 CCTV 위치 동기화(`sync-region`) 작업 수행.

### 6. Isochrone 분석 (`features/isochrone`)
*   주어진 지점에서 특정 조건(예: 10분, 도보/차량)으로 도달 가능한 영역의 다각형을 계산하여 표출 (`api/isochrone`).

## 로컬 개발 및 실행 환경
*   **패키지 관리자:** pnpm (권장)
*   **개발 서버:** `pnpm dev` (포트 3000번, Turbopack 사용)
*   **빌드:** `pnpm build`
*   **포매팅 및 린트:** `pnpm lint`, `pnpm format` (Biome 사용)
*   **테스트:** `pnpm test`, `pnpm test:api` (Vitest 활용)
*   **Storybook:** `pnpm storybook` (포트 6006번 컴포넌트 테스트 스위트)

---
> **요약:** 초기 단순 경로 표시 앱에서 시작해 대중교통 정보, 도착 예상 시간(API 연동 강화), 집중 스팟 분석(`Hotspot`), Isochrone, CCTV까지 포괄적으로 지원하는 고급 지도 및 동선 분석 애플리케이션으로 성장했습니다. 구조는 Next.js App 라우터 철학에 부합하도록 최적화되어 있습니다.
