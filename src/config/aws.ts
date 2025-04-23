import { S3Client } from '@aws-sdk/client-s3';

const region = import.meta.env.VITE_AWS_REGION || 'eu-north-1';
const accessKeyId = import.meta.env.VITE_AWS_ACCESS_KEY_ID;
const secretAccessKey = import.meta.env.VITE_AWS_SECRET_ACCESS_KEY;
const bucketName = import.meta.env.VITE_AWS_S3_BUCKET || 'filmila';

if (!accessKeyId || !secretAccessKey) {
  console.error('AWS credentials are not properly configured in environment variables');
}

export const s3Client = new S3Client({
  region,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

export const BUCKET_NAME = bucketName; 