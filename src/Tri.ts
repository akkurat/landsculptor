import { P } from './Geom';
import * as RhG from './Geom'
export class Tri {
  l_ab: number;
  l_bc: number;
  l_ca: number;
  constructor(public a: P, public b: P, public c: P) {
    this.l_ab = RhG.distance(a, b);
    this.l_bc = RhG.distance(b, c);
    this.l_ca = RhG.distance(c, a);
  }
  segmentCenters = () => [
    RhG.vMean(this.a, this.b),
    RhG.vMean(this.b, this.c),
    RhG.vMean(this.c, this.a),
  ];
  segmentLengths = () => [this.l_ab, this.l_bc, this.l_ca];
  maxLength() {
    return Math.max(this.l_ab, this.l_bc, this.l_ca);
  }
  minLength() {
    return Math.min(this.l_ab, this.l_bc, this.l_ca);
  }
  perimeter() {
    return this.l_ab + this.l_bc + this.l_ca;
  }
  minAngle() {
    const sides = [this.l_ab, this.l_bc, this.l_ca].sort((a, b) => a - b);
    const [min, middle, max] = sides;
    const cosalpha = (max ** 2 + middle ** 2 - min ** 2) / (2 * max * middle);
    return Math.acos(cosalpha);
  }
  circumference() {
    // https://en.wikipedia.org/wiki/Circumscribed_circle#Circumcenter_coordinates
    const a = RhG.vSub(this.a, this.a); // should be zero
    const b = RhG.vSub(this.b, this.a);
    const c = RhG.vSub(this.c, this.a);
    const D = 2 * (b.x * c.y - b.y * c.x);
    const bb = b.x ** 2 + b.y ** 2;
    const cc = c.x ** 2 + c.y ** 2;
    const x = 1 / D * (bb * c.y - cc * b.y);
    const y = 1 / D * (cc * b.x - bb * c.x);
    const out = RhG.vAdd(this.a, { x, y });
    return { r: Math.sqrt(x ** 2 + y ** 2), center: out };
  }
  /**
   *
   * @param _a index
   * @param _b inex
   * @param _c index
   * @param points
   * @param x
   * @param y
   *
   */
  static ofArray_<T extends P>([a, b, c]: number[], points: T[], factory:( (p: P) => T) ) {
    return Tri.ofArray(a, b, c, points, factory);
  }
  static ofArray<T extends P>(_a: number, _b: number, _c: number, points: T[], factory?: (p: P) => T ) {
    const tripoints = [_a, _b, _c].map(eP);
    //@ts-ignore this is perfectly valid
    return new Tri(...tripoints);
    function eP(idx) {
      const p = points[idx];
      if(typeof factory === 'function') {
        return factory(p)
      }
      return p
    }
  }
}
