"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRouter = void 0;
const express_1 = require("express");
const prismaInstance_1 = __importDefault(require("../configs/prismaInstance"));
const bcrypt_1 = require("bcrypt");
const jsonwebtoken_1 = require("jsonwebtoken");
const common_1 = require("@mangalam0049k/common");
exports.userRouter = (0, express_1.Router)();
exports.userRouter.post("/register", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, name, password } = req.body;
    const SALT_ROUNDS = Number(process.env.SALT_ROUNDS);
    const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY || "";
    try {
        const { success } = common_1.RegisterInput.safeParse({ name, email, password });
        if (!success)
            return next({ status: 422, message: "Invalid Input" });
        const userExists = yield prismaInstance_1.default.user.findUnique({ where: { email }, select: { id: true, name: true } });
        if (userExists)
            return next({ status: 409, message: "User Already Exists" });
        const hashedPasswd = yield (0, bcrypt_1.hash)(password, SALT_ROUNDS);
        const newUser = yield prismaInstance_1.default.user.create({ data: { name, email, password: hashedPasswd }, select: { id: true, email: true, name: true } });
        const token = (0, jsonwebtoken_1.sign)({ id: newUser.id, name: newUser.name }, JWT_SECRET_KEY, { expiresIn: "48h" });
        res.cookie("token", token);
        res.status(200).send({ message: "New User Created" });
    }
    catch (err) {
        console.log('/user/register', err);
        next(err);
    }
}));
exports.userRouter.post("/login", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY || "";
    try {
        const { success } = common_1.LoginInput.safeParse({ email, password });
        if (!success)
            return next({ status: 422, message: "Invalid Input" });
        const userExists = yield prismaInstance_1.default.user.findUnique({ where: { email } });
        if (!userExists)
            return next({ status: 404, message: "User Doesn't Exists" });
        const result = yield (0, bcrypt_1.compare)(password, userExists.password);
        if (!result)
            return next({ status: 422, message: "Wrong Password" });
        const token = (0, jsonwebtoken_1.sign)({ id: userExists.id, name: userExists.name }, JWT_SECRET_KEY, { expiresIn: "48h" });
        res.cookie("token", token);
        res.status(200).send({ message: "Login Successful" });
    }
    catch (err) {
        console.log("/user/login", err);
        next(err);
    }
}));
exports.userRouter.get("/get-username/:id", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        res.status(200).send({ msg: 'Welcome' });
    }
    catch (err) {
        console.log(err);
        next(err);
    }
}));
exports.userRouter.get("/all-previous-private-rooms", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY || "";
    try {
        const user = (0, jsonwebtoken_1.verify)(req.cookies.token, JWT_SECRET_KEY);
        let rooms = yield prismaInstance_1.default.room.findMany({
            where: {
                OR: [
                    { creatorId: user.id },
                    { participantId: user.id }
                ]
            },
            include: {
                creator: true,
                participant: true,
            }
        });
        res.status(200).send({ rooms, id: user.id });
    }
    catch (err) {
        console.log(err);
        next(err);
    }
}));
exports.userRouter.post("/info", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY || "";
    try {
        const token = req.cookies.token;
        const user = (0, jsonwebtoken_1.verify)(token, JWT_SECRET_KEY);
        res.status(200).send(user);
    }
    catch (err) {
        console.log("/user/info", err);
        next(err);
    }
}));
exports.userRouter.get("/logout", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    res.cookie("token", "");
    res.status(200).send({ message: "Logged out!" });
}));
