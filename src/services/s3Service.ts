import { PutObjectCommand } from '@aws-sdk/client-s3';
import { s3Client, BUCKET_NAME } from '../config/aws';
import { Buffer } from 'buffer';

export const uploadFileToS3 = async (file: File, key: string): Promise<string> => {
  try {
    console.log('Starting S3 upload with configuration:', {
      bucket: BUCKET_NAME,
      key,
      fileSize: file.size,
      fileType: file.type
    });

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: file.type,
    });

    console.log('Sending upload command to S3');
    await s3Client.send(command);
    console.log('Upload completed successfully');

    // Generate the public URL for the uploaded file
    const publicUrl = `https://${BUCKET_NAME}.s3.${s3Client.config.region}.amazonaws.com/${key}`;
    console.log('Generated public URL:', publicUrl);
    
    return publicUrl;
  } catch (error) {
    console.error('Error uploading to S3:', error);
    throw new Error(`Failed to upload file to S3: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}; 