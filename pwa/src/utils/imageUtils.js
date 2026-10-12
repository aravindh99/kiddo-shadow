/**
 * Image processing utilities for profile picture upload
 */

/**
 * Validates image file type and size
 * @param {File} file - The image file to validate
 * @param {Object} options - Validation options
 * @returns {Object} - Validation result with isValid and error
 */
export function validateImageFile(file, options = {}) {
  const {
    maxSizeInMB = 5,
    allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  } = options;

  // Check if file exists
  if (!file) {
    return { isValid: false, error: 'No file provided' };
  }

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return { 
      isValid: false, 
      error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}` 
    };
  }

  // Check file size
  const fileSizeInMB = file.size / (1024 * 1024);
  if (fileSizeInMB > maxSizeInMB) {
    return { 
      isValid: false, 
      error: `File size too large. Maximum size: ${maxSizeInMB}MB` 
    };
  }

  return { isValid: true, error: null };
}

/**
 * Compresses and resizes an image file
 * @param {File} file - The image file to compress
 * @param {Object} options - Compression options
 * @returns {Promise<Blob>} - Compressed image blob
 */
export function compressImage(file, options = {}) {
  return new Promise((resolve, reject) => {
    const {
      maxWidth = 800,
      maxHeight = 800,
      quality = 0.8,
      outputFormat = 'image/jpeg'
    } = options;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Calculate new dimensions while maintaining aspect ratio
      let { width, height } = img;
      
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }

      // Set canvas dimensions
      canvas.width = width;
      canvas.height = height;

      // Draw and compress image
      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to compress image'));
          }
        },
        outputFormat,
        quality
      );
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = URL.createObjectURL(file);
  });
}

/**
 * Converts a blob to base64 string
 * @param {Blob} blob - The blob to convert
 * @returns {Promise<string>} - Base64 string
 */
export function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Creates a preview URL for an image file
 * @param {File} file - The image file
 * @returns {string} - Object URL for preview
 */
export function createImagePreview(file) {
  return URL.createObjectURL(file);
}

/**
 * Revokes an object URL to free memory
 * @param {string} url - The object URL to revoke
 */
export function revokeImagePreview(url) {
  URL.revokeObjectURL(url);
}

/**
 * Gets image dimensions from a file
 * @param {File} file - The image file
 * @returns {Promise<{width: number, height: number}>} - Image dimensions
 */
export function getImageDimensions(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight
      });
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Processes an image file for upload (validation, compression, conversion)
 * @param {File} file - The image file to process
 * @param {Object} options - Processing options
 * @returns {Promise<{data: string, size: number, dimensions: Object}>} - Processed image data
 */
export async function processImageForUpload(file, options = {}) {
  try {
    // Validate the file
    const validation = validateImageFile(file, options.validation);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    // Get original dimensions
    const originalDimensions = await getImageDimensions(file);
    
    // Compress the image
    const compressedBlob = await compressImage(file, options.compression);
    
    // Convert to base64
    const base64Data = await blobToBase64(compressedBlob);
    
    return {
      data: base64Data,
      size: compressedBlob.size,
      originalSize: file.size,
      dimensions: originalDimensions,
      compressionRatio: (file.size - compressedBlob.size) / file.size
    };
  } catch (error) {
    throw new Error(`Image processing failed: ${error.message}`);
  }
}