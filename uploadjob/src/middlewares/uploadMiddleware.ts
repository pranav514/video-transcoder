import multer from "multer"
import { uniqueId } from "../utils/uniqueIdGenerator";
import { NextFunction, Request, Response } from "express";

const conifg = () => {
    const storage = multer.diskStorage({
        destination  : function(req , file  , cb){
            cb(null , '../uploads/')
        },
        filename : function(req, file, cb) {
            const fileExtension = file.originalname.split('.')[1];
            const id = uniqueId();
            cb(null,`${Date.now()}-${id}.${fileExtension}`);
        },
    })
    const upload  = multer({storage});
    return upload;
}

export const uploader = (fieldName : string) => {
    return (req : Request, res : Response , next : NextFunction) => {
            const upload = conifg();
            const isUploaded = upload.single(fieldName);
            isUploaded(req , res , (error) => {
                if(error){
                    return res.status(400).json({
                        error : error.message
                    })
                }
                next();
            })
    }
}