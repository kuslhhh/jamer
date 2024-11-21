"use client";
import { useAudio } from "@/app/store/AudioContext";
import React from "react";

function Background() {
  const { currentSong } = useAudio();
  return (
    <div
      style={{
        backgroundImage: `url('${
          currentSong?.image[currentSong?.image?.length - 1]?.url ||
          "/cache.jpg"
        }' ) `,
      }}
      className="h-dvh  relative hidden bg-cover transition-all duration-700 bg-center overflow-hidden md:flex flex-col items-center justify-center py-4 w-full"
    />
  );
}

export default Background;
