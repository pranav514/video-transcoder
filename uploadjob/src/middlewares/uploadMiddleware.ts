

import { NextFunction, Request, Response } from "express";
import multer from "multer";
import { uniqueId } from "../utils/uniqueIdGenerator";
import { BUCKET_NAME, s3 } from "../config";
import { PutObjectCommand } from "@aws-sdk/client-s3";
const storage = multer.memoryStorage();
const upload  = multer({storage})
declare namespace Express {
    interface Request {
        file?: {
            key: string;
            path: string;
            mimetype: string;
            size: number;
            originalName: string;
            buffer?: Buffer;
            originalname?: string;
        };
    }
}
export const S3uploader  = (fieldName : string) => {
    return (req : Request , res : Response , next:NextFunction) => {
        const uploader = upload.single(fieldName);
        uploader(req , res , async(error) => {
            if(error){
                return res.status(400).json({
                    error: error.message
                });
            }
            if(!req.file){
                return next();
            }
            try{
                const fileExtension = req.file.originalname.split(".")[1];
                const id = uniqueId();
                const fileName = `uploads/${Date.now()}-${id}.${fileExtension}`
                const params = {
                    Bucket: BUCKET_NAME,
                    Key: fileName,
                    Body: req.file.buffer,
                    ContentType: req.file.mimetype,
                };
                
                const command = new PutObjectCommand(params);
                await s3.send(command);
                req.file = {
                    // @ts-ignore/
                    key: fileName,
                    path: `https://${BUCKET_NAME}.s3.amazonaws.com/${fileName}`,
                    mimetype: req.file.mimetype,
                    size: req.file.size,
                    originalName: req.file.originalname
                };
                next();
            }catch(error : any){
                return res.status(500).json({
                    error: "Failed to upload file to S3",
                    details: error.message
                });
            }
        })
    }
}