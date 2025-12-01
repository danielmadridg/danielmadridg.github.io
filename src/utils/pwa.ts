export const isPWA = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  return (
    (window.navigator as any).standalone || 
    window.matchMedia('(display-mode: standalone)').matches
  );
};
