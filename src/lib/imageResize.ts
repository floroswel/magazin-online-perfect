/**
 * Client-side image resize & WebP conversion utility.
 * Uses browser Canvas API — no server needed.
 */

interface ResizeResult {
  blob: Blob;
  width: number;
  height: number;
  originalSize: number;
  compressedSize: number;
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

function resizeToCanvas(
  img: HTMLImageElement,
  maxW: number,
  maxH: number,
  mode: "contain" | "cover" = "contain"
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  let { naturalWidth: w, naturalHeight: h } = img;

  if (mode === "cover") {
    // Center crop to fill maxW x maxH
    const srcRatio = w / h;
    const dstRatio = maxW / maxH;
    let sx = 0, sy = 0, sw = w, sh = h;
    if (srcRatio > dstRatio) {
      sw = h * dstRatio;
      sx = (w - sw) / 2;
    } else {
      sh = w / dstRatio;
      sy = (h - sh) / 2;
    }
    canvas.width = maxW;
    canvas.height = maxH;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, maxW, maxH);
  } else {
    // Contain: fit within maxW x maxH
    if (w > maxW || h > maxH) {
      const ratio = Math.min(maxW / w, maxH / h);
      w = Math.round(w * ratio);
      h = Math.round(h * ratio);
    }
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0, w, h);
  }

  return canvas;
}

async function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  // Try WebP first, fall back to JPEG
  const supportsWebP = canvas.toDataURL("image/webp").startsWith("data:image/webp");
  const mimeType = supportsWebP ? "image/webp" : "image/jpeg";

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Canvas toBlob failed"))),
      mimeType,
      quality
    );
  });
}

export async function resizeImage(
  file: File,
  maxWidth: number,
  maxHeight: number,
  quality = 0.85,
  mode: "contain" | "cover" = "contain"
): Promise<ResizeResult> {
  const img = await loadImage(file);
  const canvas = resizeToCanvas(img, maxWidth, maxHeight, mode);
  const blob = await canvasToBlob(canvas, quality);
  URL.revokeObjectURL(img.src);

  return {
    blob,
    width: canvas.width,
    height: canvas.height,
    originalSize: file.size,
    compressedSize: blob.size,
  };
}

export interface ProcessedImage {
  main: ResizeResult;
  thumb: ResizeResult;
  og: ResizeResult;
}

/**
 * Process a product image: generate main (1200x1200), thumbnail (400x400), OG (1200x630)
 */
export async function processProductImage(file: File): Promise<ProcessedImage> {
  const img = await loadImage(file);

  const mainCanvas = resizeToCanvas(img, 1200, 1200, "contain");
  const mainBlob = await canvasToBlob(mainCanvas, 0.85);

  const thumbCanvas = resizeToCanvas(img, 400, 400, "contain");
  const thumbBlob = await canvasToBlob(thumbCanvas, 0.80);

  const ogCanvas = resizeToCanvas(img, 1200, 630, "cover");
  const ogBlob = await canvasToBlob(ogCanvas, 0.85);

  URL.revokeObjectURL(img.src);

  return {
    main: { blob: mainBlob, width: mainCanvas.width, height: mainCanvas.height, originalSize: file.size, compressedSize: mainBlob.size },
    thumb: { blob: thumbBlob, width: thumbCanvas.width, height: thumbCanvas.height, originalSize: file.size, compressedSize: thumbBlob.size },
    og: { blob: ogBlob, width: ogCanvas.width, height: ogCanvas.height, originalSize: file.size, compressedSize: ogBlob.size },
  };
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}
