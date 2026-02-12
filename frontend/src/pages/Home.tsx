import HomeLeft from "@/components/HomeLeft";
import HomeRight from "@/components/HomeRight";
import MobileHomeRight from "@/components/MobileHomeRight";
import MobileSettings from "@/components/MobileSettings";
import socketIo from "@/configs/socket-io";
import { tokenState, handednessState } from "@/store/atom";
import { FC, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRecoilValue } from "recoil";
import { Socket } from "socket.io-client";
// Removed SimplePeer - using native WebRTC only
import CommunityCall from "@/components/CommunityCall";
import IncomingCallModal from "@/components/IncomingCallModal";
import { triggerCallState, communityCallInviteState, CommunityCallInviteI } from "@/store/atom";
import toast from "react-hot-toast";
import { useRecoilState } from "recoil"; // Change to useRecoilState for triggerCallState

const Home: FC = () => {
    const token = useRecoilValue(tokenState);
    const handedness = useRecoilValue(handednessState);
    const isLeftHanded = handedness === 'left';

    const [sockt, setsocket] = useState<Socket>();
    const navigate = useNavigate();

    // Call State
    const [triggerCall, setTriggerCall] = useRecoilState(triggerCallState);
    const [incomingCall, setIncomingCall] = useState<any>(null); // { signal, from, name }
    const [activeCall, setActiveCall] = useState(false);
    const [callType, setCallType] = useState<'voice' | 'video'>('video');
    const [otherUserName, setOtherUserName] = useState("");
    const [recipientId, setRecipientId] = useState(""); // Store recipient ID for proper call ending


    // Community Call State
    const [isHost, setIsHost] = useState(false);
    const [isCommunityCall, setIsCommunityCall] = useState(false);
    const [currentCallId, setCurrentCallId] = useState("");
    const [communityCallPeerId, setCommunityCallPeerId] = useState(""); // For cleanup in beforeunload

    // Community Call Invitation State
    const [communityCallInvite, setCommunityCallInvite] = useRecoilState(communityCallInviteState);

    // Start Call (Triggered by HomeRight or Join Button)
    useEffect(() => {
        if (triggerCall && sockt) {
            initiateCall(triggerCall);
            // Reset trigger to avoid loop, but careful if strict mode
            setTriggerCall(null);
        }
    }, [triggerCall, sockt]);

    const initiateCall = async (data: any) => {
        try {
            // Get current user ID
            const payload = token.split('.')[1];
            const decoded = JSON.parse(atob(payload));
            const myId = decoded.id;

            if (data.isDirect) {
                // 🎯 DIRECT CALL: Unified Workflow (Treat as Room)
                console.log("🚀 Starting Unified Direct Call pipeline:", data.recipientName);

                // Deterministic Room ID for 1:1
                const ids = [myId, data.recipientId].sort();
                const roomId = ids.join("-#=#-");

                // Emit Ringing Signal (Receiver will see modal)
                // We fake 'signalData' just to pass callType or dummy SDP if needed
                sockt?.emit('callUser', {
                    userToCall: data.recipientId,
                    signalData: { type: 'offer', callType: data.type },
                    callType: data.type,
                    from: sockt.id,
                    name: decoded.name
                });

                // Immediately enter the "Room" (Waiting for receiver)
                setIsCommunityCall(true); // Treat as community call for logic reuse
                setIsHost(true);
                setCurrentCallId(roomId);
                setOtherUserName(data.recipientName);
                setCallType(data.type);
                setActiveCall(true);
                setRecipientId(data.recipientId);

            } else {
                // 🎯 COMMUNITY CALL: Normal Flow
                console.log("👥 [COMMUNITY] Initiating community call in:", data.recipientName);

                setCallType(data.type);
                setActiveCall(true);
                setIsCommunityCall(true);
                setIsHost(data.action === 'start');
                setCurrentCallId(data.recipientId);
                setOtherUserName(data.recipientName);

                if (data.action === 'start') {
                    console.log("🎥 Starting community call in:", data.recipientId);
                    sockt?.emit('startCommunityCall', {
                        communityId: data.recipientId,
                        type: data.type
                    });
                    toast.success("Community Call Started");
                } else {
                    toast.success("Joining Community Call...");
                }
            }

        } catch (err: any) {
            console.error("❌ Failed to initiate call:", err);
            toast.error("Could not start call: " + err.message);
            setActiveCall(false);
            setTriggerCall(null);
        }
    };

    const acceptCall = async () => {
        if (!incomingCall || !sockt) return;

        console.log("📞 [ACCEPT] Unified Accept Flow");
        console.log("📞 [ACCEPT] Incoming call from:", incomingCall.name, "Room:", incomingCall.roomId);

        try {
            const isVideoCall = incomingCall.callType === 'video'; // Detected from backend payload

            // Set Call Pipeline State - This triggers CommunityCall component mount
            setCallType(isVideoCall ? 'video' : 'voice');
            setCurrentCallId(incomingCall.roomId);
            setOtherUserName(incomingCall.name);
            setIsCommunityCall(true); // Treat as community call
            setIsHost(false);
            setIncomingCall(null); // Hide modal
            setActiveCall(true);   // Start Call
            setRecipientId(incomingCall.callerId);

            // Emit answer just to clear any signaling/ringing state on caller side if needed
            // But main logic is joining the room.Caller waits for join.
            // We can emit 'answerCall' for logging purposes on backend
            sockt?.emit('answerCall', {
                signal: { type: 'answer', sdp: '' }, // Dummy
                to: incomingCall.from
            });

        } catch (err: any) {
            console.error("❌ Failed to accept call:", err);
            toast.error("Failed to join call");
            setIncomingCall(null);
        }
    };

    const endCall = () => {
        console.log("🔴 [END_CALL] Resetting Unified Call State");

        // Notify backend if necessary
        if (isCommunityCall && isHost && currentCallId && !currentCallId.includes("-#=#-")) {
            console.log("📢 Host ending community call globally");
            sockt?.emit("endCommunityCall", { communityId: currentCallId });
        } else if (recipientId) {
            // For Direct Call, notify other user
            sockt?.emit("endCall", { to: recipientId });
        }

        // Reset Unified State
        setActiveCall(false);
        setIsCommunityCall(false);
        setCurrentCallId("");
        setIsHost(false);
        setOtherUserName("");
        setIncomingCall(null);
        setCommunityCallPeerId("");
        setRecipientId("");
    };

    // Socket Events
    useEffect(() => {
        if (!sockt) return;

        sockt.on("callUser", (data) => {
            console.log("📞 Incoming call:", data);
            setIncomingCall(data);
            setOtherUserName(data.name || "Unknown");

            // Detect call type from signal data (SDP offer)
            // If the offer contains video, it's a video call, otherwise voice
            if (data.signal && data.signal.sdp) {
                const isVideoCall = data.signal.sdp.includes('m=video');
                setCallType(isVideoCall ? 'video' : 'voice');
                console.log("🎥🎤 Detected call type:", isVideoCall ? 'video' : 'voice');
            }
        });

        sockt.on("communityCallStarted", (data: any) => {
            console.log("📞 [COMMUNITY] Call started confirmation from server:", data);
            toast.success(`Started ${data.type} call`);
        });

        // Handle call end events from other user
        sockt.on("callEnded", () => {
            console.log("📞 Other user ended the call");
            toast("Other user ended the call");
            endCall(); // Clean up our local call state
        });

        sockt.on("call_joined", (data: any) => {
            console.log("User joined call:", data);
            toast(`${data.userName} joined the call`);
        });

        // Handle community call invitations
        sockt.on("communityCallInvitation", (data: CommunityCallInviteI) => {
            console.log("📞 Received community call invitation:", data);

            // Only show invitation if we're not already in a call
            if (!activeCall && !isCommunityCall) {
                setCommunityCallInvite(data);
                toast(`${data.callerName} started a ${data.callType} call in ${data.communityName}`);
            }
        });

        // Handle when community call ends (for non-participants)
        sockt.on("communityCallEnded", (data: any) => {
            console.log("📞 Community call ended:", data);
            if (communityCallInvite && communityCallInvite.communityId === data.communityId) {
                setCommunityCallInvite(null);
                toast("Community call ended");
            }
        });

        sockt.on("community_deleted", (data: any) => {
            console.log("Community deleted:", data);
            toast.error("This community was deleted by admin");
            // Force clear current chat and redirect
            // We can reload or just clear state. Reload is safest for sync.
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        });

        return () => {
            if (sockt) {
                sockt.off("callUser");
                sockt.off("callAccepted");
                sockt.off("iceCandidate"); // Legacy cleanup
                sockt.off("call_joined");
                sockt.off("community_deleted");
                sockt.off("callEnded");
                sockt.off("communityCallInvitation");
                sockt.off("communityCallEnded");
            }
        };
    }, [sockt]);

    useEffect(() => {
        document.title = "Home | Talkative Tribe";

        const socket = socketIo(token);
        setsocket(socket);

        socket.on('loginAgain', () => {
            alert("Session expired. Redirecting to Login Page.");
            navigate("/login");
        });

        // Listen for custom call trigger events from UserCard
        const handleCallTrigger = (event: CustomEvent) => {
            const { type, recipientId, recipientName } = event.detail;
            console.log("📞 Call trigger received:", { type, recipientId, recipientName });
            setTriggerCall({
                recipientId,
                recipientName,
                type,
                isDirect: true,
                action: 'start'
            });
        };

        window.addEventListener('triggerCall', handleCallTrigger as EventListener);

        return () => {
            window.removeEventListener('triggerCall', handleCallTrigger as EventListener);
        };
    }, [token, navigate]);

    // 🔥 SAFETY NET: Cleanup media on page unload/refresh
    useEffect(() => {
        const handleBeforeUnload = (_e: BeforeUnloadEvent) => {
            if (activeCall) {
                // If in call, ensure we cleanup.
                // React unmount will handle logic if navigation, but closing tab is abrupt.
                // We rely on socket disconnect event on backend mainly.
                // But we can try to emit leave.
                if (sockt && currentCallId && communityCallPeerId) {
                    sockt.emit('leaveCommunityCall', { communityId: currentCallId, peerId: communityCallPeerId });
                }
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [activeCall, sockt, currentCallId, communityCallPeerId]);

    // Log render conditions for debugging
    console.log("🎨 [RENDER] Render conditions:", {
        activeCall,
        isCommunityCall,
        currentCallId,
        shouldRenderCommunityCall: activeCall && isCommunityCall && currentCallId
    });

    return (
        <div className={`flex h-[calc(100vh-64px)] bg-background relative ${isLeftHanded ? 'flex-row-reverse' : 'flex-row'}`}>
            {sockt && (
                <>
                    <HomeLeft socket={sockt} />
                    <HomeRight socket={sockt} />
                    <MobileHomeRight socket={sockt} />

                    {/* Mobile Settings Button - Only visible on mobile */}
                    <MobileSettings />
                </>
            )}

            {/* Unified Call Modal */}
            {(incomingCall || communityCallInvite) && !activeCall && (
                <IncomingCallModal
                    callerName={
                        incomingCall
                            ? (incomingCall.name || "Unknown User")
                            : `Incoming call in ${communityCallInvite?.communityName}` // or "Abhi in Community"
                    }
                    callType={incomingCall ? callType : (communityCallInvite?.callType || 'video')}
                    // Community calls use 'Join' logic, Direct calls use 'Accept' logic
                    onAccept={incomingCall ? acceptCall : () => {
                        console.log("📞 Joining community call:", communityCallInvite);
                        if (communityCallInvite) {
                            // Join logic
                            setTriggerCall({
                                recipientId: communityCallInvite.communityId,
                                recipientName: communityCallInvite.communityName,
                                type: communityCallInvite.callType,
                                isDirect: false,
                                action: 'join'
                            });
                            setCommunityCallInvite(null);
                        }
                    }}
                    onDecline={incomingCall ? endCall : () => {
                        console.log("🚫 Ignoring community call invitation");
                        setCommunityCallInvite(null);
                        // Optional: could emit an 'ignore' event if we tracked unjoined users
                    }}
                />
            )}

            {activeCall && isCommunityCall && currentCallId && (
                <CommunityCall
                    socket={sockt!}
                    communityId={currentCallId}
                    communityName={otherUserName || "Community Call"}
                    onLeave={endCall}
                    type={callType}
                    onPeerIdSet={setCommunityCallPeerId}
                />
            )}
        </div>
    )
}

export default Home;
