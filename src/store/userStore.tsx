"use client";
import { listener, searchResults, TUser, upvVotes } from "@/lib/types";
import { generateRoomId, setCookie } from "@/utils/utils";
import { useRouter, useSearchParams } from "next/navigation";
import React, {
  createContext,
  ReactNode,
  SetStateAction,
  useContext,
  useEffect,
  useState,
} from "react";
import { socket } from "../socket";

interface UserContextType {
  queue: searchResults[];
  setQueue: React.Dispatch<SetStateAction<searchResults[]>>;
  roomId: string | null;
  setRoomId: React.Dispatch<SetStateAction<string>>;
  isConnected: boolean;
  setIsConnected: React.Dispatch<SetStateAction<boolean>>;
  user: TUser | null;
  setUser: React.Dispatch<SetStateAction<TUser | null>>;
  setListener: React.Dispatch<SetStateAction<listener | null>>;
  listener: listener | null;
  upVotes: upvVotes[];
  setUpVotes: React.Dispatch<SetStateAction<upvVotes[]>>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const search = useSearchParams();
  const router = useRouter();
  const [isConnected, setIsConnected] = useState<boolean>(socket.connected);
  const [queue, setQueue] = React.useState<searchResults[]>([]);
  const [upVotes, setUpVotes] = React.useState<upvVotes[]>([]);
  const [user, setUser] = React.useState<TUser | null>(null);
  const [listener, setListener] = React.useState<listener | null>(null);
  const [roomId, setRoomId] = React.useState<string>(
    () => search.get("room") || generateRoomId()
  );

  useEffect(() => {
    router.push(`/v?room=${roomId}`);
    setCookie("room", roomId);

    if (roomId && socket.disconnected) {
      socket.connect();
      socket.emit("addToQueue");
      socket.emit("upVote");
    }
  }, [roomId, router]);

  return (
    <UserContext.Provider
      value={{
        queue,
        setQueue,
        roomId,
        setRoomId,
        setIsConnected,
        isConnected,
        user,
        setUser,
        listener,
        setListener,
        upVotes,
        setUpVotes,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

const useUserContext = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUserContext must be used within a UserProvider");
  }
  return context;
};

export { UserProvider, useUserContext };
