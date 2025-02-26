import fs from "fs";
import path from "path";
import os from "os";
import { BUCKET_NAME, client } from "./config";
import { execute } from "./utils/execute";
import { uploadtoS3 } from "./utils/uploadToS3";

const processVideo = async () => {
    client.connect();
    console.log("waiting for video job");

    while (true) {
        const videoJob = await client.brPop("videoQueue", 0);
        if (!videoJob) continue;

        const data = JSON.parse(videoJob.element);
        const id = data.id;
        const uploadedVideoPath = data.uploadedVideoPath;
        const tempDir = path.join(os.tmpdir(), `hls-output-${id}`);
        fs.mkdirSync(tempDir, { recursive: true });

        try {
               const resolutions = ["360p", "480p", "720p", "1080p"];
            const outputFolders: Record<string, string> = {};
            for (const res of resolutions) {
                outputFolders[res] = path.join(tempDir, res);
                fs.mkdirSync(outputFolders[res], { recursive: true });
            }
            const ffmpegCommands = [
                `ffmpeg -i ${uploadedVideoPath} -vf "scale=w=640:h=360" -c:v libx264 -b:v 800k -c:a aac -b:a 96k -f hls -hls_time 15 -hls_playlist_type vod -hls_segment_filename "${outputFolders["360p"]}/segment%03d.ts" -start_number 0 "${outputFolders["360p"]}/index.m3u8"`,

                `ffmpeg -i ${uploadedVideoPath} -vf "scale=w=854:h=480" -c:v libx264 -b:v 1400k -c:a aac -b:a 128k -f hls -hls_time 15 -hls_playlist_type vod -hls_segment_filename "${outputFolders["480p"]}/segment%03d.ts" -start_number 0 "${outputFolders["480p"]}/index.m3u8"`,

                `ffmpeg -i ${uploadedVideoPath} -vf "scale=w=1280:h=720" -c:v libx264 -b:v 2800k -c:a aac -b:a 128k -f hls -hls_time 15 -hls_playlist_type vod -hls_segment_filename "${outputFolders["720p"]}/segment%03d.ts" -start_number 0 "${outputFolders["720p"]}/index.m3u8"`,

                `ffmpeg -i ${uploadedVideoPath} -vf "scale=w=1920:h=1080" -c:v libx264 -b:v 5000k -c:a aac -b:a 192k -f hls -hls_time 15 -hls_playlist_type vod -hls_segment_filename "${outputFolders["1080p"]}/segment%03d.ts" -start_number 0 "${outputFolders["1080p"]}/index.m3u8"`,
            ];
            await Promise.all(ffmpegCommands.map((cmd) => execute(cmd)));
            const masterPlaylistPath = path.join(tempDir, "index.m3u8");
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
            `.trim();
            fs.writeFileSync(masterPlaylistPath, masterPlaylistContent);
            const s3OutputFolder = `hls-output/${id}`;

            await uploadtoS3(masterPlaylistPath, `${s3OutputFolder}/index.m3u8`);
            for (const res of resolutions) {
                fs.readdirSync(outputFolders[res]).forEach((file) => {
                    uploadtoS3(`${outputFolders[res]}/${file}`, `${s3OutputFolder}/${res}/${file}`);
                });
            }

            console.log(`Video processed: ${id}`);
            const videoUrls = {
                master: `https://${BUCKET_NAME}.s3.amazonaws.com/${s3OutputFolder}/index.m3u8`,
                "360p": `https://${BUCKET_NAME}.s3.amazonaws.com/${s3OutputFolder}/360p/index.m3u8`,
                "480p": `https://${BUCKET_NAME}.s3.amazonaws.com/${s3OutputFolder}/480p/index.m3u8`,
                "720p": `https://${BUCKET_NAME}.s3.amazonaws.com/${s3OutputFolder}/720p/index.m3u8`,
                "1080p": `https://${BUCKET_NAME}.s3.amazonaws.com/${s3OutputFolder}/1080p/index.m3u8`,
            };

            console.log("Video URLs:", videoUrls);
            fs.rmSync(tempDir, { recursive: true, force: true });

        } catch (error) {
            console.error(`HLS conversion error: ${error}`);
        }
    }
};

processVideo();
