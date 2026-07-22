/**
 * Smoke-test Cloudinary credentials from env (never hardcode secrets).
 *
 * Usage:
 *   node --env-file=.env.local test-cloudinary.js
 */
import { v2 as cloudinary } from "cloudinary";

const cloud_name =
  process.env.CLOUDINARY_CLOUD_NAME ||
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const api_key = process.env.CLOUDINARY_API_KEY;
const api_secret = process.env.CLOUDINARY_API_SECRET;

if (!cloud_name || !api_key || !api_secret) {
  console.error(
    "Missing CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET"
  );
  process.exit(1);
}

cloudinary.config({ cloud_name, api_key, api_secret, secure: true });

async function testUpload() {
  try {
    console.log("Upload d'une image de test…");

    const result = await cloudinary.uploader.upload(
      "https://res.cloudinary.com/demo/image/upload/c_scale,w_300/sample.jpg",
      { folder: "patrick-roziel/test" }
    );

    console.log("Upload réussi");
    console.log("URL :", result.secure_url);
    console.log("Public ID :", result.public_id);

    const transformed = cloudinary.url(result.public_id, {
      fetch_format: "auto",
      quality: "auto",
    });

    console.log("Version optimisée :", transformed);
  } catch (error) {
    console.error("Erreur :", error);
    process.exit(1);
  }
}

testUpload();
