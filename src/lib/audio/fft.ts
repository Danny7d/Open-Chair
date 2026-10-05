/** In-place radix-2 Cooley–Tukey FFT. `n` must be a power of two. */
export function fft(
  re: Float32Array,
  im: Float32Array,
  invert: boolean,
): void {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      const tr = re[i];
      re[i] = re[j]!;
      re[j] = tr!;
      const ti = im[i];
      im[i] = im[j]!;
      im[j] = ti!;
    }
  }

  for (let len = 2; len <= n; len <<= 1) {
    const ang = ((invert ? 2 : -2) * Math.PI) / len;
    const wlenRe = Math.cos(ang);
    const wlenIm = Math.sin(ang);
    const half = len >> 1;
    for (let i = 0; i < n; i += len) {
      let wRe = 1;
      let wIm = 0;
      for (let j = 0; j < half; j++) {
        const i0 = i + j;
        const i1 = i0 + half;
        const ur = re[i0]!;
        const ui = im[i0]!;
        const vr = re[i1]! * wRe - im[i1]! * wIm;
        const vi = re[i1]! * wIm + im[i1]! * wRe;
        re[i0] = ur + vr;
        im[i0] = ui + vi;
        re[i1] = ur - vr;
        im[i1] = ui - vi;
        const nRe = wRe * wlenRe - wIm * wlenIm;
        wIm = wRe * wlenIm + wIm * wlenRe;
        wRe = nRe;
      }
    }
  }

  if (invert) {
    const inv = 1 / n;
    for (let i = 0; i < n; i++) {
      re[i]! *= inv;
      im[i]! *= inv;
    }
  }
}

export function hann(n: number): Float32Array {
  const w = new Float32Array(n);
  if (n < 2) return w;
  for (let i = 0; i < n; i++) {
    w[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (n - 1)));
  }
  return w;
}

export function nextPow2(n: number): number {
  let p = 1;
  while (p < n) p <<= 1;
  return p;
}
