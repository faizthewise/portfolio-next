/** A gate must be decoded before activation; the renderer never changes afterward. */
export function createGateRenderer() {
  const decoded = new Set<HTMLImageElement>();
  let disposed = false;
  let selected: boolean | undefined;
  return {
    async prepare(image: HTMLImageElement) {
      try {
        await image.decode();
        if (!disposed && image.naturalWidth > 0) decoded.add(image);
      } catch {
        if (!disposed) decoded.delete(image);
      }
    },
    unavailable(image: HTMLImageElement) {
      decoded.delete(image);
    },
    choose(images: HTMLImageElement[]) {
      if (selected === undefined)
        selected =
          !disposed &&
          images.length === 2 &&
          images.every(
            (image) =>
              image.complete && image.naturalWidth > 0 && decoded.has(image)
          );
      return selected;
    },
    dispose() {
      disposed = true;
      decoded.clear();
    },
  };
}
