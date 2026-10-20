import { ACTIVE_CONCEPT } from "@/lib/brand";

// Uses the active concept from the Brand lab. Swap ACTIVE_CONCEPT in src/lib/brand.ts to change it site-wide.
export function Logo({ dark = false }: { dark?: boolean }) {
  const file = `/brand/logos/${ACTIVE_CONCEPT.file}-lockup${dark ? "-dark" : ""}.svg`;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={file} alt="RockLeak" className="h-11 w-auto md:h-12" />;
}
