"use client";

import { useEffect, useRef } from "react";

type VideoLoopProps = {
  src: string;
  poster?: string;
  className?: string;
};

export function VideoLoop({ src, poster, className }: VideoLoopProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const restart = () => {
      video.currentTime = 0;
      void video.play();
    };

    video.addEventListener("ended", restart);
    return () => video.removeEventListener("ended", restart);
  }, []);

  return (
    <video
      ref={videoRef}
      src={src}
      poster={poster}
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      controls={false}
      disablePictureInPicture
      className={className}
    />
  );
}
