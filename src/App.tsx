import { useEffect } from "react";
import { unlockAudio } from "./audio/sampler.ts";
import { ExerciseScreen } from "./screens/ExerciseScreen.tsx";
import { HomeScreen } from "./screens/HomeScreen.tsx";
import { NewProfileScreen } from "./screens/NewProfileScreen.tsx";
import { ProfileScreen } from "./screens/ProfileScreen.tsx";
import { ProfilesScreen } from "./screens/ProfilesScreen.tsx";
import { ProgressScreen } from "./screens/ProgressScreen.tsx";
import { ResultScreen } from "./screens/ResultScreen.tsx";
import { SettingsScreen } from "./screens/SettingsScreen.tsx";
import { WelcomeScreen } from "./screens/WelcomeScreen.tsx";
import { AppProvider } from "./state/AppContext.tsx";
import { useApp } from "./state/useApp.ts";

function Router() {
  const { nav, profile } = useApp();
  const { route } = nav;

  useEffect(() => {
    // The first tap anywhere unlocks audio on iOS and starts loading the samples.
    const once = () => unlockAudio();
    document.addEventListener("pointerdown", once, { once: true });
    return () => document.removeEventListener("pointerdown", once);
  }, []);

  let screen;
  switch (route.name) {
    case "profiles":
      screen = <ProfilesScreen />;
      break;
    case "newProfile":
      screen = <NewProfileScreen />;
      break;
    case "welcome":
      screen = <WelcomeScreen />;
      break;
    case "home":
      screen = <HomeScreen />;
      break;
    case "settings":
      screen = <SettingsScreen moduleId={route.moduleId} />;
      break;
    case "exercise":
      screen = <ExerciseScreen key={`${route.moduleId}-${route.nonce}`} moduleId={route.moduleId} />;
      break;
    case "result":
      screen = <ResultScreen moduleId={route.moduleId} summary={route.summary} />;
      break;
    case "progress":
      screen = <ProgressScreen />;
      break;
    case "profile":
      screen = <ProfileScreen />;
      break;
  }
  return <div className={profile?.kidMode ? "app kid" : "app"}>{screen}</div>;
}

export default function App() {
  return (
    <AppProvider>
      <Router />
    </AppProvider>
  );
}
