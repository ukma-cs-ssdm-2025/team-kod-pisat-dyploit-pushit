const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
require('dotenv').config();

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID,
    secretAccessKey: process.env.CLOUDFLARE_SECRET_ACCESS_KEY
  }
});

async function uploadFileToR2(fileBuffer, fileName, mimeType) {
  const command = new PutObjectCommand({
    Bucket: process.env.CLOUDFLARE_BUCKET_NAME,
    Key: fileName,
    Body: fileBuffer,
    ContentType: mimeType,
    ACL: 'public-read'
  });

  await s3.send(command);
  return `${process.env.CLOUDFLARE_BUCKET_PUBLIC_URL}/${fileName}`;
}

async function deleteFileFromR2(key) {
  await s3.send(new DeleteObjectCommand({
    Bucket: process.env.CLOUDFLARE_BUCKET_NAME,
    Key: key
  }));
}

module.exports = { uploadFileToR2, deleteFileFromR2 };
