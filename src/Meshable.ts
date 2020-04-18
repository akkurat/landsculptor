import { createRange } from "./helpers"
import { Tri } from "./base"

import Delaunator from 'delaunator'
import { Vector2, Vector3 } from "three"

var cdt2d = require('cdt2d')

export type P = { x: number, y: number, edgeIdx?: number }
export type A3 = [number,number,number]
export type A2 = [number,number]

export class Meshable {
  _del: any
  state: string = 'decroach'
  _steinerBlacklist: A3[] = []

  constructor(public _meshTolerance = .2) { }

  _points: P[] = []

  _edges: A2[] = []
  _allEdges: A2[] = []

  _mesh: A3[]

  _antiCroachPoints: P[] = []
  _steinerPoints: P[] = []
  _allPoints: P[] = []

  min_length = 5


  /**
   * add points connected in order of the given array
   * @param points 
   * @param closed if true, first and last point form an edge as well
   */
  addPoints(points: P[], closed = false) {
    const offset = this._points.length

    this._points.push(...points)

    for (let i = offset; i < this._points.length - 1; i++) {
      this._edges.push([i, i + 1])
      this._points[i].edgeIdx = this._edges.length
      this._points[i + 1].edgeIdx = this._edges.length
    }

    if (closed) {
      this._edges.push([offset, this._points.length - 1])
      this._points[offset].edgeIdx = this._edges.length
      this._points[this._points.length - 1].edgeIdx = this._edges.length
    }

  }

  mesh() {
    // TODO: for more than one refinement: Track all points
    this._allPoints = this._points.concat(this._antiCroachPoints,this._steinerPoints)

    this._del = Delaunator.from(this._allPoints.map(p => [p.x, p.y]))

    this._mesh =  []
    const t = this._del.triangles
    for( let i=0; i<t.length; i+=3 ) {
      this._mesh.push( [t[i],t[i+1],t[i+2]] )
    }
    this._allEdges = this.sanitizeHullEdges()

    // this._mesh = cdt2d(this._allPoints.map(p => [p.x, p.y]))//, this._edges)//, {exterior: false})
  }
  sanitizeHullEdges(): A2[] {
    const hullPoints = this._del.hull

    const e2s = ([i0, i1]: A2): string => i0 + '|' + i1
    const set = new Set(this._edges.map(e2s))
    const edges = this._edges.slice()
    for( let i=0; i<hullPoints.length; i++ ) {
      const i0 = hullPoints[i]
      const next = (i + 1) % hullPoints.length 
      const i1 = hullPoints[next]
      const normEdge: [number,number] = i0<i1?[i0,i1]:[i1,i0]
      const es = e2s(normEdge)
      if(!set.has(es)) {
        edges.push(normEdge)
      }
      
    }
    return edges;
  }

  refineStep(): {seC:P, seL:number, edge:any}[] {
    if(this.state == 'steiner') {
      const placed = this.placeSteiner()
      // if(!placed || placed.length == 0) 
        this.state = 'decroach' // Back to decroach
      // return placed

    } else if(this.state == 'decroach' ) {
      const placed = this.decroach()
      if(!placed || placed.length == 0) 
        this.state = 'steiner'
      return placed

    }
  }
  placeSteiner(): { seC: P; seL: number, edge: any }[] {
    
    for( const t of this._mesh ) {
      const tri = Tri.ofArray_(t,this._allPoints)
      // TODO: go for angle
      if(this.angleCriterion(tri)) {

        const {center,r}  = tri.circumference()
        if( this.isInHull(center) && !this.inBlacklist(t) ) {
          {
            const pt = this._allPoints.findIndex(p => this.inCircle(p, center, r))
            if(pt>-1) {
              const t = this._mesh.find(t => t.includes(pt))
              const idx = t.indexOf(pt)

              const idx0 = t[idx]
              const p0 = this._allPoints[idx0]
              const idx1 = t[(idx + 1) % 3]
              const p1 = this._allPoints[idx1]

              return this.splitAndAdd(p0, p1, t[(idx+2)%3], idx0+'-'+idx1)

            } else {

              this._steinerPoints.push(center)
              this.mesh()
              let e = "" + t
              // if(this.removeInsertedSteinerPoint(t)) {
              //   e = "x"+e+"x"
              // }
              return [{ seC: center, seL: r * 2, edge: e }]
            }
          }
        }
      }
    }
      return []
  }
  inBlacklist(t: A3) {
    const pSet = new Set(t)
    for(let [a,b,c] of this._steinerBlacklist) {
      if(pSet.has(a) && pSet.has(b) && pSet.has(c) ) {
        return true;
      }
    }
    return false
  }
  removeInsertedSteinerPoint(t:A3) {

    const lastIdx = this._allPoints.length-1
    const triags = this._mesh.filter(t => t.includes(lastIdx))

    // TODO: check on encroaching
    const badTriangle = triags.map(tri => Tri.ofArray_(tri, this._allPoints))
      .find(this.angleCriterion)
    
    if(badTriangle) {
      this._steinerPoints.pop()
      this._steinerBlacklist.push(t)
      return true;
    }


    return false;
  }


  private circumCriterion(tri: Tri) {
    return tri.minLength() < tri.perimeter() * 0.15 || tri.maxLength() > tri.perimeter() * .46
  }

  private angleCriterion(tri: Tri) {
    return tri.minAngle() < 19/180*Math.PI
  }

  isInHull(p:P) {
    const hullPoints = this._del.hull
    const path = []
    for( let i=0; i<hullPoints.length; i++ ) {
      path.push({point: this._allPoints[hullPoints[i]]})
    }

    return isInsideCircularPath(p.x, p.y, path)
  }

  splitAndAdd = (p0, p1, thirdPoint, edge) => {
    const seC = Tri.vMean(p0, p1)
    const seL = Tri.distance(p0, p1)
    if (this.min_length > seL) {
      return []
    }

    const p2 = this._allPoints[thirdPoint]

    


    const inCircum = (p, idx) =>
      // idx != thirdPoint && 
      this.inCircle(p, seC, seL/2)

    const close = ({ x, y }) => Math.abs(x - seC.x) < this._meshTolerance
      && Math.abs(y - seC.y) < this._meshTolerance

    const p01 = Tri.vSub(p1,p0)

    const res = this._allPoints.filter(inCircum)
    if (res.length) {

      const closePoints = res.filter(close)

      // Not sure why they even occur

      const alignedPoint = res.find( p => Math.abs(crossProduct(p01, Tri.vSub(p, p0))) < 0.5)

      console.log(alignedPoint)

      if (!alignedPoint && closePoints.length == 0) {
        this._antiCroachPoints.push(seC)
        const placed = []
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
    return Math.sqrt((p.x - seC.x) ** 2 + (p.y - seC.y) ** 2) < r - this._meshTolerance
  }

  decroach() {


    // Todo: dedupe
    // function onlyUnique(value, index, self) { 
    //  return self.indexOf(value) === index;
    //  }

    const richPoint = (p0, p1, idx0, idx1, other?) => ({ l: Tri.distance(p0, p1), p0, p1, idx0, idx1, other })
    const presentEdges = this._allEdges.map( ([idx0,idx1]) => {
      const p0 = this._allPoints[idx0]
      const p1 = this._allPoints[idx1]
      return richPoint(p0, p1, idx0, idx1)
    } );
    // this._mesh.forEach((idxs) => {

    //   const pts = idxs.map(idx => this._allPoints[idx])

    //   for (let i = 0; i < 3; i++) {
    //     presentEdges.push(richPoint(pts[i], pts[(i + 1) % 3], idxs[i], idxs[(i + 1) % 3], idxs[(i + 2) % 3]))
    //   }
    // }
    // )


    presentEdges.sort( (e1,e2) => e2.l - e1.l ) 

    // const presentEdges = []
    // this.forEachTriangleEdge( (e,p0,p1) => presentEdges.push({e,p0,p1}))

    for (const {p0,p1,idx0,idx1,other} of presentEdges) {

      const placed = this.splitAndAdd(p0, p1, other, idx0+"<|-"+other+"-|>"+idx1)
      if (placed.length > 0) { // splitting has been done -> remesh
        return placed
      }



      // TODO: optimize search for x / y (having sorted arrays by x/y)
      // look for the square around the circle first
      // and only then do costly multiplication



    }

    return null 


  }


forEachTriangleEdge(callback: (e,p,q) => void) {
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


export function line_(x1, y1, x2, y2, points: number): { x: number, y: number }[] {
  return line(new Vector3(x1,y1), new Vector3(x2,y2), points)
  
}
export function line(vStart: THREE.Vector3, vEnd: THREE.Vector3, points: number): { x: number, y: number }[] {
  const delta = vEnd.clone().sub(vStart).multiplyScalar(1 / (points - 1))

  const out = Array(points)
  for (let i = 0; i < out.length; i++) {
    out[i] = vStart.clone().addScaledVector(delta, i)
  }
  return out;

}
export function circle(x, z, r, h = 0, layers = 1): { x: number, y: number }[] {
  const points = []
  const numInnerPoints = 24

  for (let i = layers; i >= 1; i--) {
    const range: number[] = createRange(0, Math.PI * 2, 2 ** (i - 1) * numInnerPoints)
    range.forEach((v, idx) => {
      const sin = Math.sin(v)
      const cos = Math.cos(v)
      // if (idx % (layers - i) == 0) {
      const factor = r * i / layers
      points.push({ x: factor * cos + x, y: factor * sin + z })
      // }
    })
  }
  // points.push({ x: x, y: z })
  return points;
}


//Returns bool
function isInsideCircularPath(x,y,segments){
  //Test each segment for intersection
  var number_vertexes = segments.length;
  var i = 0;
  var j = 0;
  var contains = false;

  //Foreach segment, let's test intersection and flip the sign of the contains variable
  //Test from the test point going right
  for(i = 0, j = number_vertexes-1; i < number_vertexes; j = i++){
    //If we're in the y range and we intersect, then that's what we want, flip the sign of contains
    if( ((segments[i].point.y > y) != (segments[j].point.y > y)) && (x < (segments[j].point.x - segments[i].point.x) * (y - segments[i].point.y) / (segments[j].point.y - segments[i].point.y) + segments[i].point.x)){
      contains = !contains;
    }
  }
  return contains;
}

function crossProduct(a:P, b:P) {
  return a.x * b.y - a.y * b.x
}