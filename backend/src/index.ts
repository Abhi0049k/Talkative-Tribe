import cors from "cors";
import { config } from "dotenv";
import http from "http";
import { userRouter } from "./routes/user.routes";
import express, { Application, ErrorRequestHandler, NextFunction, Request, Response } from "express";
import SocketIOInstance from "./configs/socket";
import { uploadRouter } from "./routes/upload.routes";
import path from "path";
config();

const PORT: number = Number(process.env.PORT);
// CORS origin parsing removed - using universal access.

const app: Application = express();
const server = http.createServer(app);
SocketIOInstance.getInstance(server);

// Verify DB Connection
import { connectDB } from "./configs/prismaInstance";
connectDB();

app.use(cors({
    credentials: true,
    origin: (origin, callback) => {
        // Allow all origins (universal access)
        callback(null, true);
    }
}));

app.use(express.json());


app.get("/", (req: Request, res: Response) => {
    res.status(200).send({ message: "Hello World!!!" });
})

app.use("/user", userRouter);
app.use("/upload", uploadRouter);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use((req: Request, res: Response, next: NextFunction) => {
    next({ status: 404, message: "Page not found" });
})

const errorHandler: ErrorRequestHandler = (err, req: Request, res: Response, next: NextFunction) => {
    res.status(err.status || 500);
    res.send({ Error: err.message });
}

app.use(errorHandler);

server.listen(PORT, () => {
    console.log(`App is running at http://localhost:${PORT}`);
});