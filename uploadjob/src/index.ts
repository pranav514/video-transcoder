import express from "express";
import cors from "cors";
import uploadRoute from "./routes/uploadRoute";

import path from 'path'
import downloadRoute from "./routes/downloadRoute";
const PORT = 3000;
const app = express();
app.use(cors());
app.use(express.json());
const hlsPath = path.resolve(__dirname, '../../hls-output');
console.log("Serving HLS files from:", hlsPath);
app.use('/hls-output', express.static(hlsPath));
app.use('/api/v1/' , uploadRoute)
app.use('/api/v1' , downloadRoute)
app.listen(PORT,() => {
    console.log(`server started at localhost ${PORT}`);
})