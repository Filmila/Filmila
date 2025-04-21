import { S3Client } from '@aws-sdk/client-s3';

const REGION = 'YOUR_REGION'; // e.g., 'us-east-1'
const ACCESS_KEY_ID = 'YOUR_ACCESS_KEY_ID';
const SECRET_ACCESS_KEY = 'YOUR_SECRET_ACCESS_KEY';

export const s3Client = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: ACCESS_KEY_ID,
    secretAccessKey: SECRET_ACCESS_KEY,
  },
});

export const BUCKET_NAME = 'YOUR_BUCKET_NAME'; 