import { Skeleton } from "@/components/ui/skeleton";

export function SettingsSkeleton() {
  return (
    <div className="flex flex-col gap-3 px-4 py-3">
      {Array.from({ length: 4 }, (_, index) => (
        <section
          key={index}
          className="flex flex-col gap-3 rounded-lg border border-border bg-muted/50 p-3"
        >
          <Skeleton className="h-2.5 w-24" />
          <div className="flex flex-col gap-2.5">
            <div className="flex min-h-9 items-center justify-between gap-3">
              <Skeleton className="h-3.5 w-28" />
              <Skeleton className="h-7 w-16 rounded-md" />
            </div>
            <div className="flex min-h-9 items-center justify-between gap-3">
              <Skeleton className="h-3.5 w-36" />
              <Skeleton className="h-5 w-10 rounded-full" />
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}
