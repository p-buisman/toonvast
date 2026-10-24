import { useEffect } from "react";
import { unlockAudio } from "./audio/sampler.ts";
import { AudioDebug } from "./components/common/AudioDebug.tsx";
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
    // The first taps unlock audio and start loading the samples. iOS only counts touchend/click as a
    // user gesture, so both the down and the up/click of the first tap try.
    const unlock = () => unlockAudio();
    const events = ["pointerdown", "touchend", "click"] as const;
    for (const e of events) document.addEventListener(e, unlock, { passive: true });
    return () => {
      for (const e of events) document.removeEventListener(e, unlock);
    };
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
  const debug = typeof location !== "undefined" && location.search.includes("debug");
  return (
    <div className={profile?.kidMode ? "app kid" : "app"}>
      {screen}
      {debug && <AudioDebug />}
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Router />
    </AppProvider>
  );
}
