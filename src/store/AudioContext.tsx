"use client";

import { searchResults } from "@/lib/types";
import React, {
  createContext,
  useContext,
  useRef,
  useState,
  useEffect,
  ReactNode,
  useCallback,
  useMemo,
} from "react";
import { toast } from "sonner";
import { useUserContext } from "./userStore";
import { socket } from "../socket";

interface AudioContextType {
  play: (song: searchResults) => void;
  pause: () => void;
  resume: () => void;
  togglePlayPause: () => void;
  mute: () => void;
  unmute: () => void;
  playPrev: () => void;
  playNext: () => void;
  setVolume: (value: number) => void;
  isPlaying: boolean;
  isMuted: boolean;
  seek: (value: number) => void;
  volume: number;
  duration: number;
  progress: number;
  currentSong: searchResults | null;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (context === undefined) {
    throw new Error("useAudio must be used within an AudioProvider");
  }
  return context;
};

interface AudioProviderProps {
  children: ReactNode;
}

export const AudioProvider: React.FC<AudioProviderProps> = ({ children }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [currentSong, setCurrentSong] = useState<searchResults | null>(null);
  const [currentProgress, setProgress] = useState<number>(0);
  const [currentDuration, setDuration] = useState<number>(0);
  const [currentVolume, setVolume] = useState<number>(1);
  const { queue, isConnected, user, listener } = useUserContext();
  const progress = useMemo(() => currentProgress, [currentProgress]);
  const duration = useMemo(() => currentDuration, [currentDuration]);
  const volume = useMemo(() => currentVolume, [currentVolume]);

  // play
  const play = useCallback((song: searchResults) => {
    setCurrentSong(song);
    if (audioRef.current) {
      audioRef.current.src = song.downloadUrl[song.downloadUrl.length - 1].url;
      audioRef.current
        .play()
        .then(async () => {
          setIsPlaying(true);
        })
        .catch(() => {
          console.error("Error playing audio");
        });
    }
  }, []);

  // pause
  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
  }, []);

  // resume
  const resume = useCallback(() => {
    if (audioRef.current && currentSong) {
      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch((error) => {
          console.error("Error resuming audio:", error);
        });
    }
  }, [currentSong]);

  // toggle play/pause
  const togglePlayPause = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      if (currentSong) {
        resume();
      } else {
        toast.warning("No song is currently selected.");
      }
    }
  }, [isPlaying, currentSong, pause, resume]);

  // mute
  const mute = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.muted = true;
      setIsMuted(true);
    }
  }, []);

  // unmute
  const unmute = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.muted = false;
      setIsMuted(false);
    }
  }, []);

  // Set volume
  const handleVolumeChange = (value: number) => {
    if (audioRef.current) {
      audioRef.current.volume = value;
    }
    setVolume(value);
  };

  // seek
  const seek = useCallback(
    (value: number) => {
      if (audioRef.current) {
        if (isConnected) {
          socket.emit("seek", value);
        }
        audioRef.current.currentTime = value;
      }
    },
    [isConnected]
  );

  // Play the next song in the queue
  const playNext = useCallback(() => {
    if (user?.role !== "admin" && listener && listener?.totalUsers > 1) return;
    if (queue && queue.length > 0) {
      const currentIndex = queue.findIndex(
        (song) => song.id === currentSong?.id
      );
      const nextSong =
        currentIndex !== -1 && currentIndex < queue.length - 1
          ? queue[currentIndex + 1] // Play the next song
          : queue[0]; // If at the end, loop to the first song
      play(nextSong);
      if (isConnected) {
        socket.emit("nextSong", { nextSong });
      }
    }
  }, [currentSong?.id, play, queue, isConnected, user, listener]);

  // Play the previous song in the queue
  const playPrev = useCallback(() => {
    if (user?.role !== "admin" && listener && listener?.totalUsers > 1) return;
    if (queue && queue.length > 0) {
      const currentIndex = queue.findIndex(
        (song) => song.id === currentSong?.id
      );
      const prevSong =
        currentIndex > 0
          ? queue[currentIndex - 1] // Play the previous song
          : queue[queue.length - 1]; // If at the start, loop to the last song
      play(prevSong);
      if (isConnected) {
        socket.emit("prevSong", { prevSong });
      }
    }
  }, [currentSong?.id, play, queue, isConnected, user, listener]);

  // Set media session metadata and event handlers
  const setMediaSession = useCallback(() => {
    const handleBlock = () => {
      return;
    };
    if ("mediaSession" in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentSong?.name,
        artist: currentSong?.artists.primary[0].name,
        artwork: currentSong?.image.map((image) => ({
          sizes: image.quality,
          src: image.url,
        })),
      });
      navigator.mediaSession.setActionHandler("play", handleBlock);
      navigator.mediaSession.setActionHandler("pause", handleBlock);
      navigator.mediaSession.setActionHandler("previoustrack", handleBlock);
      navigator.mediaSession.setActionHandler("nexttrack", handleBlock);
      navigator.mediaSession.setActionHandler("seekto", handleBlock);
      navigator.mediaSession.setActionHandler("seekbackward", handleBlock);
      navigator.mediaSession.setActionHandler("seekforward", handleBlock);
    }
  }, [currentSong]);

  useEffect(() => {
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleCanPlay = () => {
      setMediaSession();
    };

    const handleEnd = () => {
      socket.emit("songEnded", currentSong);
    };
    const updateProgress = () => {
      if (audioRef.current) {
        setProgress(audioRef.current.currentTime);
        setDuration(audioRef.current.duration);
      }
    };
    const audioElement = audioRef.current;

    if (audioElement) {
      audioElement.addEventListener("play", handlePlay);
      audioElement.addEventListener("pause", handlePause);
      audioElement.addEventListener("ended", handleEnd);
      audioElement.addEventListener("canplay", handleCanPlay);
      audioElement.addEventListener("timeupdate", updateProgress);
      return () => {
        audioElement.removeEventListener("play", handlePlay);
        audioElement.removeEventListener("pause", handlePause);
        audioElement.removeEventListener("ended", handleEnd);
        audioElement.removeEventListener("canplay", handleCanPlay);
        audioElement.removeEventListener("timeupdate", updateProgress);
      };
    }
  }, [setMediaSession, currentSong, play, queue, playNext]);
  useEffect(() => {
    if (!currentSong && queue.length > 0) {
      play(queue[0]);
    }
  }, [queue, play, currentSong]);
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === " " &&
        !(
          e.target instanceof HTMLInputElement ||
          e.target instanceof HTMLTextAreaElement
        )
      ) {
        e.preventDefault();
        togglePlayPause();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [togglePlayPause]);
  return (
    <AudioContext.Provider
      value={{
        play,
        pause,
        resume,
        togglePlayPause,
        mute,
        unmute,
        setVolume: handleVolumeChange, // Add the volume setter to the context
        isPlaying,
        isMuted,
        volume,
        currentSong,
        progress,
        playPrev,
        playNext,
        seek,
        duration,
      }}
    >
      {children}
      <audio ref={audioRef} hidden />
    </AudioContext.Provider>
  );
};
