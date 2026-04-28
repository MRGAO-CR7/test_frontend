'use client';

import { create } from 'zustand';

/**
 * In-memory toast queue.
 *
 * Imperative API (`toast.success(...)`) is intentionally available outside
 * React so non-component code (axios interceptors, broadcast handlers, etc.)
 * can fire toasts without prop-drilling. Components read the queue via
 * `useToastStore` and the `<Toaster />` portal renders it.
 */

export type ToastTone = 'success' | 'error' | 'info';

export interface ToastItem {
  id: string;
  tone: ToastTone;
  title: string;
  description?: string;
  /** ms before auto-dismiss; 0 = sticky. Default 4500. */
  duration: number;
}

export type ToastInput = {
  tone: ToastTone;
  title: string;
  description?: string;
  duration?: number;
};

interface ToastState {
  items: ToastItem[];
  push: (input: ToastInput) => string;
  dismiss: (id: string) => void;
  clear: () => void;
}

function makeId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `t_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export const useToastStore = create<ToastState>((set) => ({
  items: [],
  push: (input) => {
    const item: ToastItem = {
      id: makeId(),
      duration: 4500,
      ...input,
    };
    set((s) => ({ items: [...s.items, item] }));
    return item.id;
  },
  dismiss: (id) => set((s) => ({ items: s.items.filter((t) => t.id !== id) })),
  clear: () => set({ items: [] }),
}));

/**
 * Convenience facade. Call from anywhere (component code, axios interceptor,
 * broadcast handler — even SSR-safe; the no-op falls through to nothing
 * visible because the store starts empty server-side and the <Toaster /> only
 * renders client-side).
 */
export const toast = {
  success: (title: string, description?: string, duration?: number) =>
    useToastStore.getState().push({ tone: 'success', title, description, duration }),
  error: (title: string, description?: string, duration?: number) =>
    useToastStore.getState().push({ tone: 'error', title, description, duration }),
  info: (title: string, description?: string, duration?: number) =>
    useToastStore.getState().push({ tone: 'info', title, description, duration }),
  dismiss: (id: string) => useToastStore.getState().dismiss(id),
  clear: () => useToastStore.getState().clear(),
};
