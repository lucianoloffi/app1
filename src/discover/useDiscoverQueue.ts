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
    if (profile.age < filters.minAge || profile.age > filters.maxAge) return false;
    if (filters.interestedIn !== "outros" && profile.gender !== filters.interestedIn) return false;
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

  /** Toca a saída do card atual e, ao final, avança a fila. */
  function completeAdvance() {
    isAnimating.current = true;
    setSwipeDirection("left");
    window.setTimeout(() => {
      setQueue((prev) => prev.slice(1));
      setPhotoIndex(0);
      setSwipeDirection(null);
      setSeenCount((prev) => prev + 1);
      isAnimating.current = false;
    }, SWIPE_ANIMATION_MS);
  }

  function advance(direction: "left" | "right") {
    if (isAnimating.current || !current) return;
    const liked = direction === "right";

    if (liked && current.likesYou) {
      // Deu match: o card fica parado atrás do overlay, sem avançar a fila ainda.
      setMatchProfile(current);
      onMatch?.(current);
      return;
    }

    completeAdvance();
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
    dismissMatch: () => {
      if (!matchProfile) return;
      setMatchProfile(null);
      completeAdvance();
    },
    resetQueue: () => {
      setQueue(filteredProfiles);
      setPhotoIndex(0);
    },
  };
}
