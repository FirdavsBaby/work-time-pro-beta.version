import { Toaster } from 'sonner';

export function SonnerToaster() {
  return (
    <Toaster
      position="bottom-right"
      richColors
      theme="system"
      duration={4000}
      visibleToasts={4}
    />
  );
}