import { useRef, useState } from "react";
import { mockProfiles } from "../data/mockProfiles";
import type { Profile, SwipeDirection } from "../types";

const SWIPE_ANIMATION_MS = 240;

export function useDiscoverQueue() {
  const [queue, setQueue] = useState<Profile[]>(mockProfiles);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [swipeDirection, setSwipeDirection] = useState<SwipeDirection>(null);
  const [matchProfile, setMatchProfile] = useState<Profile | null>(null);
  const isAnimating = useRef(false);

  const current = queue[0] ?? null;

  function nextPhoto() {
    if (!current) return;
    setPhotoIndex((prev) => (prev + 1) % current.photos.length);
  }

  function advance(direction: "left" | "right") {
    if (isAnimating.current || !current) return;
    isAnimating.current = true;
    setSwipeDirection(direction);
    const liked = direction === "right";
    const likedProfile = current;
    window.setTimeout(() => {
      setQueue((prev) => prev.slice(1));
      setPhotoIndex(0);
      setSwipeDirection(null);
      isAnimating.current = false;
      if (liked && likedProfile.likesYou) {
        setMatchProfile(likedProfile);
      }
    }, SWIPE_ANIMATION_MS);
  }

  return {
    current,
    photoIndex,
    swipeDirection,
    matchProfile,
    nextPhoto,
    like: () => advance("right"),
    dislike: () => advance("left"),
    dismissMatch: () => setMatchProfile(null),
    resetQueue: () => {
      setQueue(mockProfiles);
      setPhotoIndex(0);
    },
  };
}
