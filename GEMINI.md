# GEMINI.md for the `tracker` Project

## Project Overview

This project is a Next.js application built with TypeScript, leveraging the `app` directory for routing and structure. It appears to be focused on web-based mapping, geocoding, route analysis, and observation input, indicated by directories such as `features/map-view`, `features/route-analysis`, and API routes for `geocode` and `isochrone`.

Key technologies and tools used include:

*   **Framework:** Next.js (with Turbopack enabled for development)
*   **Language:** TypeScript
*   **UI/Component Library:** Utilizes custom shared UI components and potentially a component library integrated via `components.json` and `shadcn-ui` (inferred from `package.json` devDependencies).
*   **Styling:** Tailwind CSS (version 4) and `tw-animate-css`.
*   **State Management:** Jotai (`jotai`) for reactive state management.
*   **API Client:** `ky` for making HTTP requests.
*   **Data Fetching/Utility:** `react-hook-form` for form handling, `zod` for schema validation, `date-fns` for date manipulation, `@turf/turf` and `geolib` for geospatial calculations, and `react-kakao-maps-sdk` for map integration.
*   **Linting & Formatting:** Biome (`@biomejs/biome`) is used for code quality and consistency, configured to respect `.gitignore`.
*   **Testing:** Vitest (`vitest`) is used for unit, API, and Storybook integration tests.
*   **Component Documentation:** Storybook (`storybook`) is used for developing and testing UI components in isolation.
*   **React Compiler:** Enabled via `reactCompiler: true` in `next.config.ts`.

## Folder Structure

폴더 구조는 Feature-Sliced Design 원칙을 적용하되, 프로젝트 규모에 맞춰 간소화한 3-layer 구조를 사용합니다.
src/
├── app/ # Next.js App Router (pages + API routes)
│ ├── api/
│ │ ├── analyze/
│ │ │ └── route.ts # 경로 분석 API
│ │ ├── isochrone/
│ │ │ └── route.ts # Isochrone API
│ │ └── geocode/
│ │ └── route.ts # 역지오코딩 API
│ ├── page.tsx # 메인 페이지
│ ├── layout.tsx
│ └── globals.css
│
├── features/ # 기능 단위 모듈 (비즈니스 로직)
│ ├── observation-input/ # 발견 지점 입력
│ │ ├── ui/
│ │ │ ├── ObservationForm.tsx
│ │ │ └── ObservationFormFields.tsx
│ │ ├── model/
│ │ │ ├── schema.ts # Zod schema
│ │ │ └── atoms.ts # Jotai atoms
│ │ └── lib/
│ │ └── validation.ts
│
│ ├── route-analysis/ # 경로 분석
│ │ ├── ui/
│ │ │ ├── RouteCard.tsx
│ │ │ ├── RouteComparison.tsx
│ │ │ └── SegmentBadge.tsx
│ │ ├── model/
│ │ │ ├── types.ts
│ │ │ └── atoms.ts
│ │ └── lib/
│ │ ├── segment-analyzer.ts
│ │ ├── route-filter.ts
│ │ └── multimodal.ts
│ │
│ ├── map-view/ # 지도 표시
│ │ ├── ui/
│ │ │ ├── MapView.tsx
│ │ │ ├── ObservationMarker.tsx
│ │ │ ├── RoutePolyline.tsx
│ │ │ ├── IsochronePolygon.tsx
│ │ │ └── CCTVMarker.tsx
│ │ ├── model/
│ │ │ └── atoms.ts
│ │ └── lib/
│ │ ├── marker-clustering.ts
│ │ └── viewport-filter.ts
│ │
│ ├── timeline-playback/ # 타임라인 재생
│ │ ├── ui/
│ │ │ ├── TimelineSlider.tsx
│ │ │ ├── PlaybackControls.tsx
│ │ │ └── AnimatedMarker.tsx
│ │ ├── model/
│ │ │ └── playback-state.ts
│ │ └── lib/
│ │ ├── interpolation.ts
│ │ └── animation.ts
│ │
│ ├── result-export/ # 분석 결과 저장/공유
│ │ ├── ui/
│ │ │ ├── ExportButton.tsx
│ │ │ └── ImportDropzone.tsx
│ │ └── lib/
│ │ ├── storage.ts
│ │ └── json-export.ts
│ │
│ └── cctv-mapping/ # CCTV 매핑
│ ├── ui/
│ │ └── CCTVList.tsx
│ ├── model/
│ │ ├── types.ts
│ │ └── atoms.ts
│ └── lib/
│ ├── buffer-filter.ts
│ └── cctv-api.ts
│
├── shared/ # 공유 모듈
│ ├── api/ # API 클라이언트
│ │ ├── tmap/
│ │ │ ├── pedestrian.ts
│ │ │ ├── driving.ts
│ │ │ └── transit.ts
│ │ ├── mapbox/
│ │ │ └── isochrone.ts
│ │ ├── kakao/
│ │ │ └── geocoder.ts
│ │ └── public-data/
│ │ └── cctv.ts
│ │
│ ├── lib/ # 유틸리티
│ │ ├── geo/
│ │ │ ├── distance.ts
│ │ │ └── speed.ts
│ │ ├── time/
│ │ │ └── duration.ts
│ │ └── error-handler.ts
│ │
│ ├── ui/ # 공용 UI 컴포넌트 (shadcn/ui 래퍼)
│ │ ├── button.tsx
│ │ ├── input.tsx
│ │ ├── card.tsx
│ │ └── ...
│ │
│ └── config/
│ ├── constants.ts # 전역 상수
│ └── env.ts # 환경변수 타입
│
└── types/ # 전역 타입 정의
├── analyze.ts
├── map.ts
└── api.ts

## Design Principles

*   **features/:** 각 기능은 독립적으로 동작 가능하도록 ui/model/lib 구조
*   **shared/:** 여러 feature에서 공통으로 사용하는 모듈
*   **app/:** 라우팅과 API Route만 담당, 비즈니스 로직은 features로 위임

## Features

### Feature: Observation Input (`features/observation-input`)

*   **Purpose:** Enables users to input 2 to 7 discovery points, automatically display their addresses via reverse geocoding, and sort them by timestamp.
*   **Key Components:**
    *   `ObservationInputPage.tsx`: The main page component that orchestrates the `ObservationForm` and `MapView`. It manages the global state for observations and related data, the active tab, and the currently active observation index, coordinating interactions between the form and the map.
    *   `ObservationForm.tsx`: Implements the input form using React Hook Form and Zod for validation. It supports dynamic addition/deletion of observation points (min 2, max 7), inputting coordinates, timestamps, and displays addresses obtained via reverse geocoding. It triggers API calls for route analysis and isochrone calculation upon submission. It also handles user interaction to set the active observation for map highlighting.
    *   `MapView.tsx`: A component using `react-kakao-maps-sdk` to display observation points on a map. It highlights the marker corresponding to the currently active observation in the form and reports map clicks back to the parent for updating observation coordinates.
*   **Data Flow & State Management:**
    *   Global state for observations and related data (e.g., `observationsAtom`, `activeTabAtom`, `futureMinutesAtom`) is managed using Jotai.
    *   Local form state (observations, `futureMinutes`) is managed by React Hook Form.
    *   The `activeObservationIndex` state in `ObservationInputPage.tsx` is crucial for synchronizing the active input field in the form with the highlighted marker on the map.
*   **API Integrations:**
    *   **Reverse Geocoding:** The `POST /api/geocode` route is implemented to convert coordinates (lat, lng) into a human-readable address using the Kakao Local API (`coord2address.json`). This API endpoint requires `KAKAO_API_KEY` to be set in environment variables.
    *   **Analysis & Isochrone:** The `ObservationForm` submits data to `/api/analyze` and `/api/isochrone` endpoints for route analysis and travelable area calculation, respectively.
*   **Validation:** Implemented using Zod schemas (`observationSchema`, `formSchema`) for coordinate ranges (lat: 33-38, lng: 124-132), timestamp format, and the number of observations (2-7).
*   **Technologies:** React, Next.js (App Router), TypeScript, React Hook Form, Zod, Jotai, Kakao Maps (`react-kakao-maps-sdk`), `ky` for API calls, and Tailwind CSS for styling.

### Feature: Route Analysis (`features/route-analysis`)

*   **Purpose:** Processes sequential observation points to determine routes and provides analysis based on various factors.
*   **Key Components:** UI components like `RouteCard.tsx`, `RouteComparison.tsx` for displaying results, and `SegmentBadge.tsx` for individual route segments.
*   **Logic:** Implemented in `lib/segment-analyzer.ts`, `lib/route-filter.ts`, and `lib/multimodal.ts`, potentially integrating with shared API clients for T-map and other services.

### Feature: Map Display (`features/map-view`)

*   **Purpose:** Visualizes observation points, routes, and travelable areas (isochrones) on an interactive map.
*   **Key Components:** `MapView.tsx`, `ObservationMarker.tsx`, `RoutePolyline.tsx`, `IsochronePolygon.tsx`, `CCTVMarker.tsx`.
*   **Functionality:** Includes marker clustering (`lib/marker-clustering.ts`) and viewport filtering (`lib/viewport-filter.ts`) for performance.

### Feature: Timeline Playback (`features/timeline-playback`)

*   **Purpose:** Allows users to replay events or movement sequences over time.
*   **Components:** UI elements like `TimelineSlider.tsx`, `PlaybackControls.tsx`, and `AnimatedMarker.tsx`.
*   **Logic:** Animation and interpolation handled by `lib/animation.ts` and `lib/interpolation.ts`.

### Feature: Result Export (`features/result-export`)

*   **Purpose:** Enables users to save or share analysis results.
*   **Components:** `ExportButton.tsx` and `ImportDropzone.tsx`.
*   **Functionality:** Uses `lib/storage.ts` and `lib/json-export.ts` for data handling.

### Feature: CCTV Mapping (`features/cctv-mapping`)

*   **Purpose:** Integrates CCTV data or mapping functionality into the application.
*   **Components:** `CCTVList.tsx`.
*   **Logic:** Utilizes `lib/buffer-filter.ts` and interacts with CCTV data sources via `lib/cctv-api.ts`.

## Building and Running

### Development Server

To start the local development server with Turbopack enabled:

*   `pnpm dev`
*   (Alternatively: `npm run dev`, `yarn dev`, `bun dev`)

This command will start the server, typically at `http://localhost:3000`.

### Building for Production

To create a production-ready build of the application:

*   `pnpm build`
*   (Alternatively: `npm run build`, `yarn build`)

### Starting Production Server

To run the production build locally:

*   `pnpm start`
*   (Alternatively: `npm run start`, `yarn start`)

### Storybook

To run the Storybook development server for UI component exploration:

*   `pnpm storybook`
*   (Alternatively: `npm run storybook`, `yarn storybook`)

To build the static Storybook output:

*   `pnpm build-storybook`
*   (Alternatively: `npm run build-storybook`, `yarn build-storybook`)

## Testing

The project is configured with Vitest for various testing needs.

### Unit Tests

To run all unit tests:

*   `pnpm test`
*   (Alternatively: `npm test`, `vitest --project=unit`)

To run unit tests in watch mode:

*   `pnpm test:unit:watch`
*   (Alternatively: `vitest --project=unit --watch`)

### API Tests

To run tests specifically for API routes:

*   `pnpm test:api`
*   (Alternatively: `npm run test:api`)

### Storybook Tests

To run tests related to Storybook components (integration/E2E):

*   `pnpm test:storybook`
*   (Alternatively: `npm run test:storybook`)

## Linting and Formatting

The project uses Biome for code linting and formatting.

### Linting

To check code quality and identify potential issues:

*   `pnpm lint`
*   (Alternatively: `npm run lint`, `biome check .`)

### Fixing Linting Issues

To automatically fix linting issues:

*   `pnpm lint:fix`
*   (Alternatively: `npm run lint:fix`, `biome check --write .`)

### Formatting

To automatically format the code according to Biome's configured style:

*   `pnpm format`
*   (Alternatively: `npm run format`, `biome format --write .`)

## Development Conventions

*   **File Structure:** Follows a `src` directory with feature-based organization (e.g., `src/features/map-view`) and shared UI components (e.g., `src/shared/ui`). API routes are located in `src/app/api/`.
*   **TypeScript:** All code is written in TypeScript, leveraging type safety.
*   **Biome:** Code is kept consistent through Biome's linting and formatting rules.
*   **Vitest:** Tests are written using Vitest, with clear separation for unit and API tests.
*   **Storybook:** UI components are developed and documented using Storybook.
*   **Next.js Features:** Utilizes Next.js features like the `app` directory, API routes, and server-side rendering capabilities. React Compiler is enabled for performance optimizations.
*   **Dependencies:** A rich set of dependencies indicates a focus on mapping, geospatial analysis, and user input handling.
