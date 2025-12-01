interface NavigatorWithStandalone extends Navigator {
  standalone?: boolean;
}

export const isPWA = (): boolean => {
  if (typeof window === 'undefined') return false;

  const navigator = window.navigator as NavigatorWithStandalone;
  return (
    navigator.standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches
  );
};
