import { S3Client } from '@aws-sdk/client-s3';

const region = import.meta.env.VITE_S3_REGION || 'eu-north-1';
const accessKeyId = import.meta.env.VITE_S3_ACCESS_KEY_ID;
const secretAccessKey = import.meta.env.VITE_S3_SECRET_ACCESS_KEY;
const bucketName = import.meta.env.VITE_S3_BUCKET || 'filmila';

if (!accessKeyId || !secretAccessKey) {
  console.error('AWS credentials are not properly configured in environment variables');
  console.error('Current environment:', {
    region,
    hasAccessKey: !!accessKeyId,
    hasSecretKey: !!secretAccessKey,
    bucketName
  });
}

// Create a separate region variable to ensure it's a string
const awsRegion = String(region);

export const s3Client = new S3Client({
  region: awsRegion,
  credentials: {
    accessKeyId: accessKeyId || '',
    secretAccessKey: secretAccessKey || '',
  },
  forcePathStyle: false,
  endpoint: `https://s3.${awsRegion}.amazonaws.com`,
});

export const BUCKET_NAME = bucketName;
export const AWS_REGION = awsRegion; 