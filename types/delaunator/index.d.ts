declare module 'delaunator' {
    export default class Delaunator {

        static from<T>(points: T[][], getX: (p: T) => number, getY:(p: T) => number): Delaunator
        static from(points: number[][]): Delaunator
        constructor(coords: number[][])
        update(): void
        _hashKey(x: number, y: number): number

        _legalize(a: number): number

        _link(a: number, b: number): void

        /**  add a new triangle given vertex indices and adjacent half-edge ids
         * 
         */
        _addTriangle(i0: number, i1: number, i2: number, a: number, b: number, c: number): number
    }

    /**  monotonically increases with real angle, but doesn't need expensive trigonometry
     */
    function pseudoAngle(dx: number, dy: number): number

    function dist(ax: number, ay: number, bx: number, by: number): number

    // return 2d orientation sign if we're confident in it through J. Shewchuk's error bound check
    function orientIfSure(px: number, py: number, rx: number, ry: number, qx: number, qy: number): number

    // a more robust orientation test that's stable in a given triangle (to fix robustness issues)
    function orient(rx: number, ry: number, qx: number, qy: number, px: number, py: number): number

    function inCircle(ax: number, ay: number, bx: number, by: number, cx: number, cy: number, px: number, py: number): boolean

    function circumradius(ax: number, ay: number, bx: number, by: number, cx: number, cy: number): number

    function circumcenter(ax: number, ay: number, bx: number, by: number, cx: number, cy: number): { x: number, y: number }

    function quicksort(ids: Uint32Array, dists: BigUint64Array, left: number, right: number) 

    function swap(arr: any[], i: number, j: number): void

    function defaultGetX<T>(p: T[]): T
    function defaultGetY<T>(p: T[]): T

}