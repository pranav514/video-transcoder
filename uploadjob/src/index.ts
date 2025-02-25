import express from "express";
import cors from "cors";
import uploadRoute from "./routes/uploadRoute";
import { client } from "./config";
const PORT = 3000;
const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/v1/' , uploadRoute)
app.listen(PORT,() => {
    client.connect();
    console.log(`server started at localhost ${PORT}`);
})