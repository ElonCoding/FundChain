import { useState, useEffect } from "react";

interface WindowSize {
  width:  number | undefined;
  height: number | undefined;
}

/** Track window dimensions for responsive logic outside CSS media queries. */
export function useWindowSize(): WindowSize {
  const [size, setSize] = useState<WindowSize>({ width: undefined, height: undefined });

  useEffect(() => {
    function update() {
      setSize({ width: window.innerWidth, height: window.innerHeight });
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return size;
}

