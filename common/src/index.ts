import { Socket } from "socket.io-client";

import z from "zod";

export interface UserI {
    id: string;
    name: string;
    email: string;
    password: string;
    image?: string
}

export const LoginInput = z.object({
    email: z.string().email(),
    password: z.string()
})

export type LoginInputType = z.infer<typeof LoginInput>

export const RegisterInput = z.object({
    name: z.string(),
    email: z.string().email(),
    password: z.string()
})

export type RegisterInputType = z.infer<typeof RegisterInput>

export interface DecodedUser {
    id: string;
    name: string;
}

export type userProfileT = Pick<UserI, 'name' | 'email' | 'id'>


export enum Action {
    login = "login",
    register = "register"
}

export interface CredentialsI {
    email: string;
    password: string;
    name?: string;
}

export interface MessageI {
    id: string;
    message: string;
    img?: string;
    senderId: string;
    receiverId: string;
    roomId: string;
    createdAt: Date;
}

export interface dataI {
    id: string;
    messages: MessageI[];
}

export interface HomeChildProps {
    socket: Socket;
}

export interface roomsI {
    id: string;
    room: string;
    creatorId: string;
    participantId: string;
    creator: UserI;
    participant: UserI;
}