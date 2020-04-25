// var cleanPSLG = require('clean-pslg')
import * as cleanPSLG from 'clean-pslg'
import { A2 } from './Geom';

/**
 * Merges two points of the *same* segment if their distance is < minDistance
 * For handling
 * @param vertices 
 * @param segments 
 * @param minDistance 
 * inplace
 */
export function mergePointsSameSegment(vertices, segments, minDistance) {

}

export function increaseDistance(vertices, segments, minDistance) {

}

export function mergePointsIntoSegment(vertices: number[][], segments: number[][], minDistance: number): boolean {

    // return cleanPSLG(vertices, segments)

    for (const [idx, [i0, i1]] of segments.entries()) {
        const p0 = vertices[i0], p1 = vertices[i1]



    }

    // todo
    return false;
}

export function findClosePoints(vertices: A2[], segments: number[][], minDistance: number) {
    for (const [idx, [i0, i1]] of segments.entries()) {
        const p0 = vertices[i0], p1 = vertices[i1]

        for (let i = 0; i < vertices.length; i++) {
            if (i != i0 && i != i1) {
                const p = vertices[i]
                const l = distanceToPoint(p0, p1, p)

            }

        }



    }
}


/**
 * TODO: Numererically better implementation
 * -> if distance(p0, p1) >> L this will become very unprecise
 * One idea: contract Points on line closer to target point
 * (probably iterative)
 * @param p0 Point of Line segment 0 
 * @param p1 Point of Line segment 1 
 * @param p Point close to segment
 * 
 * https://en.wikipedia.org/wiki/Distance_from_a_point_to_a_line#Line_defined_by_two_points
 */
export function distanceToPoint([x1, y1]: A2, [x2, y2]: A2, [xp, yp]: A2, refine = false) {
    const dx21 = x2 - x1
    const dy21 = y2 - y1

    const l12sq = dx21 ** 2 + dy21 ** 2;


    const denom = Math.sqrt(l12sq);
    // Not taking abs could give info about orientation
    // Could be interesting in order to contract always towards the segment if p is an endpoint of that segment
    const nom = Math.abs(dy21 * xp - dx21 * yp + x2 * y1 - y2 * x1)
    const l = nom / denom

    if (refine) {
        const dxp1 = xp - x1;
        const dyp1 = yp - y1;
        const l1psq = (dxp1) ** 2 + (dyp1) ** 2
        const dxp2 = xp - x2;
        const dyp2 = yp - y2;
        const l2psq = (dxp2) ** 2 + (dyp2) ** 2

        if (l12sq > 1e3 * l) {

            const sq = Math.sqrt
            const ñ = [dx21, dy21].map(v => v / sq(l12sq))

            // dx = dir_x * dl
            // -> dl = dx/dir_x

            const l1p = sq(l1psq)
            const l2p = sq(l2psq)



            const closePoint1: A2 = [x1+ñ[0]*l1p, y1+ñ[1]*l1p]
            const pertub = closePoint1[0] - xp
            const closePoint2: A2 = [closePoint1[0]+ñ[0]*pertub, closePoint1[1]+ñ[1]*pertub]

            // const dy2 = dxp2 / nDir[0] * nDir[1]
            // const dx2 = dyp2 / nDir[1] * nDir[0]

            // const closePoint1_: A2 = [xp, y2 + dy2]
            // const closePoint2_: A2 = [x2 + dx2, yp]


            return distanceToPoint(closePoint1, closePoint2, [xp, yp])

        }

    }

    return l;

}
