export function filterRoutesByTime(
  routes: Array<{ mode: string; estimatedDuration: number }>,
  actualDuration: number,
  tolerance: number = 1, // 100% 허용 오차
) {
  return routes.filter((route) => {
    const lower = actualDuration * (1 - tolerance);
    const upper = actualDuration * (1 + tolerance);
    return route.estimatedDuration >= lower && route.estimatedDuration <= upper;
  });
}
