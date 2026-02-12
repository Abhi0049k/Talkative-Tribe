import { useEffect, useRef } from 'react';

export interface VideoTileProps {
  stream?: MediaStream;
  username: string;
  isLocal?: boolean;
  isMuted?: boolean;
  isVideoOff?: boolean;
  // isActive?: boolean; // Not used currently
}

const VideoTile = ({
  stream,
  username,
  isLocal = false,
  isMuted = false,
  isVideoOff = false
}: VideoTileProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Attach stream to video/audio elements
  useEffect(() => {
    if (stream && videoRef.current) {
      // console.log("📺 VideoTile: Assigning stream to video", stream.id);
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  useEffect(() => {
    if (stream && audioRef.current && !isLocal) {
      audioRef.current.srcObject = stream;
      audioRef.current.play().catch(e => console.log("Audio autoplay error:", e));
    }
  }, [stream, isLocal]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (videoRef.current) videoRef.current.srcObject = null;
      if (audioRef.current) audioRef.current.srcObject = null;
    };
  }, []);

  // Always use the actual username (no "You" label)
  const displayName = username;

  const hasVideo = stream && stream.getVideoTracks().length > 0;
  const showVideo = hasVideo && !isVideoOff;

  // Determine mirroring logic (Render-safe)
  const videoTrack = stream?.getVideoTracks()[0];
  const settings = videoTrack?.getSettings();
  const facingMode = settings?.facingMode;

  // Mirror if Local AND (Front Camera OR Unknown/Desktop). 
  // Do NOT mirror Back Camera ('environment').
  // Do NOT mirror Remote streams.
  const shouldMirror = isLocal && (facingMode === 'user' || !facingMode);

  // Log settings for debugging orientation issues
  useEffect(() => {
    if (stream && isLocal) {
      // Re-derive for effect stability
      const track = stream.getVideoTracks()[0];
      const s = track?.getSettings();
      const fMode = s?.facingMode;
      const isMirrored = fMode === 'user' || !fMode;

      console.log(`🎥 [Local Video] Settings:`, s);
      console.log(`🪞 Mirroring applied: ${isMirrored ? 'YES' : 'NO'} (Mode: ${fMode || 'unknown'})`);
    }
  }, [stream, isLocal]);

  return (
    <div className="aspect-video bg-muted border-[3px] border-white relative overflow-hidden group">
      {/* Video Element */}
      {showVideo ? (
        <video
          ref={videoRef}
          autoPlay
          muted={isLocal}
          playsInline
          // Explicitly control transform via style to ensure cross-browser consistency
          // and override any inherited transforms.
          style={{
            transform: shouldMirror ? 'scaleX(-1)' : 'none',
            WebkitTransform: shouldMirror ? 'scaleX(-1)' : 'none'
          }}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-zinc-800">
          <div className="text-center">
            <div className="w-16 h-16 bg-foreground text-background rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-2xl font-bold">
                {displayName.charAt(0).toUpperCase()}
              </span>
            </div>
            <span className="text-white font-bold uppercase">
              {isVideoOff ? 'Camera Off' : displayName}
            </span>
          </div>
        </div>
      )}

      {/* Audio Element for remote users */}
      {!isLocal && <audio ref={audioRef} className="hidden" />}

      {/* User Label and Status */}
      <div className="absolute bottom-2 left-2 bg-black/80 text-white text-xs font-bold px-2 py-1 rounded backdrop-blur-sm">
        <div>{displayName}</div>
        {isMuted && <div className="text-red-400">🎤 Muted</div>}
      </div>

      {/* Active Speaking Indicator */}
      {/* {isActive && !isMuted && (
        <div className="absolute top-2 right-2 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
      )} */}
    </div>
  );
};

export default VideoTile;