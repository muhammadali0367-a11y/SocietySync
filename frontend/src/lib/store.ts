"use client";

// Simple society context - stores the active society ID
const SOCIETY_KEY = "societysync_active_society";

export function getActiveSocietyId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(SOCIETY_KEY);
}

export function setActiveSocietyId(id: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SOCIETY_KEY, id);
}
