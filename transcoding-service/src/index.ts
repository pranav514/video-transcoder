import fs from "fs";
import { client } from "./config";
import redis from "redis"
import { json } from "stream/consumers";
import { execute } from "./utils/execute";
import { idText } from "typescript";
const port = 3000
const processVideo = async () => {
    client.connect();
    console.log("waiting for video job");
    let uploadedVideoPath: string;
    while(true){
        const videoJob = await client.brPop('videoQueue' , 0);
        const data = videoJob ? JSON.parse(videoJob.element) : null;
        const id = data.id;
        uploadedVideoPath  = data.uploadedVideoPath
        const outputFolderRootPath = data.outputPath
        try{
  
            const outputFolderSubdirectoryPath = {
                '360p' : `${outputFolderRootPath}/360p`,
                '480p' : `${outputFolderRootPath}/480p`,
                '720p' : `${outputFolderRootPath}/720p`,
                '1080p' : `${outputFolderRootPath}/1080p`,
            }
            if(!fs.existsSync(outputFolderRootPath)){
                fs.mkdirSync(outputFolderSubdirectoryPath['360p'] , {
                    recursive : true
                })
                fs.mkdirSync(outputFolderSubdirectoryPath['480p'] , {
                    recursive : true,
                })
                fs.mkdirSync(outputFolderSubdirectoryPath['720p'] , {
                    recursive : true,
                })
                fs.mkdirSync(outputFolderSubdirectoryPath['1080p'] , {
                    recursive : true,
                })

            }
            const ffmpegCommands = [

                `ffmpeg -i ${uploadedVideoPath} -vf "scale=w=640:h=360" -c:v libx264 -b:v 800k -c:a aac -b:a 96k -f hls -hls_time 15 -hls_playlist_type vod -hls_segment_filename "${outputFolderSubdirectoryPath['360p']}/segment%03d.ts" -start_number 0 "${outputFolderSubdirectoryPath['360p']}/index.m3u8"`,

                `ffmpeg -i ${uploadedVideoPath} -vf "scale=w=854:h=480" -c:v libx264 -b:v 1400k -c:a aac -b:a 128k -f hls -hls_time 15 -hls_playlist_type vod -hls_segment_filename "${outputFolderSubdirectoryPath['480p']}/segment%03d.ts" -start_number 0 "${outputFolderSubdirectoryPath['480p']}/index.m3u8"`,
     
                `ffmpeg -i ${uploadedVideoPath} -vf "scale=w=1280:h=720" -c:v libx264 -b:v 2800k -c:a aac -b:a 128k -f hls -hls_time 15 -hls_playlist_type vod -hls_segment_filename "${outputFolderSubdirectoryPath['720p']}/segment%03d.ts" -start_number 0 "${outputFolderSubdirectoryPath['720p']}/index.m3u8"`,
   
                `ffmpeg -i ${uploadedVideoPath} -vf "scale=w=1920:h=1080" -c:v libx264 -b:v 5000k -c:a aac -b:a 192k -f hls -hls_time 15 -hls_playlist_type vod -hls_segment_filename "${outputFolderSubdirectoryPath['1080p']}/segment%03d.ts" -start_number 0 "${outputFolderSubdirectoryPath['1080p']}/index.m3u8"`,
            ]
            await Promise.all(ffmpegCommands.map(cmd => execute(cmd)));
            const masterPlaylistPath = `${outputFolderRootPath}/index.m3u8`
            const masterPlaylistContent = `
            #EXTM3U
            #EXT-X-STREAM-INF:BANDWIDTH=800000,RESOLUTION=640x360
            360p/index.m3u8
            #EXT-X-STREAM-INF:BANDWIDTH=1400000,RESOLUTION=854x480
            480p/index.m3u8
            #EXT-X-STREAM-INF:BANDWIDTH=2800000,RESOLUTION=1280x720
            720p/index.m3u8
            #EXT-X-STREAM-INF:BANDWIDTH=5000000,RESOLUTION=1920x1080
            1080p/index.m3u8
        `.trim() 
        fs.writeFileSync(masterPlaylistPath, masterPlaylistContent)
        const videoUrls = {
            master: `http://localhost:${port}/hls-output/${id}/index.m3u8`,
            '360p': `http://localhost:${port}/hls-output/${id}/360p/index.m3u8`,
            '480p': `http://localhost:${port}/hls-output/${id}/480p/index.m3u8`,
            '720p': `http://localhost:${port}/hls-output/${id}/720p/index.m3u8`,
            '1080p': `http://localhost:${port}/hls-output/${id}/1080p/index.m3u8`,
        }
        console.log(`video processed : ${id} ` )
        console.log(`video url `, videoUrls);


        } catch (error) {
            console.error(`HLS conversion error: ${error}`)
            try {
                fs.unlinkSync(uploadedVideoPath)
            } catch (err) {
                console.error(`Failed to delete original video file: ${err}`)
            }
            try {
                fs.unlinkSync(outputFolderRootPath)
            } catch (err) {
                console.error(`Failed to delete generated HLS files: ${err}`)
            }
        }
    }
}
processVideo()