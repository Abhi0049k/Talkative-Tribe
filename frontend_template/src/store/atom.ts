import { atom } from "recoil";
import { Socket } from "socket.io-client";

export const tokenState = atom<string>({
    key: "tokenState",
    default: ""
})


export const socketState = atom<Socket>({
    key: "socketState",
    default: undefined
})