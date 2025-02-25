import { rejects } from 'assert'
import { exec } from 'child_process'
import { resolve } from 'path'
export const execute = async (command: string) : Promise<void> => {
    return new Promise((resolve , reject) => {
        exec(command , (error , stdout , stderr) => {
            if(error){
                console.log(`exec error : ${error}`)
                reject(error)
            }else{
                resolve();
            }
        })
    })
}