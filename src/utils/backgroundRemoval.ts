import { FilesetResolver, ImageSegmenter } from '@mediapipe/tasks-vision';

export type BackgroundRemovalEngine = 'ai-local' | 'smart-local';

export interface BackgroundRemovalResult {
  /** Soft alpha mask Float32Array (0 = background, 1 = foreground) matching source image dimensions */
  alphaMask: Float32Array;
  width: number;
  height: number;
  engine: BackgroundRemovalEngine;
}

let segmenterPromise: Promise<ImageSegmenter | null> | null = null;
let activeMediaPipeOps = 0;
let originalConsoleError: typeof console.error | null = null;

const MEDIAPIPE_WASM_URL =
  'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.34/wasm';
const SELFIE_SEGMENTER_MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite';

function isHarmlessTfliteInfoLog(args: unknown[]): boolean {
  const text = args.map((a) => (typeof a === 'string' ? a : '')).join(' ');
  return (
    text.includes('Created TensorFlow Lite XNNPACK delegate for CPU') ||
    /^\s*INFO:\s+Created TensorFlow Lite/i.test(text)
  );
}

async function withSuppressedTfliteInfoLogs<T>(fn: () => Promise<T>): Promise<T> {
  if (activeMediaPipeOps === 0) {
    originalConsoleError = console.error;
    const orig = originalConsoleError;
    console.error = (...args: unknown[]) => {
      if (isHarmlessTfliteInfoLog(args)) {
        console.info(...args);
        return;
      }
      orig.apply(console, args);
    };
  }
  activeMediaPipeOps++;
  try {
    return await fn();
  } finally {
    activeMediaPipeOps--;
    if (activeMediaPipeOps === 0 && originalConsoleError) {
      console.error = originalConsoleError;
      originalConsoleError = null;
    }
  }
}

async function getLocalSegmenter(): Promise<ImageSegmenter | null> {
  if (!segmenterPromise) {
    segmenterPromise = (async () => {
      try {
        const timeoutPromise = new Promise<null>((resolve) =>
          setTimeout(() => resolve(null), 6500)
        );

        const loaderPromise = withSuppressedTfliteInfoLogs(async () => {
          const vision = await FilesetResolver.forVisionTasks(MEDIAPIPE_WASM_URL);
          const segmenter = await ImageSegmenter.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: SELFIE_SEGMENTER_MODEL_URL,
              delegate: 'CPU'
            },
            runningMode: 'IMAGE',
            outputCategoryMask: false,
            outputConfidenceMasks: true
          });
          return segmenter;
        });

        return await Promise.race([loaderPromise, timeoutPromise]);
      } catch (err) {
        console.warn('MediaPipe local segmenter unavailable, using local edge-aware segmentation:', err);
        return null;
      }
    })();
  }
  return segmenterPromise;
}

/**
 * Pure TypeScript local portrait background segmentation fallback.
 * Runs 100% locally in-browser in <150ms without external network calls.
 * Uses border color clustering + Sobel edge barrier + Dijkstra-like cost flood from edges + skin/head center protection.
 */
function computeSmartLocalAlphaMask(
  imageData: ImageData,
  sensitivity: number
): Float32Array {
  const { width, height, data } = imageData;
  const total = width * height;
  const mask = new Float32Array(total);
  mask.fill(1.0);

  // 1. Sample top, left, and right border pixels to estimate studio/wall background colors
  const samples: Array<[number, number, number]> = [];
  const stepX = Math.max(1, Math.floor(width / 40));
  const stepY = Math.max(1, Math.floor(height / 40));

  for (let x = 0; x < width; x += stepX) {
    for (let y = 0; y < Math.min(6, height); y++) {
      const idx = (y * width + x) * 4;
      samples.push([data[idx], data[idx + 1], data[idx + 2]]);
    }
  }
  for (let y = 0; y < Math.floor(height * 0.78); y += stepY) {
    for (let x = 0; x < Math.min(5, width); x++) {
      const idx = (y * width + x) * 4;
      samples.push([data[idx], data[idx + 1], data[idx + 2]]);
    }
    for (let x = Math.max(0, width - 5); x < width; x++) {
      const idx = (y * width + x) * 4;
      samples.push([data[idx], data[idx + 1], data[idx + 2]]);
    }
  }

  // Compute mean & spread, plus keep compact representative sample list (max 48)
  const stride = Math.max(1, Math.floor(samples.length / 48));
  const palette: Array<[number, number, number]> = [];
  for (let i = 0; i < samples.length; i += stride) {
    palette.push(samples[i]);
  }

  // 2. Compute grayscale & Sobel edge magnitude for barrier detection
  const gray = new Float32Array(total);
  for (let i = 0; i < total; i++) {
    const p = i * 4;
    gray[i] = 0.299 * data[p] + 0.587 * data[p + 1] + 0.114 * data[p + 2];
  }

  const edge = new Float32Array(total);
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      const gx =
        -gray[idx - width - 1] +
        gray[idx - width + 1] -
        2 * gray[idx - 1] +
        2 * gray[idx + 1] -
        gray[idx + width - 1] +
        gray[idx + width + 1];
      const gy =
        -gray[idx - width - 1] -
        2 * gray[idx - width] -
        gray[idx - width + 1] +
        gray[idx + width - 1] +
        2 * gray[idx + width] +
        gray[idx + width + 1];
      edge[idx] = Math.min(255, Math.sqrt(gx * gx + gy * gy) * 0.25);
    }
  }

  // Sensitivity scales color tolerance (default sensitivity ~0.5 -> threshold ~46)
  const baseThreshold = 26 + sensitivity * 52;
  const thresholdSq = baseThreshold * baseThreshold;

  const minColorDistSq = (r: number, g: number, b: number): number => {
    let minD = Infinity;
    for (let k = 0; k < palette.length; k++) {
      const pr = palette[k][0];
      const pg = palette[k][1];
      const pb = palette[k][2];
      const dr = r - pr;
      const dg = g - pg;
      const db = b - pb;
      const d = dr * dr + dg * dg + db * db;
      if (d < minD) minD = d;
    }
    return minD;
  };

  // Protect central face core ellipse so skin/light clothing in center isn't accidentally flooded
  const isProtectedCenter = (x: number, y: number): boolean => {
    const nx = (x / width - 0.5) / 0.19;
    const ny = (y / height - 0.44) / 0.25;
    return nx * nx + ny * ny <= 1.0;
  };

  // 3. Multi-seed BFS from top, left, and right borders
  const visited = new Uint8Array(total);
  const bgProb = new Float32Array(total);
  const queue = new Int32Array(total);
  let head = 0;
  let tail = 0;

  const trySeed = (x: number, y: number) => {
    const idx = y * width + x;
    if (visited[idx]) return;
    visited[idx] = 1;
    bgProb[idx] = 1.0;
    queue[tail++] = idx;
  };

  for (let x = 0; x < width; x++) {
    trySeed(x, 0);
  }
  for (let y = 0; y < Math.floor(height * 0.9); y++) {
    trySeed(0, y);
    trySeed(width - 1, y);
  }

  const dirs = [-1, 1, -width, width];
  while (head < tail) {
    const curr = queue[head++];
    const cx = curr % width;
    const cy = (curr - cx) / width;
    const cp = curr * 4;
    const cr = data[cp];
    const cg = data[cp + 1];
    const cb = data[cp + 2];

    for (let d = 0; d < 4; d++) {
      const nIdx = curr + dirs[d];
      if (nIdx < 0 || nIdx >= total) continue;
      const nx = nIdx % width;
      const ny = (nIdx - nx) / width;
      if (Math.abs(nx - cx) + Math.abs(ny - cy) !== 1) continue;
      if (visited[nIdx]) continue;
      if (isProtectedCenter(nx, ny)) continue;

      const np = nIdx * 4;
      const nr = data[np];
      const ng = data[np + 1];
      const nb = data[np + 2];

      const localDiff =
        (nr - cr) * (nr - cr) + (ng - cg) * (ng - cg) + (nb - cb) * (nb - cb);
      const paletteDist = minColorDistSq(nr, ng, nb);
      const edgePenalty = edge[nIdx] * edge[nIdx] * 1.4;

      // Allow step if color matches border palette or is smoothly continuous without a strong edge
      if (
        paletteDist + edgePenalty <= thresholdSq * 3.0 ||
        (localDiff <= thresholdSq * 0.55 && paletteDist <= thresholdSq * 5.2 && edge[nIdx] < 32)
      ) {
        visited[nIdx] = 1;
        const strength = Math.max(0, 1 - (paletteDist / (thresholdSq * 5.5)) * 0.4);
        bgProb[nIdx] = Math.max(0.75, strength);
        queue[tail++] = nIdx;
      }
    }
  }

  for (let i = 0; i < total; i++) {
    mask[i] = Math.max(0, Math.min(1, 1 - bgProb[i]));
  }

  return mask;
}

/**
 * Smooths alpha mask boundaries (3x3 box feather) to eliminate jagged pixel edges.
 */
function featherAlphaMask(
  mask: Float32Array,
  width: number,
  height: number,
  passes: number
): Float32Array<ArrayBuffer> {
  let src: Float32Array = mask;
  let dst: Float32Array = new Float32Array(mask.length);

  for (let p = 0; p < passes; p++) {
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let sum = 0;
        let count = 0;
        for (let dy = -1; dy <= 1; dy++) {
          const ny = y + dy;
          if (ny < 0 || ny >= height) continue;
          for (let dx = -1; dx <= 1; dx++) {
            const nx = x + dx;
            if (nx < 0 || nx >= width) continue;
            sum += src[ny * width + nx];
            count++;
          }
        }
        dst[y * width + x] = sum / count;
      }
    }
    const tmp = src;
    src = dst;
    dst = tmp;
  }

  const result = new Float32Array(src.length);
  result.set(src);
  return result;
}

/**
 * Computes a local foreground alpha mask for a portrait image.
 * Always processes 100% locally in-browser and never uploads or persists user photos.
 */
export async function computePortraitAlphaMask(
  img: HTMLImageElement,
  options?: { sensitivity?: number; featherPasses?: number }
): Promise<BackgroundRemovalResult> {
  const sensitivity = options?.sensitivity ?? 0.52;
  const featherPasses = options?.featherPasses ?? 2;

  // Work at balanced max resolution (up to 768px on longest edge) for crisp, fast local processing
  const maxDim = 768;
  const scale = Math.min(1, maxDim / Math.max(img.naturalWidth || img.width, img.naturalHeight || img.height));
  const workW = Math.max(64, Math.round((img.naturalWidth || img.width) * scale));
  const workH = Math.max(64, Math.round((img.naturalHeight || img.height) * scale));

  const workCanvas = document.createElement('canvas');
  workCanvas.width = workW;
  workCanvas.height = workH;
  const ctx = workCanvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    throw new Error('ब्राउज़र कैनवास आरंभ नहीं हो सका।');
  }

  ctx.drawImage(img, 0, 0, workW, workH);

  // Try MediaPipe Selfie Segmenter first (runs in local WASM)
  const segmenter = await getLocalSegmenter();
  if (segmenter) {
    try {
      const segResult = await withSuppressedTfliteInfoLogs(async () =>
        segmenter.segment(workCanvas)
      );
      const confidenceMasks = segResult.confidenceMasks;
      if (confidenceMasks && confidenceMasks.length > 0) {
        const rawFloat = confidenceMasks[0].getAsFloat32Array();
        // MediaPipe SelfieSegmenter confidence mask: higher value = person (category 1 or foreground)
        // Adjust contrast smoothly based on user sensitivity
        const maskCopy = new Float32Array(workW * workH);
        const cutoffShift = (sensitivity - 0.5) * 0.25;
        for (let i = 0; i < maskCopy.length; i++) {
          const val = rawFloat[i] + cutoffShift;
          // Crisp yet smooth S-curve around 0.45 threshold
          const normalized = (val - 0.32) / (0.68 - 0.32);
          maskCopy[i] = Math.max(0, Math.min(1, normalized));
        }
        segResult.close();

        const feathered = featherAlphaMask(maskCopy, workW, workH, Math.max(1, featherPasses));
        return {
          alphaMask: feathered,
          width: workW,
          height: workH,
          engine: 'ai-local'
        };
      }
      segResult.close();
    } catch (err) {
      console.warn('MediaPipe segmentation runtime fallback triggered:', err);
    }
  }

  // Pure local Canvas fallback
  const imageData = ctx.getImageData(0, 0, workW, workH);
  const rawMask = computeSmartLocalAlphaMask(imageData, sensitivity);
  const feathered = featherAlphaMask(rawMask, workW, workH, Math.max(1, featherPasses));

  return {
    alphaMask: feathered,
    width: workW,
    height: workH,
    engine: 'smart-local'
  };
}

/**
 * Produces a transparent cutout HTMLCanvasElement at the original image resolution
 * (bounded safely at 2048px for mobile memory safety).
 */
export function buildTransparentCutoutCanvas(
  img: HTMLImageElement,
  maskResult: BackgroundRemovalResult
): HTMLCanvasElement {
  const srcW = img.naturalWidth || img.width;
  const srcH = img.naturalHeight || img.height;
  const maxOut = 1800;
  const scale = Math.min(1, maxOut / Math.max(srcW, srcH));
  const outW = Math.max(1, Math.round(srcW * scale));
  const outH = Math.max(1, Math.round(srcH * scale));

  // Create mask canvas at mask resolution, then smoothly upscale alpha channel
  const maskCanvas = document.createElement('canvas');
  maskCanvas.width = maskResult.width;
  maskCanvas.height = maskResult.height;
  const mCtx = maskCanvas.getContext('2d');
  if (!mCtx) return maskCanvas;

  const maskImgData = mCtx.createImageData(maskResult.width, maskResult.height);
  for (let i = 0; i < maskResult.alphaMask.length; i++) {
    const a = Math.round(maskResult.alphaMask[i] * 255);
    const p = i * 4;
    maskImgData.data[p] = 255;
    maskImgData.data[p + 1] = 255;
    maskImgData.data[p + 2] = 255;
    maskImgData.data[p + 3] = a;
  }
  mCtx.putImageData(maskImgData, 0, 0);

  // Composite original image with alpha mask using destination-in
  const outCanvas = document.createElement('canvas');
  outCanvas.width = outW;
  outCanvas.height = outH;
  const oCtx = outCanvas.getContext('2d');
  if (!oCtx) return outCanvas;

  oCtx.imageSmoothingEnabled = true;
  oCtx.imageSmoothingQuality = 'high';
  oCtx.drawImage(img, 0, 0, outW, outH);
  oCtx.globalCompositeOperation = 'destination-in';
  oCtx.drawImage(maskCanvas, 0, 0, outW, outH);
  oCtx.globalCompositeOperation = 'source-over';

  return outCanvas;
}
