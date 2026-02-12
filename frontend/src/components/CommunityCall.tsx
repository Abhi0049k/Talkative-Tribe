import { useRecoilValue } from 'recoil';
import { tokenState } from '@/store/atom';
import { useEffect, useState, useRef } from 'react';
import { Socket } from 'socket.io-client';
import VideoTile from './VideoTile';
import { Button } from './ui/button';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Users } from 'lucide-react';
import toast from 'react-hot-toast';

export interface CommunityCallProps {
  socket: Socket;
  communityId: string;
  communityName: string;
  onLeave: () => void;
  type: 'voice' | 'video';
  onPeerIdSet?: (peerId: string) => void; // Optional callback to pass peerId to parent
}

interface Participant {
  peerId: string;
  username: string;
  stream?: MediaStream;
  peer?: RTCPeerConnection;
}

const CommunityCall = ({
  socket,
  communityId,
  communityName,
  onLeave,
  type,
  onPeerIdSet
}: CommunityCallProps) => {
  const token = useRecoilValue(tokenState);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  // Mesh WebRTC State Management
  const [participants, setParticipants] = useState<Map<string, Participant>>(new Map());
  const [myPeerId, setMyPeerId] = useState<string>('');
  const [isInitialized, setIsInitialized] = useState(false);

  // Refs for cleanup to avoid effect re-runs
  const localStreamRef = useRef<MediaStream | null>(null);
  const participantsRef = useRef<Map<string, Participant>>(new Map());
  const socketRef = useRef<Socket>(socket);
  const myPeerIdRef = useRef<string>('');

  // Sync state to refs
  useEffect(() => { localStreamRef.current = localStream; }, [localStream]);
  useEffect(() => { participantsRef.current = participants; }, [participants]);
  useEffect(() => { socketRef.current = socket; }, [socket]);
  useEffect(() => { myPeerIdRef.current = myPeerId; }, [myPeerId]);

  // Parse JWT to get user info
  const getUserInfo = () => {
    try {
      const payload = token.split('.')[1];
      const decoded = JSON.parse(atob(payload));
      return { id: decoded.id, name: decoded.name };
    } catch (e) {
      console.error('Failed to parse token:', e);
      return { id: '', name: 'Unknown' };
    }
  };

  // Initialize local stream and join community call
  useEffect(() => {
    const initCall = async () => {
      try {
        console.log('🎥 Initializing community call:', communityName);

        // Get user media
        const stream = await navigator.mediaDevices.getUserMedia({
          video: type === 'video',
          audio: true
        });

        setLocalStream(stream);

        // Join community call room
        const userInfo = getUserInfo();
        socket.emit('joinCommunityCall', {
          communityId,
          peerId: userInfo.id,
          username: userInfo.name
        });

        setMyPeerId(userInfo.id);

        // Pass peerId to parent for cleanup purposes
        if (onPeerIdSet) {
          onPeerIdSet(userInfo.id);
        }

        setIsInitialized(true);

        console.log('✅ Community call initialized for:', userInfo.name);

      } catch (err: any) {
        console.error('❌ Failed to initialize community call:', err);
        let errorMessage = "Could not access Camera/Microphone";

        if (err.name === 'NotAllowedError') {
          errorMessage = "Camera/Microphone permission denied. Please allow access to join call.";
        } else if (err.name === 'NotFoundError') {
          errorMessage = "No camera or microphone found. Cannot join call.";
        } else if (err.name === 'NotReadableError') {
          errorMessage = "Camera or microphone is already in use.";
        }

        toast.error(errorMessage);
        onLeave();
      }
    };

    if (socket && communityId) {
      initCall();
    }

    return () => {
      // 🔥 CENTRALIZED CLEANUP: Use the shared utility with REFS
      // Using Refs ensures we access the LATEST state without adding them to dependencies
      // which prevents the effect from re-running and killing the call on state updates.
      console.log('🧹 CommunityCall component unmounting - invoking centralized cleanup');

      const streamToClean = localStreamRef.current;
      const participantsToClean = participantsRef.current;
      const socketInstance = socketRef.current;
      const peerIdToClean = myPeerIdRef.current;

      import('@/utils/mediaCleanup').then(({ cleanupMedia }) => {
        cleanupMedia(streamToClean, participantsToClean);
      });

      // Leave community call room and notify others
      if (peerIdToClean && socketInstance) {
        console.log(`👋 Leaving community call: ${communityId}`);
        socketInstance.emit('leaveCommunityCall', {
          communityId,
          peerId: peerIdToClean
        });
      }
    };
    // DEPENDENCIES: Only run when Call ID or Type changes. 
    // Stable socket is fine. DO NOT add localStream or participants here.
  }, [communityId, type]);

  // Socket event listeners and WebRTC logic
  useEffect(() => {
    if (!socket || !isInitialized || !localStream || !myPeerId) return;

    // Helper: Create Peer Connection
    const createPeerConnection = (peerId: string, isInitiator: boolean): RTCPeerConnection => {
      console.log(`🔗 Creating peer connection with ${peerId} (initiator: ${isInitiator})`);

      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ]
      });

      // Add local stream tracks immediately
      localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream);
        console.log(`📡 Added ${track.kind} track to peer ${peerId}`);
      });

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          console.log(`🧊 [ICE] Sending candidate to ${peerId}:`, event.candidate.type);
          socket.emit('communityCallIceCandidate', {
            communityId,
            from: myPeerId,
            to: peerId,
            candidate: event.candidate
          });
        } else {
          console.log(`🧊 [ICE] All candidates sent to ${peerId}`);
        }
      };

      // Handle remote streams
      pc.ontrack = (event) => {
        console.log(`📺 [ONTRACK] Received stream from ${peerId}:`, event.streams[0]);
        console.log(`📺 [ONTRACK] Stream ID: ${event.streams[0].id}, Tracks: ${event.streams[0].getTracks().length}`);

        setParticipants(prev => {
          const newMap = new Map(prev);
          const p = newMap.get(peerId);

          if (p) {
            console.log(`✅ [ONTRACK] Updating existing participant ${peerId} with stream`);
            newMap.set(peerId, { ...p, stream: event.streams[0] });
          } else {
            console.log(`⚠️ [ONTRACK] Participant ${peerId} not in map yet, creating entry with stream`);
            // Create participant entry if it doesn't exist (race condition fix)
            newMap.set(peerId, {
              peerId,
              username: 'Loading...', // Will be updated when participant info arrives
              stream: event.streams[0],
              peer: pc
            });
          }

          console.log(`📊 [ONTRACK] Participants map size: ${newMap.size}`);
          return newMap;
        });
      };



      // Track ICE connection state
      pc.oniceconnectionstatechange = () => {
        console.log(`🧊 [ICE STATE] ${peerId}:`, pc.iceConnectionState);
        if (pc.iceConnectionState === 'connected') {
          console.log(`✅ [ICE] Connection established with ${peerId}`);
        } else if (pc.iceConnectionState === 'failed') {
          console.error(`❌ [ICE] Connection failed with ${peerId}`);
        }
      };

      pc.onconnectionstatechange = () => {
        console.log(`🔗 [CONNECTION STATE] ${peerId}:`, pc.connectionState);
        if (pc.connectionState === 'connected') {
          console.log(`✅ [CONNECTED] Peer connection established with ${peerId}`);
        } else if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
          console.error(`❌ [DISCONNECTED] Peer connection lost with ${peerId}`);
          handlePeerDisconnected(peerId);
        }
      };


      return pc;
    };

    // --- Event Handlers ---

    // 1. New Joiner (Existing users see this) -> INITIATE CONNECTION
    const handleParticipantJoined = async (data: {
      peerId: string;
      username: string;
      activeParticipants?: Array<{ peerId: string; username: string }>
    }) => {
      console.log('👋 New participant joined:', data);

      const processParticipant = (targetId: string, targetName: string) => {
        setParticipants(prev => {
          if (prev.has(targetId)) return prev;

          console.log(`🔗 Initiating connection (sync) with ${targetId}`);

          // Create PC
          const pc = createPeerConnection(targetId, true);

          // Side effect: Create Offer
          (async () => {
            try {
              const offer = await pc.createOffer();
              await pc.setLocalDescription(offer);
              socket.emit('communityCallOffer', {
                communityId,
                from: myPeerId,
                to: targetId,
                offer
              });
            } catch (err) {
              console.error(`Error creating offer for ${targetId}:`, err);
            }
          })();

          const newMap = new Map(prev);
          newMap.set(targetId, { peerId: targetId, username: targetName, peer: pc });
          return newMap;
        });
      };

      // 1. Handle primary join
      processParticipant(data.peerId, data.username);

      // 2. Self-Healing using Active List
      if (data.activeParticipants) {
        data.activeParticipants.forEach(p => {
          if (p.peerId === myPeerId) return;
          processParticipant(p.peerId, p.username);
        });
      }
    };

    // 2. Existing Participants List (Joiner sees this) -> WAIT for offers
    const handleExistingParticipants = (data: { participants: Array<{ peerId: string; username: string }> }) => {
      console.log('📋 Found existing participants:', data.participants);
      setParticipants(prev => {
        const newMap = new Map(prev);
        data.participants.forEach(p => {
          if (p.peerId === myPeerId) return;

          // Just add placeholder state. DO NOT initiate. 
          // We wait for THEM (the existing participants) to send us an offer via handleParticipantJoined on their side.
          if (!newMap.has(p.peerId)) {
            console.log(`➕ Adding placeholder for existing participant ${p.peerId}`);
            newMap.set(p.peerId, { peerId: p.peerId, username: p.username });
          }
        });
        console.log(`📊 Updated participants map size: ${newMap.size}`);
        return newMap;
      });
    };

    // 3. Handle Incoming Offer (Existing users receive this from Joiner)
    const handleOffer = async (data: { from: string; username: string; offer: RTCSessionDescription }) => {
      console.log('📞 Received offer from:', data.from);

      const pc = createPeerConnection(data.from, false);

      // Update state - preserve existing data if participant already exists
      setParticipants(prev => {
        const newMap = new Map(prev);
        const existing = newMap.get(data.from);

        if (existing) {
          console.log(`🔄 [OFFER] Updating existing participant ${data.from} with peer connection`);
          // Preserve stream if it already exists (ontrack might have fired first)
          newMap.set(data.from, { ...existing, peer: pc, username: data.username || existing.username });
        } else {
          console.log(`➕ [OFFER] Creating new participant entry for ${data.from}`);
          newMap.set(data.from, { peerId: data.from, username: data.username || "User", peer: pc });
        }

        console.log(`📊 [OFFER] Participants map size: ${newMap.size}`);
        return newMap;
      });

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket.emit('communityCallAnswer', {
          communityId,
          from: myPeerId,
          to: data.from,
          answer
        });
      } catch (err) {
        console.error("Error handling offer:", err);
      }
    };

    // 4. Handle Answer (Joiner receives this)
    const handleAnswer = async (data: { from: string; answer: RTCSessionDescription }) => {
      console.log('📞 Received answer from:', data.from);
      setParticipants(prev => {
        const newMap = new Map(prev);
        const p = newMap.get(data.from);
        if (p && p.peer) {
          p.peer.setRemoteDescription(new RTCSessionDescription(data.answer))
            .catch(e => console.error("Set remote desc error:", e));
        }
        return newMap;
      });
    };

    // 5. Handle ICE Candidate
    const handleIceCandidate = async (data: { from: string; candidate: RTCIceCandidate }) => {
      setParticipants(prev => {
        const newMap = new Map(prev);
        const p = newMap.get(data.from);
        if (p && p.peer) {
          p.peer.addIceCandidate(new RTCIceCandidate(data.candidate))
            .catch(e => console.error("Add ICE error:", e));
        }
        return newMap;
      });
    };

    // 6. Handle Disconnect
    const handlePeerDisconnected = (peerId: string) => {
      console.log('👋 Participant disconnected:', peerId);
      setParticipants(prev => {
        const newMap = new Map(prev);
        const p = newMap.get(peerId);
        if (p && p.peer) {
          p.peer.close();
        }
        newMap.delete(peerId);
        console.log('✅ Removed participant from map. New size:', newMap.size);
        return newMap;
      });
    };

    // 7. Handle Call Ended
    const handleCallEnded = () => {
      console.log('🏁 Call ended by host');
      toast('The host has ended the call.', { icon: '🏁' });
      onLeave();
    };

    // Register Listeners
    socket.on('communityCallParticipantJoined', handleParticipantJoined);
    socket.on('existingCallParticipants', handleExistingParticipants);
    socket.on('communityCallOffer', handleOffer);
    socket.on('communityCallAnswer', handleAnswer);
    socket.on('communityCallIceCandidate', handleIceCandidate);
    socket.on('communityCallParticipantLeft', handlePeerDisconnected);
    socket.on('communityCallEnded', handleCallEnded);

    return () => {
      socket.off('communityCallParticipantJoined', handleParticipantJoined);
      socket.off('existingCallParticipants', handleExistingParticipants);
      socket.off('communityCallOffer', handleOffer);
      socket.off('communityCallAnswer', handleAnswer);
      socket.off('communityCallIceCandidate', handleIceCandidate);
      socket.off('communityCallParticipantLeft', handlePeerDisconnected);
      socket.off('communityCallEnded', handleCallEnded);
    };
  }, [socket, isInitialized, localStream, myPeerId, communityId]);

  // Media controls
  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff(!isVideoOff);
    }
  };

  // Get current user info
  const { name: myUsername } = getUserInfo();

  // Prepare all participants for rendering
  const allParticipants = [
    {
      peerId: myPeerId,
      username: myUsername,
      stream: localStream || undefined,
      isLocal: true
    },
    ...Array.from(participants.values()).map(p => ({
      peerId: p.peerId,
      username: p.username,
      stream: p.stream || undefined,
      isLocal: false
    }))
  ]

  // Log participant count for debugging
  console.log('👥 [PARTICIPANTS] Total count:', allParticipants.length);
  console.log('👥 [PARTICIPANTS] Local:', myPeerId, myUsername);
  console.log('👥 [PARTICIPANTS] Remote:', Array.from(participants.keys()));


  return (
    <div className="flex flex-col h-full bg-black/90 p-4 absolute inset-0 z-50">
      {/* Header */}
      <div className="bg-background border-b-[3px] border-foreground p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6" />
            <div>
              <h2 className="font-bold uppercase tracking-wide">{communityName}</h2>
              <p className="text-xs text-muted-foreground uppercase">
                {allParticipants.length} {allParticipants.length === 1 ? 'Participant' : 'Participants'}
              </p>
            </div>
          </div>

          <Button
            onClick={onLeave}
            className="bg-red-600 hover:bg-red-700 text-white border-[3px] border-foreground rounded-none font-bold uppercase"
          >
            Leave Call
          </Button>
        </div>
      </div>

      {/* Video Grid */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-fr">
          {allParticipants.map((participant) => (
            <VideoTile
              key={participant.peerId}
              stream={participant.stream}
              username={participant.username}
              isLocal={participant.isLocal}
              isMuted={participant.isLocal ? isMuted : false}
              isVideoOff={participant.isLocal ? isVideoOff : false}
            />
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="h-20 bg-background border-t-[4px] border-foreground flex items-center justify-center gap-4">
        <Button
          onClick={toggleMute}
          variant={isMuted ? "destructive" : "outline"}
          className="w-14 h-14 rounded-full border-[3px] border-foreground p-0"
        >
          {isMuted ? <MicOff /> : <Mic />}
        </Button>

        {type === 'video' && (
          <Button
            onClick={toggleVideo}
            variant={isVideoOff ? "destructive" : "outline"}
            className="w-14 h-14 rounded-full border-[3px] border-foreground p-0"
          >
            {isVideoOff ? <VideoOff /> : <Video />}
          </Button>
        )}

        <Button
          onClick={onLeave}
          className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 text-white border-[3px] border-foreground p-0"
        >
          <PhoneOff />
        </Button>
      </div>
    </div>
  );
};

export default CommunityCall;