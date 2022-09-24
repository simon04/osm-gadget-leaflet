export function debounce<F extends (...args: Parameters<F>) => ReturnType<F>>(
  func: F,
  waitFor: number
): (...args: Parameters<F>) => void {
  let id: number;
  return (...args: Parameters<F>): void => {
    clearTimeout(id);
    id = setTimeout(() => func(...args), waitFor);
  };
}
