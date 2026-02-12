import { atom, AtomEffect } from "recoil";

// Handedness type for mobile UI
export type Handedness = 'right' | 'left';

// Inter-component Call Trigger
export interface CallTriggerI {
    recipientId: string;
    recipientName: string;
    type: 'voice' | 'video';
    isDirect: boolean;
    action?: 'start' | 'join';
}

export const triggerCallState = atom<CallTriggerI | null>({
    key: "triggerCallState",
    default: null
});

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

export const joinedCommunitiesState = atom<any[]>({
    key: "joinedCommunitiesState",
    default: []
})

// Community Call Invitation State
export interface CommunityCallInviteI {
    communityId: string;
    communityName: string;
    callerId: string;
    callerName: string;
    callType: 'voice' | 'video';
    timestamp?: string;
}

export const communityCallInviteState = atom<CommunityCallInviteI | null>({
    key: "communityCallInviteState",
    default: null
})