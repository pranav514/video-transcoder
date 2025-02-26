import fs from "fs"
import { BUCKET_NAME, s3 } from "../config"
import { PutObjectCommand } from "@aws-sdk/client-s3"
export const uploadtoS3 = async (filePath : string, s3Key : string) => {
    console.log("here")
    try{
        const fileContent = fs.readFileSync(filePath)
        const command = new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: s3Key,
            Body: fileContent,
        })
        await s3.send(command);
        console.log(`uploaded to S3 : ${s3Key}  `)
    
}catch(error){
    console.error(`Failed to upload ${s3Key} to S3:`, error);
}
}
