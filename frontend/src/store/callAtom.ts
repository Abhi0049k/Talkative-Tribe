import { atom } from 'recoil';

/**
 * Call State Machine
 * Defines the lifecycle of a call from initiation to cleanup
 */
export enum CallState {
    IDLE = 'IDLE',                 // No active call
    RINGING = 'RINGING',           // Incoming call (showing modal)
    CONNECTING = 'CONNECTING',     // Call accepted, establishing connection
    ONGOING = 'ONGOING',           // Call connected and active
    ENDING = 'ENDING',             // Cleanup in progress
    ENDED = 'ENDED'                // Fully cleaned up (transitions back to IDLE)
}

/**
 * Call Type
 */
export type CallType = 'direct' | 'community';

/**
 * Media Type
 */
export type MediaType = 'voice' | 'video';

/**
 * Call Manager State
 * Single source of truth for all call-related state
 */
export interface CallManagerState {
    // Core State
    state: CallState;
    callType: CallType | null;
    mediaType: MediaType | null;

    // Call Metadata
    callId: string | null;
    startedAt: Date | null;

    // Participants (for direct calls)
    localUserId: string | null;
    remoteUserId: string | null;
    remoteUserName: string | null;

    // Community Call Metadata
    communityId: string | null;
    communityName: string | null;
    isHost: boolean;

    // Media Streams
    localStream: MediaStream | null;
    remoteStream: MediaStream | null;

    // WebRTC
    peerConnection: RTCPeerConnection | null;

    // Incoming Call Data
    incomingCallData: any | null;
}

/**
 * Initial State
 */
const initialCallManagerState: CallManagerState = {
    state: CallState.IDLE,
    callType: null,
    mediaType: null,
    callId: null,
    startedAt: null,
    localUserId: null,
    remoteUserId: null,
    remoteUserName: null,
    communityId: null,
    communityName: null,
    isHost: false,
    localStream: null,
    remoteStream: null,
    peerConnection: null,
    incomingCallData: null,
};

/**
 * Call Manager Atom
 * Centralized state for all call operations
 */
export const callManagerState = atom<CallManagerState>({
    key: 'callManagerState',
    default: initialCallManagerState,
});

/**
 * Helper: Check if call is active
 */
export const isCallActive = (state: CallState): boolean => {
    return [CallState.RINGING, CallState.CONNECTING, CallState.ONGOING, CallState.ENDING].includes(state);
};

/**
 * Helper: Check if media should be active
 */
export const shouldMediaBeActive = (state: CallState): boolean => {
    return [CallState.CONNECTING, CallState.ONGOING].includes(state);
};

/**
 * Helper: Check if cleanup should run
 */
export const shouldCleanup = (state: CallState): boolean => {
    return state === CallState.ENDING;
};
