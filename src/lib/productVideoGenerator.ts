/**
 * VERSION 20.0 — Cinematic Product Video Generator
 * Generates a premium 6-second product showcase video using Canvas + MediaRecorder.
 * Features: slow rotation, gentle zoom, smooth pan, 360° light sweep, 
 * cinematic letterboxing, film grain, vignette, crossfade transitions.
 * Output: WebM, 1280×720, 30fps
 */

const VIDEO_WIDTH = 1280;
const VIDEO_HEIGHT = 720;
const FPS = 30;
const DURATION_SECONDS = 6;
const TOTAL_FRAMES = DURATION_SECONDS * FPS; // 180 frames

interface GenerateVideoOptions {
  imageUrls: string[];
  onProgress?: (progress: number) => void;
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });
}

/** Smooth ease-in-out curve */
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/** Smooth ease-out for gentle deceleration */
function easeOutQuad(t: number): number {
  return 1 - (1 - t) * (1 - t);
}

/** Sinusoidal oscillation for gentle back-and-forth motion */
function sinEase(t: number, frequency: number = 1): number {
  return Math.sin(t * Math.PI * 2 * frequency);
}

/** Draw image with cover-fit, applying scale, rotation, and offset */
function drawImageCinematic(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  cx: number,
  cy: number,
  canvasW: number,
  canvasH: number,
  scale: number,
  rotation: number,
  offsetX: number,
  offsetY: number
) {
  const imgRatio = img.width / img.height;
  const canvasRatio = canvasW / canvasH;

  let drawW: number, drawH: number;
  if (imgRatio > canvasRatio) {
    drawH = canvasH * scale;
    drawW = drawH * imgRatio;
  } else {
    drawW = canvasW * scale;
    drawH = drawW / imgRatio;
  }

  ctx.save();
  ctx.translate(cx + offsetX, cy + offsetY);
  ctx.rotate(rotation);
  ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
  ctx.restore();
}

/** Cinematic vignette overlay */
function drawVignette(ctx: CanvasRenderingContext2D, w: number, h: number, intensity: number = 0.4) {
  const gradient = ctx.createRadialGradient(
    w / 2, h / 2, w * 0.25,
    w / 2, h / 2, w * 0.75
  );
  gradient.addColorStop(0, "rgba(0,0,0,0)");
  gradient.addColorStop(0.6, `rgba(0,0,0,${intensity * 0.3})`);
  gradient.addColorStop(1, `rgba(0,0,0,${intensity})`);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);
}

/** 360° light sweep effect — a soft bright highlight rotating around */
function drawLightSweep(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  angle: number,
  intensity: number = 0.12
) {
  const cx = w / 2 + Math.cos(angle) * w * 0.3;
  const cy = h / 2 + Math.sin(angle) * h * 0.25;
  const radius = w * 0.45;

  const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
  gradient.addColorStop(0, `rgba(255,250,240,${intensity})`);
  gradient.addColorStop(0.4, `rgba(255,245,230,${intensity * 0.5})`);
  gradient.addColorStop(1, "rgba(255,255,255,0)");

  ctx.globalCompositeOperation = "screen";
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);
  ctx.globalCompositeOperation = "source-over";
}

/** Subtle film grain overlay */
function drawFilmGrain(ctx: CanvasRenderingContext2D, w: number, h: number, intensity: number = 0.03) {
  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;
  // Apply grain to every 4th pixel for performance
  for (let i = 0; i < data.length; i += 16) {
    const noise = (Math.random() - 0.5) * 255 * intensity;
    data[i] = Math.min(255, Math.max(0, data[i] + noise));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
  }
  ctx.putImageData(imageData, 0, 0);
}

/** Cinematic letterbox bars */
function drawLetterbox(ctx: CanvasRenderingContext2D, w: number, h: number, barHeight: number = 36) {
  ctx.fillStyle = "rgba(0,0,0,0.85)";
  ctx.fillRect(0, 0, w, barHeight);
  ctx.fillRect(0, h - barHeight, w, barHeight);
}

/** Camera motion presets for each image segment */
interface CameraMotion {
  startScale: number;
  endScale: number;
  rotationSpeed: number; // radians per second
  panXAmplitude: number;
  panYAmplitude: number;
  panFrequency: number;
}

function getCameraMotion(index: number, total: number): CameraMotion {
  const presets: CameraMotion[] = [
    // Slow zoom in + gentle clockwise rotation
    { startScale: 1.05, endScale: 1.18, rotationSpeed: 0.008, panXAmplitude: 15, panYAmplitude: 10, panFrequency: 0.3 },
    // Zoom out + counter-clockwise + horizontal drift
    { startScale: 1.2, endScale: 1.08, rotationSpeed: -0.006, panXAmplitude: 25, panYAmplitude: 8, panFrequency: 0.4 },
    // Subtle zoom + strong horizontal pan
    { startScale: 1.1, endScale: 1.15, rotationSpeed: 0.004, panXAmplitude: 30, panYAmplitude: 5, panFrequency: 0.5 },
    // Dramatic zoom in + no rotation + vertical drift
    { startScale: 1.0, endScale: 1.25, rotationSpeed: 0.0, panXAmplitude: 5, panYAmplitude: 20, panFrequency: 0.35 },
    // Gentle pullback + slight tilt
    { startScale: 1.22, endScale: 1.05, rotationSpeed: -0.005, panXAmplitude: 18, panYAmplitude: 12, panFrequency: 0.25 },
  ];
  return presets[index % presets.length];
}

export async function generateProductVideo({
  imageUrls,
  onProgress,
}: GenerateVideoOptions): Promise<Blob> {
  if (imageUrls.length === 0) {
    throw new Error("No images provided");
  }

  // Load all images
  onProgress?.(2);
  const images = await Promise.all(imageUrls.map(loadImage));
  onProgress?.(10);

  const canvas = document.createElement("canvas");
  canvas.width = VIDEO_WIDTH;
  canvas.height = VIDEO_HEIGHT;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;

  // Timing: split 6 seconds among images with crossfade transitions
  const numImages = images.length;
  const transitionFrames = Math.min(20, Math.floor(TOTAL_FRAMES / (numImages * 3))); // ~0.67s transitions
  const framesPerImage = Math.floor(TOTAL_FRAMES / numImages);

  // Camera motions for each image
  const motions = images.map((_, i) => getCameraMotion(i, numImages));

  // Set up MediaRecorder
  const stream = canvas.captureStream(FPS);
  const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
    ? "video/webm;codecs=vp9"
    : "video/webm";

  const recorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: 4_000_000, // Higher bitrate for quality
  });

  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  const recordingDone = new Promise<Blob>((resolve) => {
    recorder.onstop = () => {
      resolve(new Blob(chunks, { type: "video/webm" }));
    };
  });

  recorder.start();

  // Render each frame
  for (let frame = 0; frame < TOTAL_FRAMES; frame++) {
    const globalProgress = frame / TOTAL_FRAMES; // 0 to 1
    const currentTime = frame / FPS;

    // Determine current image index and local progress
    const rawIndex = (frame / framesPerImage);
    const imgIndex = Math.min(Math.floor(rawIndex), numImages - 1);
    const localProgress = Math.min(1, (frame - imgIndex * framesPerImage) / framesPerImage);

    // Dark cinematic background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, VIDEO_HEIGHT);
    bgGrad.addColorStop(0, "#0a0a0a");
    bgGrad.addColorStop(0.5, "#111111");
    bgGrad.addColorStop(1, "#0a0a0a");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, VIDEO_WIDTH, VIDEO_HEIGHT);

    // Check if we're in a crossfade zone
    const isInTransition = (frame % framesPerImage) > (framesPerImage - transitionFrames) && imgIndex < numImages - 1;

    if (isInTransition) {
      const transLocal = ((frame % framesPerImage) - (framesPerImage - transitionFrames)) / transitionFrames;
      const easedTrans = easeInOutCubic(Math.max(0, Math.min(1, transLocal)));

      // Draw outgoing image
      const outMotion = motions[imgIndex];
      const outScale = outMotion.startScale + (outMotion.endScale - outMotion.startScale) * 1;
      const outRotation = outMotion.rotationSpeed * currentTime;
      const outPanX = sinEase(1, outMotion.panFrequency) * outMotion.panXAmplitude;
      const outPanY = sinEase(1, outMotion.panFrequency * 0.7) * outMotion.panYAmplitude;

      ctx.globalAlpha = 1 - easedTrans;
      drawImageCinematic(ctx, images[imgIndex], VIDEO_WIDTH / 2, VIDEO_HEIGHT / 2,
        VIDEO_WIDTH, VIDEO_HEIGHT, outScale, outRotation, outPanX, outPanY);

      // Draw incoming image
      const inMotion = motions[imgIndex + 1];
      const inScale = inMotion.startScale;
      ctx.globalAlpha = easedTrans;
      drawImageCinematic(ctx, images[imgIndex + 1], VIDEO_WIDTH / 2, VIDEO_HEIGHT / 2,
        VIDEO_WIDTH, VIDEO_HEIGHT, inScale, 0, 0, 0);

      ctx.globalAlpha = 1;
    } else {
      // Smooth camera motion on current image
      const motion = motions[imgIndex];
      const eased = easeOutQuad(localProgress);

      const scale = motion.startScale + (motion.endScale - motion.startScale) * eased;
      const rotation = motion.rotationSpeed * localProgress * (framesPerImage / FPS);
      const panX = sinEase(localProgress, motion.panFrequency) * motion.panXAmplitude;
      const panY = sinEase(localProgress, motion.panFrequency * 0.7) * motion.panYAmplitude;

      ctx.globalAlpha = 1;
      drawImageCinematic(ctx, images[imgIndex], VIDEO_WIDTH / 2, VIDEO_HEIGHT / 2,
        VIDEO_WIDTH, VIDEO_HEIGHT, scale, rotation, panX, panY);
    }

    // === Post-processing overlays ===

    // 360° light sweep — full rotation over 6 seconds
    const lightAngle = globalProgress * Math.PI * 2;
    drawLightSweep(ctx, VIDEO_WIDTH, VIDEO_HEIGHT, lightAngle, 0.1);

    // Cinematic vignette
    drawVignette(ctx, VIDEO_WIDTH, VIDEO_HEIGHT, 0.35);

    // Film grain (subtle)
    if (frame % 2 === 0) { // every other frame for performance
      drawFilmGrain(ctx, VIDEO_WIDTH, VIDEO_HEIGHT, 0.025);
    }

    // Cinematic letterbox bars
    drawLetterbox(ctx, VIDEO_WIDTH, VIDEO_HEIGHT, 32);

    // Warm color grade overlay
    ctx.globalCompositeOperation = "multiply";
    ctx.fillStyle = "rgba(255, 248, 240, 0.06)";
    ctx.fillRect(0, 0, VIDEO_WIDTH, VIDEO_HEIGHT);
    ctx.globalCompositeOperation = "source-over";

    // Fade in/out at video start and end
    if (frame < 15) {
      ctx.fillStyle = `rgba(0,0,0,${1 - frame / 15})`;
      ctx.fillRect(0, 0, VIDEO_WIDTH, VIDEO_HEIGHT);
    } else if (frame > TOTAL_FRAMES - 15) {
      ctx.fillStyle = `rgba(0,0,0,${(frame - (TOTAL_FRAMES - 15)) / 15})`;
      ctx.fillRect(0, 0, VIDEO_WIDTH, VIDEO_HEIGHT);
    }

    onProgress?.(10 + Math.round((frame / TOTAL_FRAMES) * 88));

    // Frame timing
    await new Promise((r) => setTimeout(r, 1000 / FPS));
  }

  onProgress?.(99);
  recorder.stop();
  const blob = await recordingDone;
  onProgress?.(100);
  return blob;
}
