export abstract class SessionStorePort {
  abstract getLocalItem(key: string): string | null;
  abstract setLocalItem(key: string, value: string): void;
  abstract removeLocalItem(key: string): void;

  abstract getSessionItem(key: string): string | null;
  abstract setSessionItem(key: string, value: string): void;
  abstract removeSessionItem(key: string): void;
}
