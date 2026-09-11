import { useMemo, useRef, useState } from "react";
import { mockProfiles } from "../data/mockProfiles";
import type { Filters, Profile, SwipeDirection } from "../types";

const SWIPE_ANIMATION_MS = 240;

interface UseDiscoverQueueOptions {
  onMatch?: (profile: Profile) => void;
  filters?: Filters;
}

function applyFilters(profiles: Profile[], filters?: Filters): Profile[] {
  if (!filters) return profiles;
  return profiles.filter((profile) => {
    if (filters.intention !== "todas" && profile.intention !== filters.intention) return false;
    if (profile.distanceKm > filters.distanceKm) return false;
    return true;
  });
}

export function useDiscoverQueue({ onMatch, filters }: UseDiscoverQueueOptions = {}) {
  const filteredProfiles = useMemo(() => applyFilters(mockProfiles, filters), [filters]);
  const [queue, setQueue] = useState<Profile[]>(filteredProfiles);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [swipeDirection, setSwipeDirection] = useState<SwipeDirection>(null);
  const [matchProfile, setMatchProfile] = useState<Profile | null>(null);
  const [seenCount, setSeenCount] = useState(0);
  const isAnimating = useRef(false);

  const [appliedFilters, setAppliedFilters] = useState(filteredProfiles);
  if (appliedFilters !== filteredProfiles) {
    setAppliedFilters(filteredProfiles);
    setQueue(filteredProfiles);
    setPhotoIndex(0);
  }

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
      setSeenCount((prev) => prev + 1);
      isAnimating.current = false;
      if (liked && likedProfile.likesYou) {
        setMatchProfile(likedProfile);
        onMatch?.(likedProfile);
      }
    }, SWIPE_ANIMATION_MS);
  }

  return {
    current,
    photoIndex,
    swipeDirection,
    matchProfile,
    seenCount,
    nextPhoto,
    like: () => advance("right"),
    dislike: () => advance("left"),
    dismissMatch: () => setMatchProfile(null),
    resetQueue: () => {
      setQueue(filteredProfiles);
      setPhotoIndex(0);
    },
  };
}
