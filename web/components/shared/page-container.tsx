import { cn } from "@/lib/utils";

interface PageContainerProps {
  children: React.ReactNode;
  /** Additional classes merged onto the container div */
  className?: string;
  /** Use a narrower max-width (max-w-5xl) for form/detail pages */
  narrow?: boolean;
}

/**
 * Consistent max-width page container used on every page.
 * Ensures content width doesn't vary page to page.
 *
 * Default: max-w-7xl (1280px) — dashboards, listings, data-dense pages
 * Narrow:  max-w-5xl (1024px) — forms, detail views, focused content
 */
export function PageContainer({
  children,
  className,
  narrow = false,
}: PageContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-4 sm:px-6 lg:px-8",
        narrow ? "max-w-5xl" : "max-w-7xl",
        className
      )}
    >
      {children}
    </div>
  );
}
