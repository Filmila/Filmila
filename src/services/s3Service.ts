import { PutObjectCommand } from '@aws-sdk/client-s3';
import { s3Client, BUCKET_NAME } from '../config/aws';

export const uploadFileToS3 = async (file: File, key: string): Promise<string> => {
  try {
    // Log configuration for debugging
    console.log('Starting upload with config:', {
      bucket: BUCKET_NAME,
      region: s3Client.config.region,
      hasCredentials: !!s3Client.config.credentials,
      fileType: file.type,
      fileSize: file.size,
      key
    });

    // Convert file to Uint8Array
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Create the upload command without ACL
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: uint8Array,
      ContentType: file.type,
      ContentLength: uint8Array.length,
    });

    try {
      // Attempt to upload
      console.log('Sending upload command to S3...');
      const response = await s3Client.send(command);
      console.log('Upload successful:', response);

      // Generate and return the public URL
      const publicUrl = `https://${BUCKET_NAME}.s3.${s3Client.config.region}.amazonaws.com/${key}`;
      console.log('Generated public URL:', publicUrl);
      return publicUrl;
    } catch (uploadError) {
      console.error('S3 upload error:', {
        error: uploadError,
        message: uploadError instanceof Error ? uploadError.message : 'Unknown error',
        name: uploadError instanceof Error ? uploadError.name : 'Unknown error type'
      });

      // Check for specific error types
      if (uploadError instanceof Error) {
        if (uploadError.message.includes('NetworkError') || uploadError.message.includes('Failed to fetch')) {
          throw new Error('Network error: Please check your internet connection and try again');
        }
        if (uploadError.message.includes('AccessDenied')) {
          throw new Error('Access denied: Please check your AWS credentials and bucket permissions');
        }
        if (uploadError.message.includes('NoSuchBucket')) {
          throw new Error(`Bucket "${BUCKET_NAME}" not found. Please check your configuration`);
        }
        if (uploadError.message.includes('does not allow ACLs')) {
          // If we get an ACL error, we'll need to update the bucket policy instead
          console.log('Note: Bucket does not allow ACLs. Make sure the bucket policy grants public read access.');
        }
      }
      
      throw uploadError;
    }
  } catch (error) {
    console.error('Upload process error:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    throw new Error(`Failed to upload file to S3: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}; 