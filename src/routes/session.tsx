import { createFileRoute } from "@tanstack/react-router";
import { SessionView } from "@/components/app/session-view";

export const Route = createFileRoute("/session")({ component: Session });

function Session() {
  return (
    <main>
      <SessionView />
    </main>
  );
}
