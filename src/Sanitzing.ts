// var cleanPSLG = require('clean-pslg')
import * as cleanPSLG from 'clean-pslg'

/**
 * Merges two points of the *same* segment if their distance is < minDistance
 * For handling
 * @param vertices 
 * @param segments 
 * @param minDistance 
 * inplace
 */
export function mergePointsSameSegment(vertices,segments, minDistance) {
    
}

export function increaseDistance(vertices,segments, minDistance) {

}

export function mergePointsIntoSegment(vertices: number[][], segments: number[][], minDistance: number): boolean {

    // return cleanPSLG(vertices, segments)

    for( const [idx,[i0,i1]] of segments.entries() ) {
        const p0 = vertices[i0], p1 = vertices[i1]



    }

    // todo
    return false;
}