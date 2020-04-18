
export function createRange(start: number, end: number, steps: number, inclusive=false) {
  const dsteps = inclusive ? steps - 1 : steps 
  const delta = (end - start) / dsteps
  const out = Array(steps)

  for( let i = 0; i< out.length; i++) {
   out[i] =  start + i * delta
  }
  return out;
}

export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

