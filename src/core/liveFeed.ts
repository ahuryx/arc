export type FeedStatus = "connecting" | "live" | "error";

export interface LiveFeedSnapshot<T> {
  data: T;
  status: FeedStatus;
  error: string | null;
  ts: number;
}

export interface LiveFeed<T> {
  getSnapshot(): LiveFeedSnapshot<T>;
  subscribe(listener: (snapshot: LiveFeedSnapshot<T>) => void): () => void;
  start(): void;
  stop(): void;
  refresh(): Promise<void>;
}

interface CreatePollingFeedOptions<T> {
  intervalMs: number;
  fetch: () => Promise<T>;
  initial: T;
}

/** Deep polling feed: callers only need subscribe/snapshot. */
export function createPollingFeed<T>(
  options: CreatePollingFeedOptions<T>,
): LiveFeed<T> {
  const listeners = new Set<(snapshot: LiveFeedSnapshot<T>) => void>();
  let snapshot: LiveFeedSnapshot<T> = {
    data: options.initial,
    status: "connecting",
    error: null,
    ts: 0,
  };
  let timer: number | null = null;
  let inFlight = false;

  function emit(): void {
    for (const listener of listeners) {
      listener(snapshot);
    }
  }

  async function refresh(): Promise<void> {
    if (inFlight) {
      return;
    }
    inFlight = true;
    try {
      const data = await options.fetch();
      snapshot = {
        data,
        status: "live",
        error: null,
        ts: Date.now(),
      };
      emit();
    } catch (error) {
      snapshot = {
        ...snapshot,
        status: "error",
        error: error instanceof Error ? error.message : String(error),
        ts: Date.now(),
      };
      emit();
    } finally {
      inFlight = false;
    }
  }

  return {
    getSnapshot: () => snapshot,
    subscribe(listener) {
      listeners.add(listener);
      listener(snapshot);
      return () => {
        listeners.delete(listener);
      };
    },
    start() {
      if (timer != null) {
        return;
      }
      void refresh();
      timer = window.setInterval(() => {
        void refresh();
      }, options.intervalMs);
    },
    stop() {
      if (timer != null) {
        window.clearInterval(timer);
        timer = null;
      }
    },
    refresh,
  };
}
