/**
 * Cloud storage service for handling file uploads
 * Currently implements a simple base64 storage approach
 * Can be easily extended to use AWS S3, Cloudinary, or other cloud providers
 */

import api from '../api/axios';

/**
 * Storage provider interface
 */
class StorageProvider {
  async uploadImage(imageData, options = {}) {
    throw new Error('uploadImage method must be implemented');
  }

  async deleteImage(imageUrl) {
    throw new Error('deleteImage method must be implemented');
  }

  async getImageUrl(imageId) {
    throw new Error('getImageUrl method must be implemented');
  }
}

/**
 * Simple base64 storage provider
 * Stores images as base64 data through the backend API
 */
class Base64StorageProvider extends StorageProvider {
  async uploadImage(imageData, options = {}) {
    try {
      const { userId, type = 'profile' } = options;
      
      // For now, we'll store the base64 data directly
      // In a real implementation, this would upload to a cloud service
      const uploadData = {
        image_data: imageData.data,
        image_size: imageData.size,
        image_type: type,
        user_id: userId
      };

      // Since backend doesn't have upload endpoint yet, we'll simulate it
      // by returning a data URL that can be stored in the profile
      const imageUrl = imageData.data;
      
      return {
        url: imageUrl,
        id: `${type}_${userId}_${Date.now()}`,
        size: imageData.size,
        uploadedAt: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }
  }

  async deleteImage(imageUrl) {
    try {
      // In a real implementation, this would delete from cloud storage
      // For now, we just return success since we're using data URLs
      return { success: true };
    } catch (error) {
      throw new Error(`Delete failed: ${error.message}`);
    }
  }

  async getImageUrl(imageId) {
    try {
      // In a real implementation, this would fetch from cloud storage
      // For now, we assume the imageId is already a data URL
      return imageId;
    } catch (error) {
      throw new Error(`Get image URL failed: ${error.message}`);
    }
  }
}

/**
 * AWS S3 with CloudFront storage provider
 */
class S3CloudFrontStorageProvider extends StorageProvider {
  constructor(config = {}) {
    super();
    this.config = {
      bucket: config.bucket || import.meta.env.VITE_AWS_S3_BUCKET,
      region: config.region || import.meta.env.VITE_AWS_REGION,
      cloudFrontDomain: config.cloudFrontDomain || import.meta.env.VITE_AWS_CLOUDFRONT_DOMAIN,
      uploadEndpoint: config.uploadEndpoint || '/api/upload/profile-picture',
      ...config
    };
  }

  async uploadImage(imageData, options = {}) {
    try {
      const { userId, type = 'profile' } = options;
      
      // Generate unique filename
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 15);
      const fileExtension = this.getFileExtension(imageData.data);
      const fileName = `${type}/${userId}/${timestamp}_${randomId}.${fileExtension}`;

      // Prepare upload data
      const uploadPayload = {
        fileName,
        imageData: imageData.data,
        contentType: this.getContentType(imageData.data),
        size: imageData.size,
        userId,
        type
      };

      // Upload through backend API
      const response = await api.post(this.config.uploadEndpoint, uploadPayload);
      
      if (!response.data || !response.data.success) {
        throw new Error(response.data?.message || 'Upload failed');
      }

      // Construct CloudFront URL
      const cloudFrontUrl = this.buildCloudFrontUrl(response.data.key || fileName);

      return {
        url: cloudFrontUrl,
        id: response.data.key || fileName,
        size: imageData.size,
        uploadedAt: new Date().toISOString(),
        s3Key: response.data.key,
        etag: response.data.etag
      };
    } catch (error) {
      if (error.response) {
        const status = error.response.status;
        const message = error.response.data?.message || 'Upload failed';
        
        switch (status) {
          case 413:
            throw new Error('File too large for upload');
          case 415:
            throw new Error('Unsupported file type');
          case 429:
            throw new Error('Too many upload requests. Please try again later');
          case 500:
            throw new Error('Server error during upload. Please try again');
          default:
            throw new Error(message);
        }
      }
      throw new Error(`Upload failed: ${error.message}`);
    }
  }

  async deleteImage(imageUrl) {
    try {
      // Extract S3 key from CloudFront URL or use as key directly
      const s3Key = this.extractS3KeyFromUrl(imageUrl);
      
      const response = await api.delete(`/api/upload/profile-picture/${encodeURIComponent(s3Key)}`);
      
      return {
        success: true,
        deletedAt: new Date().toISOString()
      };
    } catch (error) {
      if (error.response?.status === 404) {
        // Image already deleted or doesn't exist
        return { success: true, message: 'Image not found (may already be deleted)' };
      }
      throw new Error(`Delete failed: ${error.message}`);
    }
  }

  async getImageUrl(imageId) {
    try {
      // If imageId is already a CloudFront URL, return it
      if (imageId.startsWith('http')) {
        return imageId;
      }
      
      // Build CloudFront URL from S3 key
      return this.buildCloudFrontUrl(imageId);
    } catch (error) {
      throw new Error(`Get image URL failed: ${error.message}`);
    }
  }

  /**
   * Builds CloudFront URL from S3 key
   * @param {string} s3Key - S3 object key
   * @returns {string} - CloudFront URL
   */
  buildCloudFrontUrl(s3Key) {
    const domain = this.config.cloudFrontDomain;
    if (!domain) {
      throw new Error('CloudFront domain not configured');
    }
    
    // Ensure domain doesn't end with slash and key doesn't start with slash
    const cleanDomain = domain.replace(/\/$/, '');
    const cleanKey = s3Key.replace(/^\//, '');
    
    return `${cleanDomain}/${cleanKey}`;
  }

  /**
   * Extracts S3 key from CloudFront URL
   * @param {string} url - CloudFront URL or S3 key
   * @returns {string} - S3 key
   */
  extractS3KeyFromUrl(url) {
    if (!url.startsWith('http')) {
      return url; // Already an S3 key
    }
    
    const domain = this.config.cloudFrontDomain;
    if (domain && url.startsWith(domain)) {
      return url.replace(domain, '').replace(/^\//, '');
    }
    
    // Try to extract from URL path
    try {
      const urlObj = new URL(url);
      return urlObj.pathname.replace(/^\//, '');
    } catch {
      return url; // Return as-is if URL parsing fails
    }
  }

  /**
   * Gets file extension from base64 data
   * @param {string} base64Data - Base64 image data
   * @returns {string} - File extension
   */
  getFileExtension(base64Data) {
    const mimeType = this.getContentType(base64Data);
    switch (mimeType) {
      case 'image/jpeg':
        return 'jpg';
      case 'image/png':
        return 'png';
      case 'image/webp':
        return 'webp';
      case 'image/gif':
        return 'gif';
      default:
        return 'jpg';
    }
  }

  /**
   * Gets content type from base64 data
   * @param {string} base64Data - Base64 image data
   * @returns {string} - Content type
   */
  getContentType(base64Data) {
    if (base64Data.startsWith('data:')) {
      const match = base64Data.match(/data:([^;]+);/);
      return match ? match[1] : 'image/jpeg';
    }
    return 'image/jpeg';
  }
}

/**
 * Cloudinary storage provider (placeholder for future implementation)
 */
class CloudinaryStorageProvider extends StorageProvider {
  constructor(config = {}) {
    super();
    this.config = {
      cloudName: config.cloudName || process.env.VITE_CLOUDINARY_CLOUD_NAME,
      apiKey: config.apiKey || process.env.VITE_CLOUDINARY_API_KEY,
      apiSecret: config.apiSecret || process.env.VITE_CLOUDINARY_API_SECRET,
      ...config
    };
  }

  async uploadImage(imageData, options = {}) {
    // TODO: Implement Cloudinary upload
    throw new Error('Cloudinary storage provider not implemented yet');
  }

  async deleteImage(imageUrl) {
    // TODO: Implement Cloudinary delete
    throw new Error('Cloudinary storage provider not implemented yet');
  }

  async getImageUrl(imageId) {
    // TODO: Implement Cloudinary get URL
    throw new Error('Cloudinary storage provider not implemented yet');
  }
}

/**
 * Cloud storage service
 */
class CloudStorageService {
  constructor() {
    this.provider = this.createProvider();
  }

  createProvider() {
    const storageType = import.meta.env.VITE_STORAGE_PROVIDER || 'base64';
    
    switch (storageType.toLowerCase()) {
      case 's3':
      case 'cloudfront':
        return new S3CloudFrontStorageProvider();
      case 'cloudinary':
        return new CloudinaryStorageProvider();
      case 'base64':
      default:
        return new Base64StorageProvider();
    }
  }

  /**
   * Uploads an image to cloud storage
   * @param {Object} imageData - Processed image data
   * @param {Object} options - Upload options
   * @returns {Promise<Object>} - Upload result with URL and metadata
   */
  async uploadImage(imageData, options = {}) {
    try {
      return await this.provider.uploadImage(imageData, options);
    } catch (error) {
      throw new Error(`Cloud storage upload failed: ${error.message}`);
    }
  }

  /**
   * Deletes an image from cloud storage
   * @param {string} imageUrl - URL or ID of the image to delete
   * @returns {Promise<Object>} - Delete result
   */
  async deleteImage(imageUrl) {
    try {
      return await this.provider.deleteImage(imageUrl);
    } catch (error) {
      throw new Error(`Cloud storage delete failed: ${error.message}`);
    }
  }

  /**
   * Gets the public URL for an image
   * @param {string} imageId - ID of the image
   * @returns {Promise<string>} - Public URL of the image
   */
  async getImageUrl(imageId) {
    try {
      return await this.provider.getImageUrl(imageId);
    } catch (error) {
      throw new Error(`Get image URL failed: ${error.message}`);
    }
  }

  /**
   * Uploads a profile picture
   * @param {Object} imageData - Processed image data
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Upload result
   */
  async uploadProfilePicture(imageData, userId) {
    return this.uploadImage(imageData, {
      userId,
      type: 'profile',
      folder: 'profiles'
    });
  }
}

// Create and export singleton instance
const cloudStorageService = new CloudStorageService();
export default cloudStorageService;

// Export provider classes for testing
export {
  StorageProvider,
  Base64StorageProvider,
  S3CloudFrontStorageProvider,
  CloudinaryStorageProvider,
  CloudStorageService
};