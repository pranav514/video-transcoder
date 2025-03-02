import redis, { createClient } from "redis";
import dotenv from "dotenv"
import { S3Client } from "@aws-sdk/client-s3";
dotenv.config();
export const client = createClient();
if (!process.env.AWS_REGION || !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    throw new Error('AWS credentials are not properly configured in environment variables');
}

export const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

export const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME
