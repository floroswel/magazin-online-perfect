/**
 * Generates a smooth slideshow video from product images using Canvas + MediaRecorder.
 * Output: WebM blob, 720p, up to 6 seconds with zoom/pan/crossfade transitions.
 */

const VIDEO_WIDTH = 1280;
const VIDEO_HEIGHT = 720;
const FPS = 30;
const MAX_DURATION_SECONDS = 6;

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

function drawImageCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
  scale: number = 1,
  offsetX: number = 0,
  offsetY: number = 0
) {
  const imgRatio = img.width / img.height;
  const canvasRatio = w / h;

  let drawW: number, drawH: number;
  if (imgRatio > canvasRatio) {
    drawH = h * scale;
    drawW = drawH * imgRatio;
  } else {
    drawW = w * scale;
    drawH = drawW / imgRatio;
  }

  const drawX = x + (w - drawW) / 2 + offsetX;
  const drawY = y + (h - drawH) / 2 + offsetY;

  ctx.drawImage(img, drawX, drawY, drawW, drawH);
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export async function generateProductVideo({
  imageUrls,
  onProgress,
}: GenerateVideoOptions): Promise<Blob> {
  if (imageUrls.length === 0) {
    throw new Error("No images provided");
  }

  // Load all images
  const images = await Promise.all(imageUrls.map(loadImage));

  const canvas = document.createElement("canvas");
  canvas.width = VIDEO_WIDTH;
  canvas.height = VIDEO_HEIGHT;
  const ctx = canvas.getContext("2d")!;

  // Calculate timing
  const numImages = images.length;
  const transitionDuration = 0.6; // seconds
  const totalTransitionTime = Math.max(0, (numImages - 1) * transitionDuration);
  const availableTime = MAX_DURATION_SECONDS - totalTransitionTime;
  const timePerImage = Math.max(0.8, availableTime / numImages);
  const totalDuration = numImages * timePerImage + totalTransitionTime;
  const totalFrames = Math.ceil(Math.min(totalDuration, MAX_DURATION_SECONDS) * FPS);

  // Ken Burns effects for each image (zoom/pan direction)
  const effects = images.map((_, i) => ({
    startScale: 1.0 + (i % 2 === 0 ? 0 : 0.15),
    endScale: 1.0 + (i % 2 === 0 ? 0.15 : 0),
    panX: (i % 3 === 0 ? 1 : i % 3 === 1 ? -1 : 0) * 20,
    panY: (i % 2 === 0 ? 1 : -1) * 15,
  }));

  // Set up MediaRecorder
  const stream = canvas.captureStream(FPS);
  
  const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
    ? "video/webm;codecs=vp9"
    : "video/webm";

  const recorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: 2_500_000,
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
  for (let frame = 0; frame < totalFrames; frame++) {
    const currentTime = frame / FPS;

    // Determine which image(s) to show
    const segmentDuration = timePerImage + transitionDuration;
    const segmentIndex = Math.min(
      Math.floor(currentTime / (timePerImage)),
      numImages - 1
    );
    
    // More precise: calculate based on accumulated segments
    let accumulated = 0;
    let imgIndex = 0;
    for (let i = 0; i < numImages; i++) {
      const segEnd = accumulated + timePerImage + (i < numImages - 1 ? transitionDuration : 0);
      if (currentTime < segEnd || i === numImages - 1) {
        imgIndex = i;
        break;
      }
      accumulated += timePerImage;
    }

    const localTime = currentTime - imgIndex * timePerImage;
    const progress = Math.min(1, localTime / timePerImage);

    // Clear canvas with dark background
    ctx.fillStyle = "#111111";
    ctx.fillRect(0, 0, VIDEO_WIDTH, VIDEO_HEIGHT);

    // Check if we're in a transition zone
    const isInTransition = localTime > (timePerImage - transitionDuration) && imgIndex < numImages - 1;

    if (isInTransition) {
      const transProgress = (localTime - (timePerImage - transitionDuration)) / transitionDuration;
      const easedTrans = easeInOutCubic(Math.min(1, Math.max(0, transProgress)));

      // Draw outgoing image
      const outEffect = effects[imgIndex];
      const outProgress = 1;
      const outScale = outEffect.startScale + (outEffect.endScale - outEffect.startScale) * outProgress;
      ctx.globalAlpha = 1 - easedTrans;
      drawImageCover(ctx, images[imgIndex], 0, 0, VIDEO_WIDTH, VIDEO_HEIGHT, outScale, outEffect.panX * outProgress, outEffect.panY * outProgress);

      // Draw incoming image
      const inEffect = effects[imgIndex + 1];
      const inScale = inEffect.startScale;
      ctx.globalAlpha = easedTrans;
      drawImageCover(ctx, images[imgIndex + 1], 0, 0, VIDEO_WIDTH, VIDEO_HEIGHT, inScale, 0, 0);

      ctx.globalAlpha = 1;
    } else {
      // Draw current image with Ken Burns
      const effect = effects[imgIndex];
      const p = Math.min(1, progress);
      const scale = effect.startScale + (effect.endScale - effect.startScale) * p;
      const panX = effect.panX * p;
      const panY = effect.panY * p;

      ctx.globalAlpha = 1;
      drawImageCover(ctx, images[imgIndex], 0, 0, VIDEO_WIDTH, VIDEO_HEIGHT, scale, panX, panY);
    }

    // Slight vignette effect
    const gradient = ctx.createRadialGradient(
      VIDEO_WIDTH / 2, VIDEO_HEIGHT / 2, VIDEO_WIDTH * 0.3,
      VIDEO_WIDTH / 2, VIDEO_HEIGHT / 2, VIDEO_WIDTH * 0.7
    );
    gradient.addColorStop(0, "rgba(0,0,0,0)");
    gradient.addColorStop(1, "rgba(0,0,0,0.25)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, VIDEO_WIDTH, VIDEO_HEIGHT);

    onProgress?.(Math.round((frame / totalFrames) * 100));

    // Wait for next frame timing
    await new Promise((r) => setTimeout(r, 1000 / FPS));
  }

  recorder.stop();
  return recordingDone;
}
