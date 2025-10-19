import { S3Client } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
dotenv.config();
const {ACCESSKEYID, SECRETACCESSKEY, AWS_REGION, S3_BUCKET_NAME} = process.env;

const s3 = new S3Client({ 
    region: AWS_REGION,
    credentials: { // not required for v2, but required for v3
        accessKeyId: ACCESSKEYID,
        secretAccessKey: SECRETACCESSKEY,
    },
 });

export { s3, S3_BUCKET_NAME };