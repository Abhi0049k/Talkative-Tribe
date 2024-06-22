import cors from "cors";
import { config } from "dotenv";
import http from "http";
import cookieParser from "cookie-parser";
import { userRouter } from "./routes/user.routes";
// import cookiesMiddleware from "universal-cookie-express";
import express, { Application, ErrorRequestHandler, NextFunction, Request, Response } from "express";
import SocketIOInstance from "./configs/socket";
// import socket from "./configs/socket";
config();

const PORT: number = Number(process.env.PORT);
const FRONTEND_SERVER_URL: string = process.env.FRONTEND_SERVER_URL || "";

const app: Application = express();
const server = http.createServer(app);
// socket(server);
SocketIOInstance.getInstance(server);

// app.use(cookiesMiddleware());
app.use(cookieParser());
app.use(cors({
    credentials: true,
    origin: FRONTEND_SERVER_URL
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