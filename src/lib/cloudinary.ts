/**
 * Legacy module path — uploads now use Vercel Blob (`@/lib/blob-upload`).
 * Re-exports keep existing imports working.
 *
 * Cloudinary URLs already stored in defaults / localStorage still load as normal
 * media sources. New files are uploaded to Vercel Blob only.
 */

export {
  MEDIA_FOLDERS,
  MEDIA_FOLDERS as CLOUDINARY_FOLDERS,
  uploadToBlob,
  uploadToCloudinary,
  isCloudinaryUrl,
  isVercelBlobUrl,
  type MediaFolder,
  type MediaFolder as CloudinaryFolder,
  type MediaUploadResult,
  type MediaUploadResult as CloudinaryUploadResult,
  type MediaUploadOptions,
  type MediaUploadOptions as CloudinaryUploadOptions,
  type MediaResourceType,
  type MediaResourceType as CloudinaryResourceType,
} from "@/lib/blob-upload";
