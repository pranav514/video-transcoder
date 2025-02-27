import { NextFunction, Request , Response } from "express";
import { createClient } from "redis";
import { getClient } from "../config";
// const client = createClient();
// client.connect();
const MAX_TOKEN = 5;
setInterval(async () => {
    const client = await getClient();
    if(!client){
        throw new Error("no client of redis");
    }
    try{
        const currentTime  = await client.lLen("tokens");
        const tokenadd = MAX_TOKEN - currentTime;
        if(tokenadd > 0){
            for(var index = 0 ; index < tokenadd ; index++){
               await  client.rPush("tokens" , "AAAA");
            }
            console.log("token refiled");
        }
    }catch(error){
        console.log(error);
    }
} , 10000)

export async function limiter (req : Request , res : Response  , next : NextFunction) : Promise<void> {
    const client = await getClient();
    if(!client){
        throw new Error("no client of redis");
    }
    const cnt = await client.lLen("tokens");
    console.log("reached here");
    if(cnt > 0){
        await client.lPop("tokens");
        next();
    }else{
      res.status(429).json({
        message : "too many request api limit exceed",
        nosOfRequest : cnt
      })
    }
}