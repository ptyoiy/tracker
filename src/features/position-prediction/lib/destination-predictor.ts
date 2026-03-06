import type { TransportMode } from '@/types/prediction';
import { getDistance } from 'geolib';

export interface DestinationCandidate {
  id: string;
  name: string;
  lat: number;
  lng: number;
  probability: number;
  category?: string; // e.g. 'subway_station', 'bus_stop', 'poi'
}

type PredictorContext = {
  currentLat: number;
  currentLng: number;
  bearing: number;
  searchRadiusKm: number;
  mode: TransportMode;
};

export class DestinationPredictor {
  /**
   * 베이지안 추론 기반 목적지 후보 확률화 (Mock/Basic 구현)
   * 실제 연동 시엔 Kakao POI API나 DB의 Hotspot 데이터를 통해 대상지를 긁어옵니다.
   */
  async predictDestinations(ctx: PredictorContext): Promise<DestinationCandidate[]> {
    // 1. 후보군 풀 생성 (현재는 임의의 더미 허브 데이터 제공)
    const candidates = await this.fetchPotentialCandidates(ctx);

    // 2. 각 후보지에 대한 Prior, Likelihood 계산
    const scored = candidates.map(c => {
      // Prior: 해당 목적지 카테고리의 기본 확률 (예: 지하철역은 갈 확률이 높음)
      let prior = 0.1;
      if (c.category === 'subway_station' && ctx.mode === 'walking') prior = 0.4;
      if (c.category === 'bus_stop' && ctx.mode === 'walking') prior = 0.3;

      // Likelihood: 현재 이동 방향(bearing)과 목적지 방위각이 일치할 확률 + 거리에 대한 반비례
      const distKm = getDistance({ latitude: ctx.currentLat, longitude: ctx.currentLng }, { latitude: c.lat, longitude: c.lng }) / 1000;

      // 방위각 계산 (0~360)
      const dLon = (c.lng - ctx.currentLng) * Math.PI / 180;
      const lat1 = ctx.currentLat * Math.PI / 180;
      const lat2 = c.lat * Math.PI / 180;
      const y = Math.sin(dLon) * Math.cos(lat2);
      const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
      const targetBearing = (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;

      let angleDiff = Math.abs(targetBearing - ctx.bearing);
      if (angleDiff > 180) angleDiff = 360 - angleDiff;

      // 방향이 맞을수록 (angleDiff가 0에 가까울수록) 높음
      const directionScore = Math.max(0, 1 - (angleDiff / 90)); // 90도 이상 차이나면 0

      // 거리가 가까울수록 높음 (하지만 너무 가까우면 이미 도착한 것)
      const distScore = distKm < ctx.searchRadiusKm ? (1 - (distKm / ctx.searchRadiusKm)) : 0;

      const likelihood = directionScore * 0.7 + distScore * 0.3;

      const posterior = prior * likelihood;

      return {
        ...c,
        probability: posterior
      };
    });

    // 3. Normalize probabilities
    const sum = scored.reduce((acc, c) => acc + c.probability, 0);
    if (sum === 0) return [];

    return scored
      .map(c => ({ ...c, probability: c.probability / sum }))
      .sort((a, b) => b.probability - a.probability);
  }

  private async fetchPotentialCandidates(ctx: PredictorContext): Promise<DestinationCandidate[]> {
    // TODO: 카카오 키워드/카테고리 검색 API 호출 연동하여 실제 후보 가져오기
    // 현 단계에서는 반경 기반 임의의 주요 지점 생성
    const r = ctx.searchRadiusKm * 0.5; // 약간 내측 반경 생성
    // bearing 방향으로 이동한 좌표
    const dLat = (r / 111) * Math.cos(ctx.bearing * Math.PI / 180);
    const dLng = (r / (111 * Math.cos(ctx.currentLat * Math.PI / 180))) * Math.sin(ctx.bearing * Math.PI / 180);

    return [
      {
        id: 'dest_hub_1',
        name: '인근 주요 환승역',
        lat: ctx.currentLat + dLat,
        lng: ctx.currentLng + dLng,
        probability: 0,
        category: 'subway_station'
      },
      {
        id: 'dest_hub_2',
        name: '지역 중심 상가',
        lat: ctx.currentLat + dLat * 0.8,
        lng: ctx.currentLng + dLng * 1.2,
        probability: 0,
        category: 'poi'
      }
    ];
  }
}
