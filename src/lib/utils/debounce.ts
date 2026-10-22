export function debounce<T extends (...args: any[]) => void>(fn: T, delayMs = 300) {
  let timer: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delayMs);
  };
}
