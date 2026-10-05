import { Toaster as Sonner } from "sonner";

function Toaster() {
  return (
    <Sonner
      theme="dark"
      position="bottom-center"
      toastOptions={{
        classNames: {
          toast:
            "bg-elevated text-fg shadow-[var(--shadow-border)] border-0 font-sans",
          title: "text-fg",
          description: "text-muted",
        },
      }}
    />
  );
}

export { Toaster };
