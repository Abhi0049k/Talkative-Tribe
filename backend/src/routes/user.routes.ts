import { NextFunction, Request, Response, Router } from "express";
import prisma from "../configs/prismaInstance";
import { compare, hash } from "bcrypt";
import { JwtPayload, sign, verify } from "jsonwebtoken";
import { userProfileT, LoginInput, LoginInputType, RegisterInput, RegisterInputType } from "@mangalam0049k/common";

export const userRouter = Router();

userRouter.post("/register", async (req: Request, res: Response, next: NextFunction) => {
    const { email, name, password }: RegisterInputType = req.body;
    const SALT_ROUNDS: number = Number(process.env.SALT_ROUNDS) || 10;
    const JWT_SECRET_KEY: string = process.env.JWT_SECRET_KEY || "fallback_secret";
    try {
        const { success } = RegisterInput.safeParse({ name, email, password });
        if (!success) return next({ status: 422, message: "Invalid Input" });

        const userExists = await prisma.user.findUnique({ where: { email }, select: { id: true, name: true } });
        if (userExists) return next({ status: 409, message: "User Already Exists" });

        const hashedPasswd: string = await hash(password, SALT_ROUNDS);
        const newUser: userProfileT = await prisma.user.create({
            data: { name, email, password: hashedPasswd },
            select: { id: true, email: true, name: true }
        });

        const token: string = sign({ id: newUser.id, name: newUser.name }, JWT_SECRET_KEY, { expiresIn: "48h" })

        // Consistent response with login
        res.status(200).send({ message: "New User Created", token });
    } catch (err) {
        console.log('/user/register', err);
        next(err);
    }
})

userRouter.post("/login", async (req: Request, res: Response, next: NextFunction) => {
    console.log("Login Request Received");
    const { email, password }: LoginInputType = req.body;
    console.log(email, password)
    const JWT_SECRET_KEY: string = process.env.JWT_SECRET_KEY || "fallback_secret";
    try {
        const { success } = LoginInput.safeParse({ email, password });
        if (!success) return next({ status: 422, message: "Invalid Input" });

        const userExists = await prisma.user.findUnique({ where: { email } });
        if (!userExists) return next({ status: 404, message: "User Doesn't Exists" });

        const result = await compare(password, userExists.password);
        if (!result) return next({ status: 422, message: "Wrong Password" });

        const token: string = sign({ id: userExists.id, name: userExists.name }, JWT_SECRET_KEY, { expiresIn: "48h" })

        res.status(200).send({ message: "Login Successful", token: token });
    } catch (err) {
        console.log("Error in /user/login", err);
        next(err);
    }
})

userRouter.get("/get-username/:id", async (req: Request, res: Response, next: NextFunction) => {
    try {
        res.status(200).send({ msg: 'Welcome' });
    } catch (err) {
        console.log(err);
        next(err);
    }
})

userRouter.get("/all-previous-private-rooms", async (req: Request, res: Response, next: NextFunction) => {
    const JWT_SECRET_KEY: string = process.env.JWT_SECRET_KEY || "";
    try {
        // console.log(req.headers.authorization);
        const token = req.headers.authorization || "";
        const user = verify(token, JWT_SECRET_KEY) as JwtPayload;
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
                Message: {
                    take: 1
                }
            }
        })



        res.status(200).send({ rooms, id: user.id });
    } catch (err) {
        console.log("Hello all-previous-private-rooms")
        console.log(err);
        next(err);
    }
})
//SECTION - Sending User name to the client side
userRouter.post("/info", async (req: Request, res: Response, next: NextFunction) => {
    const JWT_SECRET_KEY: string = process.env.JWT_SECRET_KEY || "";
    try {
        const token = req.body.token;
        const user = verify(token, JWT_SECRET_KEY);
        res.status(200).send(user)
    } catch (err) {
        console.log("/user/info", err);
        next(err);
    }

})

userRouter.get("/logout", async (req: Request, res: Response, next: NextFunction) => {
    // res.cookie("token", "")
    console.log("Hitting Logout: ", req.body.token);
    res.status(200).send({ message: "Logged out!" });
})