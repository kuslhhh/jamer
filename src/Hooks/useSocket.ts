"use client";

import { socket } from "@/app/socket";
import { useAudio } from "@/app/store/AudioContext";
import { useUserContext } from "@/app/store/userStore";
import { listener, searchResults, TUser, upvVotes } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useRef } from "react";
import { toast } from "sonner";

export default function useSocket() {
  const { isConnected, setIsConnected } = useUserContext();
  const [transport, setTransport] = useState("N/A");
  const { setListener, setUser, setQueue, user, setUpVotes } = useUserContext();
  const { play, seek } = useAudio();
  const router = useRouter();
  const socketRef = useRef(socket);

  const onConnect = useCallback(async () => {
    try {
      setIsConnected(true);
      setTransport(socketRef.current.io.engine.transport.name);
    } catch (error) {
      toast.error("Failed to connect");
    }

    socketRef.current.io.engine.on("upgrade", (transport) => {
      setTransport(transport.name);
    });
  }, [setIsConnected]);

  const onDisconnect = useCallback(() => {
    setIsConnected(false);
    setTransport("N/A");
  }, [setIsConnected]);

  useEffect(() => {
    const currentSocket = socketRef.current;
    if (currentSocket.connected) {
      onConnect();
    }
    const handleNextSong = (nextSong: searchResults) => play(nextSong);
    const handlePrevSong = (prevSong: searchResults) => play(prevSong);

    currentSocket.on("connect", onConnect);
    currentSocket.on("disconnect", onDisconnect);

    currentSocket.on("nextSong", handleNextSong);
    currentSocket.on("prevSong", handlePrevSong);

    currentSocket.on("joinedRoom", ({ user }: { user: TUser }) => {
      setUser(user);
    });

    currentSocket.on("songQueue", (data: searchResults[]) => {
      if (data) {
        setQueue(data);
      }
    });
    currentSocket.on(
      "songEnded",
      (data?: {
        play?: searchResults;
        queue?: searchResults[];
        votes?: upvVotes[];
      }) => {
        if (data?.play) {
          play(data.play);
        }
        if (data?.queue) {
          setQueue(data.queue);
        }
        if (data?.votes) {
          setUpVotes(data.votes);
        }
      }
    );

    currentSocket.on("roomList", async (data?: listener) => {
      if (data) {
        setListener(data);
      }
    });

    currentSocket.on("getVotes", () => {
      socket.emit("upVote");
    });

    currentSocket.on(
      "votes",
      async (data?: { votes: upvVotes[]; queue: searchResults[] }) => {
        if (data?.votes) {
          setUpVotes(data.votes);
        }
        if (data?.queue) {
          setQueue(data.queue);
        }
      }
    );

    currentSocket.on("userJoinedRoom", async ({ user }: { user: TUser }) => {
      toast(`${user.username} has joined`);
    });

    currentSocket.on("userLeftRoom", async (user: TUser) => {
      toast(`${user.username} left `, {
        style: { backgroundColor: "#e94225" },
      });
    });

    currentSocket.on(
      "seek",
      (data: { seek: number; role: string; userId: string }) => {
        if (data.role == "admin" && data.userId == user?._id) return;
        seek(data.seek);
      }
    );

    currentSocket.on("error", (message: string) => {
      toast.error(message, {
        style: { background: "#e94625" },
      });
    });
    currentSocket.on("connect_error", (error: any) => {
      toast.error(error?.message || "Something went wrong", {
        style: { background: "#e94625" },
      });
    });
    return () => {
      currentSocket.off("connect_error");
      currentSocket.off("connect", onConnect);
      currentSocket.off("disconnect", onDisconnect);
      currentSocket.off("nextSong", handleNextSong);
      currentSocket.off("prevSong", handlePrevSong);
      currentSocket.off("joinedRoom");
      currentSocket.off("userJoinedRoom");
      currentSocket.off("error");
      currentSocket.off("songQueue");
      currentSocket.off("userLeftRoom");
      currentSocket.off("update");
      currentSocket.off("seek");
    };
  }, [
    onConnect,
    onDisconnect,
    play,
    router,
    setUser,
    setListener,
    setQueue,
    seek,
    user?._id,
    setUpVotes,
  ]);

  return {
    isConnected,
    transport,
  };
}
