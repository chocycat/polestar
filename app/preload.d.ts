export interface Electron {
  onEvent: <T = unknown>(ev: string, cb: (...args: T) => void) => void;
  cmd: (str: string) => void;
  spawn: (cmd: string, args?: string[]) => void;
  screen: number;
  expandHeight: (height: number) => void;
  hide: () => void;
  pollAudioStats: () => void;
  pollSystemStats: () => Promise<{ cpu: number; mem: number; disk: number }>;
  pollApps: () => Promise<ApplicationEntry[]>;
  dictionary: (query: string, limit?: number) => Promise<{ id: string; title: string; entry: string; distance: string; }[]>,
  resolveIcon: (name: string, size?: number) => Promise<string | null>,
  clipboard: {
    write: (data: string) => void;
  },
  notification: {
    invokeAction: (id: number, actionId: number) => void;
    close: (id: number, reason: number) => void;
  };
  setIgnoreMouseEvents: (state: boolean) => void;
}

declare global {
  interface Window {
    $electron: Electron;
  }
}
