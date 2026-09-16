import { WEEKDAY_LABELS } from "@/lib/weeks";

type Props = {
  days: string[]; // 월~토 6일 (YYYY-MM-DD)
  attendedDays: string[];
  todayStr?: string;
  size?: "sm" | "lg";
};

export default function StampRow({ days, attendedDays, todayStr, size = "lg" }: Props) {
  const attendedSet = new Set(attendedDays);
  const dim = size === "lg" ? "w-full" : "w-full";
  const textSize = size === "lg" ? "text-[1.05rem]" : "text-xs";

  return (
    <div className="grid grid-cols-6 gap-1.5 sm:gap-2.5">
      {days.map((d, i) => {
        const done = attendedSet.has(d);
        const isToday = d === todayStr;
        return (
          <div key={d} className="flex flex-col items-center gap-1.5">
            <span className="text-[0.7rem] font-bold text-[var(--color-ink-soft)]">
              {WEEKDAY_LABELS[i]}
            </span>
            <div
              className={[
                dim,
                "stamp",
                textSize,
                done ? "stamp-done" : isToday ? "stamp-today-pending" : "stamp-empty",
              ].join(" ")}
            >
              {done ? "✓" : isToday ? "●" : ""}
            </div>
          </div>
        );
      })}
    </div>
  );
}
