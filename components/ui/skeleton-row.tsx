import { cn } from "@/lib/utils";

interface SkeletonRowProps {
  columns?: number;
  rows?: number;
  className?: string;
}

const widths = ["w-1/4", "w-1/3", "w-1/5", "w-2/5", "w-1/6", "w-1/2", "w-1/4"];

export function SkeletonRow({
  columns = 5,
  rows = 5,
  className,
}: SkeletonRowProps) {
  return (
    <>
      {Array.from({ length: rows }).map((_, ri) => (
        <tr key={ri} className={cn("border-b border-border", className)}>
          {Array.from({ length: columns }).map((_, ci) => (
            <td key={ci} className="px-4 py-3">
              <div
                className={cn(
                  "h-4 rounded-md bg-muted animate-pulse",
                  widths[(ri + ci) % widths.length]
                )}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
