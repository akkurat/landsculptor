declare module 'rbf' {
type ScalarOrVector = number[] | number
export default function RBF<T extends ScalarOrVector>(
    points: number[][], values: T[], 
    distanceFunction?: ((r: number) => number) | 'linear' | 'cubic' | 'quintic' | 'thin-plate' | 'gaussian' | 'inverse-multiquadric' | 'multiquadric', 
    epsilon?: number): (v: number[]) => T 
}