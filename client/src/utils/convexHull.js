/**
 * convexHull.js
 * Computes a convex hull polygon enclosing a set of [lng, lat] points,
 * used to auto-generate an area boundary from uploaded point data
 * (instead of requiring a manually-traced polygon every time).
 *
 * Pure JS, no turf/geo library dependency — Andrew's monotone chain
 * algorithm, O(n log n).
 */

function cross([ox, oy], [ax, ay], [bx, by]) {
    return (ax - ox) * (by - oy) - (ay - oy) * (bx - ox);
}

export function convexHull(points) {
    const pts = Array.from(new Set(points.map((p) => p.join(","))))
        .map((s) => s.split(",").map(Number))
        .sort((a, b) => a[0] - b[0] || a[1] - b[1]);

    if (pts.length < 3) return pts;

    const lower = [];
    for (const p of pts) {
        while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) {
            lower.pop();
        }
        lower.push(p);
    }

    const upper = [];
    for (let i = pts.length - 1; i >= 0; i--) {
        const p = pts[i];
        while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) {
            upper.pop();
        }
        upper.push(p);
    }

    lower.pop();
    upper.pop();
    return lower.concat(upper);
}

export function padHull(hullPoints, paddingRatio = 0.12) {
    if (hullPoints.length < 3) return hullPoints;

    const cx = hullPoints.reduce((sum, [x]) => sum + x, 0) / hullPoints.length;
    const cy = hullPoints.reduce((sum, [, y]) => sum + y, 0) / hullPoints.length;

    return hullPoints.map(([x, y]) => [
        cx + (x - cx) * (1 + paddingRatio),
        cy + (y - cy) * (1 + paddingRatio),
    ]);
}

export function boundaryFromPoints(points, paddingRatio = 0.12) {
    const hull = convexHull(points);
    if (hull.length < 3) return null;

    const padded = padHull(hull, paddingRatio);
    const ring = [...padded, padded[0]];

    return { type: "Polygon", coordinates: [ring] };
}