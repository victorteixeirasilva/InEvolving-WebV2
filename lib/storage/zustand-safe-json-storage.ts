import { createJSONStorage } from "zustand/middleware";

function safeLocalStorageLike() {
  if (typeof window === "undefined") {
    return {
      getItem: (): null => null,
      setItem: (): void => {},
      removeItem: (): void => {},
    };
  }
  const ls = window.localStorage;
  return {
    getItem: (name: string): string | null => {
      try {
        const str = ls.getItem(name);
        if (str === null) return null;
        JSON.parse(str);
        return str;
      } catch {
        try {
          ls.removeItem(name);
        } catch {
          /* ignore */
        }
        return null;
      }
    },
    setItem: (name: string, value: string): void => {
      try {
        ls.setItem(name, value);
      } catch {
        /* quota / private mode */
      }
    },
    removeItem: (name: string): void => {
      try {
        ls.removeItem(name);
      } catch {
        /* ignore */
      }
    },
  };
}

/** `persist` com tolerância a JSON corrompido no `localStorage` (evita tela branca na hidratação). */
export const browserSafeJSONStorage = createJSONStorage(safeLocalStorageLike);
