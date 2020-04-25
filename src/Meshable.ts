import { createRange } from "./helpers"
import { Tri } from "./Tri"

import Delaunator from 'delaunator'
import * as RhG from "./Geom"
import { vAdd, scale } from './Geom'
import { P, A2, A3 } from './Geom'

var cdt2d = require('cdt2d')



interface IMeshOptions {
  minAngle?: number
  min2CircumferenceRatio?: number
  minLength?: number
  maxLength?: number
  geomTolerance?: number
}

const defaultMeshOptions: IMeshOptions = {
  min2CircumferenceRatio: 0.2,
  geomTolerance: 0.1
}
export class Meshable<T extends P> {
  
  _del: any
  state: string = 'decroach'
  _steinerBlacklist: A3[] = []
  steinerFinished: boolean = false
  decroachFinished: boolean = false

  constructor(public meshOptions: IMeshOptions) {
    this.meshOptions = { ...defaultMeshOptions, ...meshOptions }
  }

  averageinterpolator: (newPosition: P,p0: T,p1: T) => T 
  interpolator: (newPostion: P, eventPointsIdx: number[], allPoints: T[]) => T

  /**Input Vertices */
  _points: T[] = []

  /**Input segments (PSLG). Rupert refers to the input as segment and to the triangulation lines as edges */
  _segment: A2[] = []
  /** Input edges + edges from the convex hull */
  _allSegments: A2[] = []

  _mesh: A3[]

  /** Points inserted to split input segments */
  _antiCroachPoints: T[] = []
  /** Points inserted to improve triangle quality */
  _steinerPoints: T[] = []
  // Delaunator uses native arrays for point storage
  // -> efficiency improvements
  _allPoints: T[] = []

  min_length = 5
  // max_length 

  addPoints_(points: A2[], closed = false, factory: ([x, y]) => T) {
    return this.addPoints(points.map(factory), closed)
  }
  /**
   * add points connected in order of the given array
   * @param points 
   * @param closed if true, first and last point form an edge as well
   */
  addPoints(points: T[], closed = false) {
    const offset = this._points.length

    this._points.push(...points)

    for (let i = offset; i < this._points.length - 1; i++) {
      this.addEdge(i, i + 1)
    }

    if (closed && points.length > 1) {
      this.addEdge(offset, this._points.length - 1)
    }
  }

  private addEdge(i0: number, i1: number) {
    this._segment.push([i0, i1])
  }

  init() {
    this.mesh()
    this._allSegments = this.sanitizeHullEdges()
  }

  private mesh() {
    this.updatePoints()

    this._del = Delaunator.from(this._allPoints.map(p => [p.x, p.y]))

    this._mesh = []
    const t = this._del.triangles
    for (let i = 0; i < t.length; i += 3) {
      this._mesh.push([t[i], t[i + 1], t[i + 2]])
    }

    // this._mesh = cdt2d(this._allPoints.map(p => [p.x, p.y]))//, this._edges)//, {exterior: false})
  }
  private updatePoints() {
    this._allPoints = this._points.concat(this._antiCroachPoints, this._steinerPoints)
  }

  private sanitizeHullEdges(): A2[] {
    const hullPoints = this._del.hull

    const e2s = ([i0, i1]: A2): string => i0 + '|' + i1
    const set = new Set(this._segment.map(e2s))
    const edges = this._segment.slice()
    for (let i = 0; i < hullPoints.length; i++) {
      const i0 = hullPoints[i]
      const next = (i + 1) % hullPoints.length
      const i1 = hullPoints[next]
      const normEdge: [number, number] = i0 < i1 ? [i0, i1] : [i1, i0]
      const es = e2s(normEdge)
      if (!set.has(es)) {
        edges.push(normEdge)
      }

    }
    return edges;
  }

  refineStep(): { seC: P, seL: number, edge: any }[] {
    let placed
    if (this.steinerFinished && this.decroachFinished) {
      this.state = 'finished'
    }
    if (this.state == 'steiner') {
      placed = this.placeSteiner()
      if (!placed || placed.length == 0)
        this.steinerFinished = true

      this.state = 'decroach' // Back to decroach

    } else if (this.state == 'decroach') {
      placed = this.decroach()
      if (!placed || placed.length == 0) {
        this.state = 'steiner'
        this.decroachFinished = true
      }
    }
    this.mesh()
    return placed
  }

  private splitSegment(segmentIndex: number, newPoint: P) {
    const toSplitEdge = this._allSegments[segmentIndex]
    const originalSplitEdge = toSplitEdge.slice()

       const [i0,i1] = toSplitEdge
       const p0 = this._allPoints[i0], p1 = this._allPoints[i1]

    const newPtIndex = this._points.length + this._antiCroachPoints.length

    this._allSegments.push([toSplitEdge[1], newPtIndex])
    toSplitEdge[1] = newPtIndex

    this._antiCroachPoints.push(this.averageinterpolator(newPoint, p0, p1))
    this.updatePoints()

    // this._allSegments = 
        // this._allSegments = 
    // this._allSegments = 

  }
  private placeSteiner(): { seC: P; seL: number, edge: any }[] {

    for (const t of this._mesh) {
      const tri = Tri.ofArray_(t, this._allPoints)
      if (this.badTriangleCriterion(tri)) {

        
        const { center, r } = tri.circumference()
        // if( this.isInHull(center) && !this.inBlacklist(t) )
        {
          for (let [idx, segment] of this._allSegments.entries()) {
            const [p0, p1] = segment.map(idx => this._allPoints[idx])
            const pc = RhG.vMean(p0, p1)
            const l = RhG.distance(p0, p1)
            if (this.inCircle(center, pc, l / 2)) {
              this.splitSegment(idx, pc)
              return [{ seC: pc, seL: l, edge: idx }]
            }
          }



          this._steinerPoints.push(this.interpolator(center, t, this._allPoints))
          this.mesh()
          let e = "" + t
          // if(this.removeInsertedSteinerPoint(t)) {
          //   e = "x"+e+"x"
          // }
          return [{ seC: center, seL: r * 2, edge: e }]
        }
      }
    }
    return []
  }

  private isBadTriangle(tri: Tri) {

  }

  private circumCriterion(tri: Tri) {
    return tri.minLength() < tri.perimeter() * 0.15 || tri.maxLength() > tri.perimeter() * .46
  }

  private badTriangleCriterion(tri: Tri) {
    return tri.minAngle() < this.meshOptions.minAngle / 180 * Math.PI || tri.maxLength() > this.meshOptions.maxLength
  }

  isInHull(p: P) {
    const hullPoints = this._del.hull
    const path = []
    for (let i = 0; i < hullPoints.length; i++) {
      path.push({ point: this._allPoints[hullPoints[i]] })
    }

    return isInsideCircularPath(p.x, p.y, path)
  }

  splitAndAdd = (p0, p1, edgeIdx, edge) => {
    const seC = RhG.vMean(p0, p1)
    const seL = RhG.distance(p0, p1)
    // if (this.min_length > seL) {
    //   return []
    // }

    const inCircum = (p, idx) => this.inCircle(p, seC, seL / 2)

    const tol = this.meshOptions.geomTolerance

    const close = ({ x, y }) => Math.abs(x - seC.x) < tol
      && Math.abs(y - seC.y) < tol

    const p01 = RhG.vSub(p1, p0)

    const res = this._allPoints.filter(inCircum)

    if (res.length) {

      const closePoints = res.filter(close)

      // Not sure why they even occur

      const alignedPoint = res.find(p => Math.abs(crossProduct(p01, RhG.vSub(p, p0))) < 0.5)

      console.log(alignedPoint)

      if (!alignedPoint && closePoints.length == 0) {
        const placed = []

        this.splitSegment(edgeIdx, seC)
        // placed.push(...splitAndAdd(p0, seC) )
        // placed.push(...splitAndAdd(seC, p1) )
        placed.push({ seC, seL, edge })

        return placed
        // this._points[]
      } else if (closePoints.length > 1) {

      }

    }
    return []
  }

  private inCircle(p: any, seC: { x: number; y: number }, r: number) {
    return Math.sqrt((p.x - seC.x) ** 2 + (p.y - seC.y) ** 2) < r - this.meshOptions.geomTolerance
  }

  decroach() {


    // Todo: dedupe
    // function onlyUnique(value, index, self) { 
    //  return self.indexOf(value) === index;
    //  }

    const richPoint = (p0, p1, idx0, idx1, segmentIdx) => ({ l: RhG.distance(p0, p1), p0, p1, idx0, idx1, segmentIdx })
    const presentEdges = this._allSegments.map(([idx0, idx1], idx) => {
      const p0 = this._allPoints[idx0]
      const p1 = this._allPoints[idx1]
      return richPoint(p0, p1, idx0, idx1, idx)
    });
    // this._mesh.forEach((idxs) => {

    //   const pts = idxs.map(idx => this._allPoints[idx])

    //   for (let i = 0; i < 3; i++) {
    //     presentEdges.push(richPoint(pts[i], pts[(i + 1) % 3], idxs[i], idxs[(i + 1) % 3], idxs[(i + 2) % 3]))
    //   }
    // }
    // )


    presentEdges.sort((e1, e2) => e2.l - e1.l)

    // const presentEdges = []
    // this.forEachTriangleEdge( (e,p0,p1) => presentEdges.push({e,p0,p1}))

    for (const { p0, p1, idx0, idx1, segmentIdx } of presentEdges) {

      const placed = this.splitAndAdd(p0, p1, segmentIdx, idx0 + "<|-" + segmentIdx + "-|>" + idx1)
      if (placed.length > 0) { // splitting has been done -> remesh
        return placed
      }



      // TODO: optimize search for x / y (having sorted arrays by x/y)
      // look for the square around the circle first
      // and only then do costly multiplication



    }

    return null


  }


  forEachTriangleEdge(callback: (e, p, q) => void) {
    function nextHalfedge(e) { return (e % 3 === 2) ? e - 2 : e + 1; }
    const delaunay = this._del
    const points = this._allPoints
    for (let e = 0; e < delaunay.triangles.length; e++) {
      if (e > delaunay.halfedges[e]) {
        const p = points[delaunay.triangles[e]];
        const q = points[delaunay.triangles[nextHalfedge(e)]];
        callback(e, p, q);
      }
    }
  }


}


export function line_<T extends P>(x1, y1, x2, y2, points: number, v: (p: P) => T): T[] {
  return line({ x: x1, y: y1 }, { x: x2, y: y2 }, points, v)

}
export function line<T extends P>(vStart: P, vEnd: P, numPoints: number,
  pointFactory = (p: P) => p): T[] {

  const delta = RhG.scale(RhG.vSub(vEnd, vStart), (1 / (numPoints - 1)))

  const out = Array(numPoints)
  for (let i = 0; i < out.length; i++) {
    out[i] = pointFactory(vAdd(vStart, scale(delta, i)))

  }
  return out;

}
export function circle<T extends P>(x, y, r, factory: (p: P) => T, numInnerPoints = 24, layers = 1): T[] {
  const points = []

  for (let i = layers; i >= 1; i--) {
    const range: number[] = createRange(0, Math.PI * 2, 2 ** (i - 1) * numInnerPoints)
    range.forEach((v, idx) => {
      const sin = Math.sin(v)
      const cos = Math.cos(v)
      // if (idx % (layers - i) == 0) {
      const factor = r * i / layers
      let p = { x: factor * cos + x, y: factor * sin + y }
      if (typeof factory === 'function') {
        p = factory(p)
      }
      points.push(p)
      // }
    })
  }
  return points;
}


//Returns bool
export function isInsideCircularPath(x, y, segments) {
  //Test each segment for intersection
  var number_vertexes = segments.length;
  var i = 0;
  var j = 0;
  var contains = false;

  //Foreach segment, let's test intersection and flip the sign of the contains variable
  //Test from the test point going right
  for (i = 0, j = number_vertexes - 1; i < number_vertexes; j = i++) {
    //If we're in the y range and we intersect, then that's what we want, flip the sign of contains
    if (((segments[i].point.y > y) != (segments[j].point.y > y)) && (x < (segments[j].point.x - segments[i].point.x) * (y - segments[i].point.y) / (segments[j].point.y - segments[i].point.y) + segments[i].point.x)) {
      contains = !contains;
    }
  }
  return contains;
}

function crossProduct(a: P, b: P) {
  return a.x * b.y - a.y * b.x
}