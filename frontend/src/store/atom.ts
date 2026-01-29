import { atom, AtomEffect } from "recoil";

// Handedness type for mobile UI
export type Handedness = 'right' | 'left';

// LocalStorage persistence effect
const localStorageEffect = <T>(key: string): AtomEffect<T> => ({ setSelf, onSet }) => {
    if (typeof window !== 'undefined') {
        const savedValue = localStorage.getItem(key);
        if (savedValue != null) {
            try {
                setSelf(JSON.parse(savedValue));
            } catch {
                setSelf(savedValue as T);
            }
        }
    }

    onSet((newValue, _, isReset) => {
        if (typeof window !== 'undefined') {
            if (isReset) {
                localStorage.removeItem(key);
            } else {
                localStorage.setItem(key, JSON.stringify(newValue));
            }
        }
    });
};

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

export const activeChatUserName = atom<string>({
    key: "activeChatUserName",
    default: ""
})

// Handedness state for mobile UI - persisted to localStorage
// Default is 'right' for right-handed users
export const handednessState = atom<Handedness>({
    key: "handednessState",
    default: 'right',
    effects: [localStorageEffect<Handedness>('talkative-tribe-handedness')]
})