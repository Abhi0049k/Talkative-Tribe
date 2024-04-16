import { atom } from "recoil";

export const tokenState = atom<string>({
    key: "tokenState",
    default: ""
})

export const currChat = atom<string>({
    key: "currChat",
    default: ''
})

export const prevChat = atom<string>({
    key: "prevChat",
    default: undefined
})