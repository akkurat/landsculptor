
export type P = {
    x: number
    y: number
}

export type A3 = [number, number, number]
export type A2 = [number, number]

export function vSub(b: P, a: P): P {
    return { x: b.x - a.x, y: b.y - a.y }
}
export function vAdd(b: P, a: P): P {
    return { x: b.x + a.x, y: b.y + a.y }
}
export function vMean(b: P, a: P): P {
    return { x: 0.5 * (b.x + a.x), y: 0.5 * (b.y + a.y) }
}
export function distance(a: P, b: P): number {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2)
}
export function scale(v: P, s: number) {
    return { x: v.x * s, y: v.y * s }
}