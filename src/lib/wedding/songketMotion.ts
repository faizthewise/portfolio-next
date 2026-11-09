/** Decorative enhancement only: absent browser APIs leave complete static art. */
export function observeSongketMotion(
  element: HTMLElement,
  kind: "ambient" | "stitch"
) {
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (motion.matches || !("IntersectionObserver" in window))
    return () => undefined;
  let visible = false;
  let played = false;
  let complete = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const finish = () => {
    complete = true;
    clearTimeout(timer);
    element.dataset.motion = "complete";
  };
  const update = () => {
    const active = visible && !document.hidden && !motion.matches;
    if (kind === "ambient") {
      element.dataset.active = String(active);
      if (motion.matches) delete element.dataset.motion;
      else element.dataset.motion = "ambient";
    } else if (!complete) {
      if (motion.matches || (played && !active)) finish();
      else if (active && !played) {
        played = true;
        element.dataset.motion = "stitch";
        // A missed animationend must never leave an incomplete decoration.
        timer = setTimeout(finish, 3200);
      }
    }
  };
  const observer = new IntersectionObserver(
    (entries) => {
      visible = entries.some((entry) => entry.isIntersecting);
      update();
    },
    { threshold: 0.15 }
  );
  element.dataset.motion = kind === "stitch" ? "waiting" : "ambient";
  element.dataset.active = "false";
  observer.observe(element);
  const animationEnd = (event: AnimationEvent) => {
    if (
      kind === "stitch" &&
      (event.target as Element).hasAttribute("data-finish")
    )
      finish();
  };
  document.addEventListener("visibilitychange", update);
  motion.addEventListener("change", update);
  element.addEventListener("animationend", animationEnd);
  return () => {
    observer.disconnect();
    clearTimeout(timer);
    document.removeEventListener("visibilitychange", update);
    motion.removeEventListener("change", update);
    element.removeEventListener("animationend", animationEnd);
    delete element.dataset.motion;
    delete element.dataset.active;
  };
}
