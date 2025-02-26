import { exec } from "child_process";
import express, { Router } from "express"
import fs from "fs"
import path from "path";

const router = Router();
router.post('/download/:videoId/:resolution' , async(req , res) => {
    const  {videoId , resolution} = req.params;
    const outputdir = path.join(__dirname , '../../temp');
    console.log(outputdir);
    const hlsurl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.ap-south-1.amazonaws.com/hls-output/${videoId}/${resolution}/index.m3u8`;
    const outputFilePath = path.join(__dirname, `../../temp/${videoId}_${resolution}.mp4`);
    if(!fs.existsSync(outputdir)){
        fs.mkdirSync(outputdir , {
            recursive : true,
        })
    }
    if(fs.existsSync(outputFilePath)){
        return res.download(outputFilePath)
    }
    const ffmpeg_command = `ffmpeg -i "${hlsurl}" -c copy "${outputFilePath}"`;
    exec(ffmpeg_command , (error , stderr , stdout) => {
        if(error){
            console.log(error);
            return res.status(500).json(
                {
                    error
                }
            )
        }
        if(stderr){
                throw new Error("error  converting the video")
        }
        res.download(outputFilePath, `${videoId}.mp4`, () => {
            // fs.unlinkSync(outputFilePath);
        });
    })
})
export default router