import cors from "cors";
import { config } from "dotenv";
import http from "http";
import { userRouter } from "./routes/user.routes";
import express, { Application, ErrorRequestHandler, NextFunction, Request, Response } from "express";
import SocketIOInstance from "./configs/socket";
config();

const PORT: number = Number(process.env.PORT);
const FRONTEND_SERVER_URL: string = process.env.FRONTEND_SERVER_URL || "";

// Parse comma-separated origins for CORS (supports multiple origins for network testing)
const allowedOrigins = FRONTEND_SERVER_URL.split(',').map(origin => origin.trim());

const app: Application = express();
const server = http.createServer(app);
SocketIOInstance.getInstance(server);

// Verify DB Connection
import { connectDB } from "./configs/prismaInstance";
connectDB();

app.use(cors({
    credentials: true,
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or Postman)
        if (!origin) return callback(null, true);

        // Relaxed CORS for development to allow mobile access
        callback(null, true);
    }
}));
app.use(express.json());


app.get("/", (req: Request, res: Response) => {
    res.status(200).send({ message: "Hello World!!!" });
})

app.use("/user", userRouter);

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