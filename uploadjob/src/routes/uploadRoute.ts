import express, { Router } from "express"
import { S3uploader } from "../middlewares/uploadMiddleware";
import { uniqueId } from "../utils/uniqueIdGenerator";
import { BUCKET_NAME, client } from "../config";
const router = Router();

router.post('/upload' ,S3uploader('video'), async (req , res)  => {
    const file = req.file;
    if(!file){
        throw new Error('video not send');
    }
    const id = uniqueId();
    const uploadedVideoPath = req.file?.path;
    const outputPath  = `https://${BUCKET_NAME}.s3.amazonaws.com/hls-output/${id}}`
    await client.lPush('videoQueue' , JSON.stringify({id , uploadedVideoPath , outputPath}))
    res.status(200).json({
        message : "video uploaded sucessfully",
        videoId : id,
        path  : uploadedVideoPath
    })
    
})
export default router;