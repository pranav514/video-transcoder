import express from "express";
import cors from "cors";
import uploadRoute from "./routes/uploadRoute";
import { client } from "./config";
import path from 'path'
const PORT = 3000;
const app = express();
app.use(cors());
app.use(express.json());
const hlsPath = path.resolve(__dirname, '../../hls-output');
console.log("Serving HLS files from:", hlsPath);
app.use('/hls-output', express.static(hlsPath));
app.use('/api/v1/' , uploadRoute)
app.listen(PORT,() => {
    client.connect();
    console.log(`server started at localhost ${PORT}`);
})