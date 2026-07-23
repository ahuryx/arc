import { useEffect, useReducer } from "react";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useAppState } from "@/core/useAppState";
import { cn } from "@/lib/utils";

type Phase = "work" | "short" | "long";

interface TimerState {
  phase: Phase;
  remaining: number;
  running: boolean;
  completed: number;
}

type TimerAction =
  | { type: "tick"; work: number; short: number; long: number }
  | { type: "toggle" }
  | { type: "reset"; work: number }
  | { type: "setPhase"; phase: Phase; seconds: number }
  | { type: "syncDuration"; seconds: number };

function reducer(state: TimerState, action: TimerAction): TimerState {
  switch (action.type) {
    case "toggle":
      return { ...state, running: !state.running };
    case "reset":
      return {
        phase: "work",
        remaining: action.work,
        running: false,
        completed: state.completed,
      };
    case "setPhase":
      return {
        ...state,
        phase: action.phase,
        remaining: action.seconds,
        running: false,
      };
    case "syncDuration":
      if (state.running || state.remaining === action.seconds) return state;
      return { ...state, remaining: action.seconds };
    case "tick": {
      if (!state.running) return state;
      if (state.remaining > 1) {
        return { ...state, remaining: state.remaining - 1 };
      }
      if (state.phase === "work") {
        const nextCompleted = state.completed + 1;
        const longBreak = nextCompleted % 4 === 0;
        return {
          phase: longBreak ? "long" : "short",
          remaining: (longBreak ? action.long : action.short) * 60,
          running: true,
          completed: nextCompleted,
        };
      }
      return {
        phase: "work",
        remaining: action.work * 60,
        running: true,
        completed: state.completed,
      };
    }
    default:
      return state;
  }
}

function formatCountdown(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

/** Local countdown — no package needed for a simple phase timer. */
export function PomodoroWidget() {
  const { data } = useAppState();
  const { work, short, long } = data.pomodoro;
  const [state, dispatch] = useReducer(reducer, {
    phase: "work" as Phase,
    remaining: work * 60,
    running: false,
    completed: 0,
  });

  useEffect(() => {
    if (!state.running) return;
    const id = window.setInterval(
      () => dispatch({ type: "tick", work, short, long }),
      1000,
    );
    return () => window.clearInterval(id);
  }, [state.running, work, short, long]);

  useEffect(() => {
    if (state.running) return;
    const mins =
      state.phase === "work" ? work : state.phase === "short" ? short : long;
    dispatch({ type: "syncDuration", seconds: mins * 60 });
  }, [work, short, long, state.phase, state.running]);

  return (
    <div className="flex h-full flex-col items-center justify-between gap-3 px-4 py-4">
      <ToggleGroup
        type="single"
        size="sm"
        className="w-full"
        value={state.phase}
        onValueChange={(value) => {
          if (value === "work" || value === "short" || value === "long") {
            const mins = value === "work" ? work : value === "short" ? short : long;
            dispatch({ type: "setPhase", phase: value, seconds: mins * 60 });
          }
        }}
      >
        <ToggleGroupItem value="work" className="flex-1">
          Focus
        </ToggleGroupItem>
        <ToggleGroupItem value="short" className="flex-1">
          Short
        </ToggleGroupItem>
        <ToggleGroupItem value="long" className="flex-1">
          Long
        </ToggleGroupItem>
      </ToggleGroup>

      <div className="flex flex-col items-center gap-2.5">
        <div className="text-[44px] font-extralight leading-none tracking-tight text-foreground tabular-nums">
          {formatCountdown(state.remaining)}
        </div>
        <div className="flex gap-1.5">
          {Array.from({ length: 4 }, (_, i) => (
            <span
              key={i}
              className={cn(
                "size-1.5 rounded-full",
                i < state.completed % 4 ? "bg-foreground/80" : "bg-foreground/20",
              )}
            />
          ))}
        </div>
      </div>

      <div className="flex w-full gap-2">
        <Button
          type="button"
          variant="default"
          className="flex-1"
          onClick={() => dispatch({ type: "toggle" })}
        >
          {state.running ? "Pause" : "Start"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => dispatch({ type: "reset", work: work * 60 })}
        >
          Reset
        </Button>
      </div>
    </div>
  );
}
