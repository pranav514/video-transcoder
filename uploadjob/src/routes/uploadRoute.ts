import express, { Router } from "express"
import { S3uploader } from "../middlewares/uploadMiddleware";
import { uniqueId } from "../utils/uniqueIdGenerator";
import { BUCKET_NAME, getClient,  } from "../config";
import { limiter } from "../middlewares/ratelimiterMiddleware";
const router = Router();
router.post('/upload' ,limiter,S3uploader('video'), async (req , res)  => {
    const file = req.file;
    if(!file){
        throw new Error('video not send');
    }
    const id = uniqueId();
    const uploadedVideoPath = req.file?.path;
    const outputPath = `/hls-output/${id}`
const client = await getClient();
if(!client){
    throw new Error("could not connect to the client")
}
    await client.lPush('videoQueue' , JSON.stringify({id , uploadedVideoPath , outputPath}))
    
    res.status(200).json({
        message : "video uploaded sucessfully",
        videoId : id,
        path  : uploadedVideoPath
    })
    
})
export default router;