import { createFileRoute } from "@tanstack/react-router";
import { HomeView } from "@/components/app/home-view";
import { warmupStudio } from "@/lib/audio/studio";
import { useEffect } from "react";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  useEffect(() => {
    warmupStudio();
  }, []);
  return (
    <main>
      <HomeView />
    </main>
  );
}
