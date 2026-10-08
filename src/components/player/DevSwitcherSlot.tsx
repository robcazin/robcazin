import dynamic from "next/dynamic";

const DevVisualizerSwitcher = dynamic(
  () => import("./DevVisualizerSwitcher")
);

/** Dropped from production renders. The dynamic import is dev-only. */
export default function DevSwitcherSlot() {
  if (process.env.NODE_ENV !== "development") return null;
  return <DevVisualizerSwitcher />;
}
