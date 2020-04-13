import { createRange } from "./helpers"
import { Tri } from "./base"

import Delaunator from 'delaunator'

var cdt2d = require('cdt2d')

export type P = { x: number, y: number, edgeIdx?: number }

export class Meshable {
  _del: any
  state: string = 'decroach'

  constructor(public _meshTolerance = 1e-4) { }

  _points: P[] = []

  _edges: number[][] = []

  _mesh: number[][]

  _antiCroachPoints: P[] = []
  _steinerPoints: P[] = []
  _allPoints: P[] = []


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
    this._allPoints = this._antiCroachPoints.concat(this._points,this._steinerPoints)
    this._del = Delaunator.from(this._allPoints.map(p => [p.x, p.y]))

    this._mesh =  []
    const t = this._del.triangles
    for( let i=0; i<t.length; i+=3 ) {
      this._mesh.push( [t[i],t[i+1],t[i+2]] )
    }

    // this._mesh = cdt2d(this._allPoints.map(p => [p.x, p.y]))//, this._edges)//, {exterior: false})
  }

  refineStep(min_length = 40): {seC:P, seL:number}[] {
    if(this.state == 'steiner') {
      const placed = this.placeSteiner(min_length)
      if(!placed || placed.length == 0) {
        this.state = 'decroach' // Back to decroach
      }
      return placed

    } else if(this.state == 'decroach' ) {
      const placed = this.decroach(min_length)
      if(!placed || placed.length == 0) {
        this.state = 'steiner'
      }
      return placed

    }
  }
  placeSteiner(min_length: number): { seC: P; seL: number }[] {
    for( const t of this._mesh ) {
      const tri = Tri.ofArray_(t,this._allPoints)
      // TODO: go for angle
      if(tri.minLength() < tri.perimeter()*0.15 || tri.maxLength() > tri.perimeter()*.46) {

        const {center,r}  = tri.circumference()
        if(this.isInHull(center)) {
          this._steinerPoints.push(center)
          return [{ seC: center, seL: r * 2 }]
        }
      }
    }
      return []
    

  }
  isInHull(p:P) {
    const hullPoints = this._del.hull
    const path = []
    for( let i=0; i<hullPoints.length; i++ ) {
      path.push({point: this._allPoints[hullPoints[i]]})
    }

    return isInsideCircularPath(p.x, p.y, path)
  }


  decroach(min_length) {

    const splitAndAdd = (p0, p1) => {
      const seC = Tri.vMean(p0, p1) as P
      const seL = Tri.distance(p0, p1)
      if (min_length > seL) {
        return []
      }


      const inCircle = (p, idx) =>
        Math.sqrt((p.x - seC.x) ** 2 + (p.y - seC.y) ** 2) < seL / 2 * (1 - this._meshTolerance)

      const res = this._allPoints.find(inCircle)
      if (res) {
        this._antiCroachPoints.push(seC)
        const placed = []
        placed.push(...splitAndAdd(p0, seC) )
        placed.push(...splitAndAdd(seC, p1) )
        placed.push({seC, seL})
        return placed
        // this._points[]

      }
      return []
    }

    // Todo: dedupe
    // function onlyUnique(value, index, self) { 
    //  return self.indexOf(value) === index;
    //  }
    const eds = this._mesh.flatMap(v => [[v[0], v[1]], [v[1], v[2]], [v[2], v[0]]])

    const getLength = ([idx0, idx1]: number[]) => Tri.distance(this._allPoints[idx0], this._allPoints[idx1])

   const presentEdges = eds.map(([idx0, idx1]) => {
      const p0 = this._allPoints[idx0]
      const p1 = this._allPoints[idx1]
      return {l:Tri.distance(p0,p1), p0, p1, idx0, idx1}
    }).sort( (e1,e2) => e2.l - e1.l ) 



    for (const {p0,p1} of presentEdges) {

      const placed = splitAndAdd(p0, p1)
      if (placed) { // splitting has been done -> remesh
        return placed
      }



      // TODO: optimize search for x / y (having sorted arrays by x/y)
      // look for the square around the circle first
      // and only then do costly multiplication



    }

    return null 


  }


refineMultiple(steps = 20) {
  // TODO: 
  // split encroached segments

  const handledEdges: Map<number, number> = new Map()

  function pushHandledEdge(idx1, idx2) {
    idx1 < idx2 ? handledEdges.set(idx1, idx2) : handledEdges.set(idx2, idx1)
  }

  function isEdgeHandled(idx1, idx2) {
    if (idx1 < idx2) {
      return handledEdges.get(idx1) == idx2
    } else {
      return handledEdges.get(idx2) == idx1
    }
  }

  let cnt = 0;
  for (const f of this._mesh) {
    cnt++
    if (cnt > steps)
      return
    //@ts-ignore
    const tri = Tri.ofArray(...f, this._points)

    const segmentCenters = tri.segmentCenters()
    const segmentLengths = tri.segmentLengths()




    for (let i = 0; i < segmentCenters.length; i++) {
      // TODO: for more than one refinement: Track all points
      // TODO: optimize search for x / y (having sorted arrays by x/y)
      // look for the square around the circle first
      // and only then do costly multiplication
      if (isEdgeHandled(f[i], f[(i + 1) % 3]))
        continue

      const seC = segmentCenters[i], seL = segmentLengths[i]


      const inCircle = (p, idx) =>
        !f.includes(idx) && // Ignore own points 
        Math.sqrt((p.x - seC.x) ** 2 + (p.y - seC.y) ** 2) < seL * (1 - this._meshTolerance)

      const res = this._points.find(inCircle)
      if (res) {
        this._antiCroachPoints.push(seC)
        // this._points[]

      }

      pushHandledEdge(f[i], f[(i + 1) % 3])


    }

  }

  // remap constrained segments

  // insert steiner points

}


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
