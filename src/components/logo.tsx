import { ACTIVE_CONCEPT } from "@/lib/brand";

// Uses the active concept from the Brand lab. Swap ACTIVE_CONCEPT in src/lib/brand.ts to change it site-wide.
export function Logo({ dark = false, size = "md" }: { dark?: boolean; size?: "md" | "lg" }) {
  const file = `/brand/logos/${ACTIVE_CONCEPT.file}-lockup${dark ? "-dark" : ""}.svg`;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={file} alt="RockLeak" className={size === "lg" ? "h-16 w-auto md:h-20" : "h-12 w-auto"} />
  );
}
