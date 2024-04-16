import { NextFunction, Request, Response, Router } from "express";
import { LoginInput, LoginInputType, RegisterInput, RegisterInputType, room, UserI } from "../shared";
import prisma from "../configs/prismaInstance";
import { compare, hash } from "bcrypt";
import { JwtPayload, sign, verify } from "jsonwebtoken";

export const userRouter = Router();

export type userProfileT = Pick<UserI, 'name' | 'email' | 'id'>

userRouter.post("/register", async (req: Request, res: Response, next: NextFunction) => {
    const { email, name, password }: RegisterInputType = req.body;
    const SALT_ROUNDS: number = Number(process.env.SALT_ROUNDS);
    const JWT_SECRET_KEY: string = process.env.JWT_SECRET_KEY || "";
    try {
        const { success } = RegisterInput.safeParse({ name, email, password });
        if (!success) return next({ status: 422, message: "Invalid Input" });
        const userExists = await prisma.user.findUnique({ where: { email }, select: { id: true, name: true } });
        if (userExists) return next({ status: 409, message: "User Already Exists" });
        const hashedPasswd: string = await hash(password, SALT_ROUNDS);
        const newUser: userProfileT = await prisma.user.create({ data: { name, email, password: hashedPasswd }, select: { id: true, email: true, name: true } });
        const token: string = sign({ id: newUser.id, name: newUser.name }, JWT_SECRET_KEY, { expiresIn: "48h" })
        res.cookie("token", token);
        res.status(200).send({ message: "New User Created" });
    } catch (err) {
        console.log('/user/register', err);
        next(err);
    }
})

userRouter.post("/login", async (req: Request, res: Response, next: NextFunction) => {
    const { email, password }: LoginInputType = req.body;
    const JWT_SECRET_KEY: string = process.env.JWT_SECRET_KEY || "";
    try {
        const { success } = LoginInput.safeParse({ email, password });
        if (!success) return next({ status: 422, message: "Invalid Input" });
        const userExists = await prisma.user.findUnique({ where: { email } });
        if (!userExists) return next({ status: 404, message: "User Doesn't Exists" });
        const result = await compare(password, userExists.password);
        if (!result) return next({ status: 422, message: "Wrong Password" });
        const token: string = sign({ id: userExists.id, name: userExists.name }, JWT_SECRET_KEY, { expiresIn: "48h" })
        res.cookie("token", token);
        res.status(200).send({ message: "Login Successful" });
    } catch (err) {
        console.log("/user/login", err);
        next(err);
    }
})

userRouter.get("/get-username/:id", async (req: Request, res: Response, next: NextFunction) => {
    try {
        // const result = 
        res.status(200).send({ msg: 'Welcome' });
    } catch (err) {
        console.log(err);
        next(err);
    }
})

userRouter.get("/all-previous-private-rooms", async (req: Request, res: Response, next: NextFunction) => {
    console.log(req.cookies.token);
    const JWT_SECRET_KEY: string = process.env.JWT_SECRET_KEY || "";
    console.log("JWT_SECRET_KEY: ", JWT_SECRET_KEY);
    try {
        const user = verify(req.cookies.token, JWT_SECRET_KEY) as JwtPayload;
        console.log("user: ", user);
        let rooms = await prisma.room.findMany({
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
        })
        console.log("############################");
        // rooms.forEach(async (el) => {
        //     console.log(el.creatorId !== user.id);
        //     if (el.creatorId !== user.id) {
        //         el.creator = await prisma.user.findUnique({ where: { id: el.creatorId } });
        //     } else if (el.participantId !== user.id) {
        //         el.participant = await prisma.user.findUnique({ where: { id: el.participantId } });
        //     }
        //     // console.log('for user', user.id, user.name, 'room partner: ', el.creator || el.participant);
        // })
        console.log(rooms);
        console.log("############################");
        res.status(200).send({ rooms, id: user.id });
    } catch (err) {
        console.log(err);
        next(err);
    }
})

userRouter.post("/info", async (req: Request, res: Response, next: NextFunction) => {
    const JWT_SECRET_KEY: string = process.env.JWT_SECRET_KEY || "";
    try {
        const token = req.cookies.token;
        const user = verify(token, JWT_SECRET_KEY);
        console.log("User Exist: ", user);
        res.status(200).send(user)
    } catch (err) {
        console.log("/user/info", err);
        next(err);
    }

})

userRouter.get("/logout", async (req: Request, res: Response, next: NextFunction) => {
    res.cookie("token", "")
    res.status(200).send({ message: "Logged out!" });
})