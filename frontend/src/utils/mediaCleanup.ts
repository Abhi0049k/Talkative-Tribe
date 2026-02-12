/**
 * Centralized Media Cleanup Utility
 * Ensures all media tracks, peer connections, and references are properly destroyed.
 */
export const cleanupMedia = (
    stream: MediaStream | null,
    participantsMap: Map<string, any> | null,
    localVideoRef?: HTMLVideoElement | null
) => {
    console.log("🧹 [CLEANUP] Starting centralized media cleanup");

    // 1. Stop All Local Tracks
    if (stream) {
        const tracks = stream.getTracks();
        console.log(`🛑 Stopping ${tracks.length} local tracks`);
        tracks.forEach(track => {
            track.stop();
            track.enabled = false;
        });
    }

    // 2. Close All Peer Connections
    if (participantsMap) {
        console.log(`🔒 Closing ${participantsMap.size} peer connections`);
        participantsMap.forEach((participant, peerId) => {
            if (participant.peer) {
                // Stop all transceivers/senders
                participant.peer.getSenders().forEach((sender: any) => {
                    if (sender.track) {
                        sender.track.stop();
                    }
                });

                // Close connection
                participant.peer.close();
                console.log(`❌ Closed peer connection for ${peerId}`);
            }
        });
        participantsMap.clear();
    }

    // 3. Detach Video Element
    if (localVideoRef) {
        console.log("📺 Detaching local video srcObject");
        localVideoRef.srcObject = null;
    }

    console.log("✅ [CLEANUP] Media resources released");
};
