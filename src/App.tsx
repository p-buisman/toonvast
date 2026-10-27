import { useEffect } from "react";
import { unlockAudio } from "./audio/sampler.ts";
import { AudioDebug } from "./components/common/AudioDebug.tsx";
import { ExerciseScreen } from "./screens/ExerciseScreen.tsx";
import { GoalsScreen } from "./screens/GoalsScreen.tsx";
import { LessonsScreen } from "./screens/LessonsScreen.tsx";
import { HomeScreen } from "./screens/HomeScreen.tsx";
import { NewProfileScreen } from "./screens/NewProfileScreen.tsx";
import { ProfileScreen } from "./screens/ProfileScreen.tsx";
import { ProfilesScreen } from "./screens/ProfilesScreen.tsx";
import { ProgressScreen } from "./screens/ProgressScreen.tsx";
import { ShapesScreen } from "./screens/ShapesScreen.tsx";
import { ShopScreen } from "./screens/ShopScreen.tsx";
import { ResultScreen } from "./screens/ResultScreen.tsx";
import { SettingsScreen } from "./screens/SettingsScreen.tsx";
import { TunerScreen } from "./screens/TunerScreen.tsx";
import { WelcomeScreen } from "./screens/WelcomeScreen.tsx";
import { AppProvider } from "./state/AppContext.tsx";
import { useApp } from "./state/useApp.ts";

function Router() {
  const { nav, profile } = useApp();
  const { route } = nav;
  const mode = profile?.kidMode ? "speels" : "rustig";
  const theme = profile?.theme ?? "klassiek";

  // The look also goes on the document itself, so the page behind the app and the iOS status bar (which takes its
  // colour from the theme-color meta) follow the mode and the theme instead of staying light.
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.mode = mode;
    root.dataset.theme = theme;
    const bg = getComputedStyle(root).getPropertyValue("--bg").trim();
    let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "theme-color";
      document.head.appendChild(meta);
    }
    if (bg) meta.content = bg;
  }, [mode, theme]);

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
    case "shop":
      screen = <ShopScreen />;
      break;
    case "shapes":
      screen = <ShapesScreen moduleId={route.moduleId} />;
      break;
    case "profile":
      screen = <ProfileScreen />;
      break;
    case "goals":
      screen = <GoalsScreen />;
      break;
    case "lessons":
      screen = <LessonsScreen />;
      break;
    case "tuner":
      screen = <TunerScreen />;
      break;
  }
  const debug = typeof location !== "undefined" && location.search.includes("debug");
  return (
    <div className={profile?.kidMode ? "app kid" : "app"} data-mode={mode} data-theme={theme}>
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
