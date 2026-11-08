import { isPreview, previewMayPersist } from "@/lib/env";

/** On a preview deployment (lib/env.ts): a strip on every page that says this is a test copy, so nobody mistakes it for the club's site. */
export function PreviewBanner() {
  if (!isPreview()) return null;
  return (
    <div role="status" className="fixed inset-x-0 bottom-0 z-[100] bg-[#b45309] px-4 py-1.5 text-center text-[13px] font-medium text-white">
      Testkopi av nettsiden. {previewMayPersist() ? "Endringer lagres i testdatabasen." : "Endringer lagres ikke, og det sendes ingen e-post."}
    </div>
  );
}
