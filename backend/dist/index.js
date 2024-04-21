"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = require("dotenv");
const http_1 = __importDefault(require("http"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const user_routes_1 = require("./routes/user.routes");
const express_1 = __importDefault(require("express"));
const socket_1 = __importDefault(require("./configs/socket"));
(0, dotenv_1.config)();
const PORT = Number(process.env.PORT);
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
(0, socket_1.default)(server);
app.use((0, cookie_parser_1.default)());
app.use((0, cors_1.default)({
    credentials: true,
    origin: "http://localhost:5173"
}));
app.use(express_1.default.json());
app.get("/", (req, res) => {
    res.status(200).send({ message: "Hello World!!!" });
});
app.use("/user", user_routes_1.userRouter);
app.use((req, res, next) => {
    next({ status: 404, message: "Page not found" });
});
const errorHandler = (err, req, res, next) => {
    res.status(err.status || 500);
    res.send({ Error: err.message });
};
app.use(errorHandler);
server.listen(PORT, () => {
    console.log(`App is running at http://localhost:${PORT}`);
});
