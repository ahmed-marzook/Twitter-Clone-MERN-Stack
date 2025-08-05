import {
  S3Client,
  PutObjectCommand,
  CreateBucketCommand,
  DeleteObjectCommand,
  DeleteBucketCommand,
  paginateListObjectsV2,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";

import path from "path";

// S3 Configuration
const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  endpoint: process.env.S3_ENDPOINT || undefined, // For LocalStack: http://localhost:4566
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "test", // LocalStack default
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "test", // LocalStack default
  },
  forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true", // Required for LocalStack
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || "your-bucket-name"; // Use env var for flexibility

class S3Manager {
  /**
   * Upload an image from a REST API endpoint to S3
   * @param imageUrl - URL of the image from the REST API
   * @param s3Key - The key/name for the file in S3 (optional, defaults to extracted filename)
   * @param headers - Optional headers for the API request (e.g., authorization)
   */
  async uploadImageFromUrl(
    imageUrl: string,
    s3Key?: string,
    headers?: Record<string, string>
  ): Promise<string> {
    try {
      console.log(`📥 Fetching image from: ${imageUrl}`);

      // Fetch the image from the REST API
      const response = await fetch(imageUrl, {
        headers: headers || {},
      });

      if (!response.ok) {
        throw new Error(
          `Failed to fetch image: ${response.status} ${response.statusText}`
        );
      }

      // Get the image buffer
      const imageBuffer = await response.arrayBuffer();
      const imageData = Buffer.from(imageBuffer);

      // Determine filename and content type
      const fileName = s3Key || this.extractFilenameFromUrl(imageUrl);
      const contentType =
        response.headers.get("content-type") ||
        this.getContentTypeFromUrl(imageUrl);

      // Create upload command
      const uploadCommand = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: fileName,
        Body: imageData,
        ContentType: contentType,
      });

      // Upload to S3
      await s3Client.send(uploadCommand);
      console.log(`✅ Successfully uploaded: ${fileName}`);

      return fileName;
    } catch (error) {
      console.error("❌ Upload failed:", error);
      throw error;
    }
  }

  /**
   * Delete an object from S3
   * @param s3Key - The key/name of the file to delete
   */
  async deleteObject(s3Key: string): Promise<void> {
    try {
      const deleteCommand = new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: s3Key,
      });

      await s3Client.send(deleteCommand);
      console.log(`✅ Successfully deleted: ${s3Key}`);
    } catch (error) {
      console.error("❌ Delete failed:", error);
      throw error;
    }
  }

  /**
   * List all objects in the bucket
   */
  async listObjects(): Promise<string[]> {
    try {
      const listCommand = new ListObjectsV2Command({
        Bucket: BUCKET_NAME,
      });

      const response = await s3Client.send(listCommand);
      const objects = response.Contents?.map((obj) => obj.Key || "") || [];

      console.log(`📋 Found ${objects.length} objects in bucket`);
      objects.forEach((obj) => console.log(`  - ${obj}`));

      return objects;
    } catch (error) {
      console.error("❌ List failed:", error);
      throw error;
    }
  }

  /**
   * Extract filename from URL
   */
  private extractFilenameFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const filename = path.basename(pathname);

      // If no filename in URL, generate one with timestamp
      if (!filename || !filename.includes(".")) {
        const timestamp = Date.now();
        return `image_${timestamp}.jpg`;
      }

      return filename;
    } catch {
      // If URL parsing fails, generate a filename
      const timestamp = Date.now();
      return `image_${timestamp}.jpg`;
    }
  }

  /**
   * Get content type from URL extension
   */
  private getContentTypeFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      const ext = path.extname(urlObj.pathname).toLowerCase();
      return this.getContentType(ext);
    } catch {
      return "image/jpeg"; // Default fallback
    }
  }

  /**
   * Get content type based on file extension
   */
  private getContentType(extension: string): string {
    const contentTypes: { [key: string]: string } = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".gif": "image/gif",
      ".webp": "image/webp",
      ".bmp": "image/bmp",
    };

    return contentTypes[extension] || "application/octet-stream";
  }
}
