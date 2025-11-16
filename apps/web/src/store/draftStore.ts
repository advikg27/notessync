import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Draft {
  id: string;
  title: string;
  type: string;
  content: string;
  courseId: string;
  tags: string[];
  timestamp: number;
}

interface DraftState {
  drafts: Map<string, Draft>;
  saveDraft: (id: string, draft: Omit<Draft, 'id' | 'timestamp'>) => void;
  getDraft: (id: string) => Draft | undefined;
  deleteDraft: (id: string) => void;
  getAllDrafts: () => Draft[];
}

export const useDraftStore = create<DraftState>()(
  persist(
    (set, get) => ({
      drafts: new Map(),
      saveDraft: (id, draft) =>
        set((state) => {
          const newDrafts = new Map(state.drafts);
          newDrafts.set(id, {
            id,
            ...draft,
            timestamp: Date.now(),
          });
          return { drafts: newDrafts };
        }),
      getDraft: (id) => get().drafts.get(id),
      deleteDraft: (id) =>
        set((state) => {
          const newDrafts = new Map(state.drafts);
          newDrafts.delete(id);
          return { drafts: newDrafts };
        }),
      getAllDrafts: () => Array.from(get().drafts.values()),
    }),
    {
      name: 'draft-storage',
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          const { state } = JSON.parse(str);
          return {
            state: {
              ...state,
              drafts: new Map(state.drafts),
            },
          };
        },
        setItem: (name, value) => {
          const str = JSON.stringify({
            state: {
              ...value.state,
              drafts: Array.from(value.state.drafts.entries()),
            },
          });
          localStorage.setItem(name, str);
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
    }
  )
);

