import { BrandMark } from "@/components/kit/brand";

/** A bracket joining into one line: the tournament tree. */
export function Logo({ wordmark = true, className }: { wordmark?: boolean; className?: string }) {
  return (
    <BrandMark name="EventForge" wordmark={wordmark} className={className}>
      <path d="M4 5h5v6H4M4 19h5v-6M9 8h4v8H9M13 12h7" />
    </BrandMark>
  );
}
