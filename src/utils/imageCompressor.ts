/**
 * Client-side high performance image compressor.
 *
 * Automatically scales down large camera photos (e.g. 10MB 4000x3000px)
 * to e-commerce optimal dimensions (max 1600x1600px) and converts to WebP/JPEG
 * at 82% quality. Typically slashes file size by 85-95% while retaining
 * pristine visual crispness on retina and mobile displays.
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0 to 1
  mimeType?: 'image/webp' | 'image/jpeg';
}

const DEFAULT_OPTIONS: CompressionOptions = {
  maxWidth: 1600,
  maxHeight: 1600,
  quality: 0.82,
  mimeType: 'image/webp',
};

/**
 * Compresses an image File. Non-image files (videos, gifs, svgs) are returned untouched.
 */
export async function compressImage(
  file: File,
  options?: CompressionOptions
): Promise<{ file: File; originalSize: number; compressedSize: number; savedPercent: number }> {
  const originalSize = file.size;

  // Only compress raster photos (jpeg, png, webp, heic, etc.)
  if (!file.type.startsWith('image/') || file.type === 'image/svg+xml' || file.type === 'image/gif') {
    return {
      file,
      originalSize,
      compressedSize: originalSize,
      savedPercent: 0,
    };
  }

  const opts = { ...DEFAULT_OPTIONS, ...options };

  try {
    const bitmap = await loadImageBitmapOrElement(file);
    const { width: origW, height: origH } = bitmap;

    // Calculate scaled dimensions
    let targetW = origW;
    let targetH = origH;
    const maxW = opts.maxWidth || 1600;
    const maxH = opts.maxHeight || 1600;

    if (targetW > maxW || targetH > maxH) {
      const ratio = Math.min(maxW / targetW, maxH / targetH);
      targetW = Math.round(targetW * ratio);
      targetH = Math.round(targetH * ratio);
    }

    // Create offscreen canvas
    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) {
      throw new Error('Canvas 2D context unavailable');
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Draw image onto canvas
    if ('close' in bitmap) {
      ctx.drawImage(bitmap, 0, 0, targetW, targetH);
      bitmap.close();
    } else {
      ctx.drawImage(bitmap, 0, 0, targetW, targetH);
    }

    // Convert to Blob
    const targetMime = opts.mimeType || 'image/webp';
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), targetMime, opts.quality);
    });

    if (!blob) {
      return { file, originalSize, compressedSize: originalSize, savedPercent: 0 };
    }

    // Only keep compressed file if it actually reduced the file size
    if (blob.size < originalSize) {
      const extension = targetMime === 'image/webp' ? '.webp' : '.jpg';
      const cleanName = file.name.replace(/\.[^/.]+$/, '') + extension;
      const compressedFile = new File([blob], cleanName, {
        type: targetMime,
        lastModified: Date.now(),
      });

      const savedPercent = Math.round(((originalSize - blob.size) / originalSize) * 100);
      return {
        file: compressedFile,
        originalSize,
        compressedSize: blob.size,
        savedPercent,
      };
    }

    return { file, originalSize, compressedSize: originalSize, savedPercent: 0 };
  } catch (err) {
    console.warn('Image compression fallback to original file:', err);
    return { file, originalSize, compressedSize: originalSize, savedPercent: 0 };
  }
}

/**
 * Batch compress multiple files with progress callback
 */
export async function compressMediaBatch(
  files: File[],
  onProgress?: (index: number, total: number, latestFile: File) => void
): Promise<File[]> {
  const result: File[] = [];
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const { file: compressed } = await compressImage(file);
    result.push(compressed);
    onProgress?.(i + 1, files.length, compressed);
  }
  return result;
}

// Helper to load image across modern and older browser environments
async function loadImageBitmapOrElement(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file);
    } catch {
      // Fallback to HTMLImageElement
    }
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
}
