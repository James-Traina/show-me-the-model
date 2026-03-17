import useJobStream from "./hooks/useJobStream";
import useResultRouting from "./hooks/useResultRouting";
import InputForm from "./components/InputForm";
import ProgressTracker from "./components/ProgressTracker";
import ResultsView from "./components/ResultsView";
import ErrorMessage from "./components/ErrorMessage";
import ThemeSwitcher from "./components/ThemeSwitcher";

const STAGE_ORDER = ["decomposition", "stage2", "dedup", "synthesis"];

export default function App() {
  const { phase, jobId, analysisId, stages, result, error, handleSubmit, reset,
          setPhase, setResult, setAnalysisId, setError } = useJobStream();

  useResultRouting({ setPhase, setResult, setAnalysisId, setError, reset });

  // ResultsView renders its own full-page layout with header
  if (phase === "done") {
    return <ResultsView result={result} analysisId={analysisId} onReset={reset} />;
  }

  return (
    <div className="min-h-screen relative" style={{ background: "var(--smtm-bg-page)" }}>
      {/* Theme switcher — top right corner */}
      <div className="absolute top-4 right-4 z-10">
        <ThemeSwitcher />
      </div>

      {/* Title — same width as the form (max-w-4xl = 896px) */}
      <div
        className="mx-auto max-w-4xl px-4 pt-14 pb-8 text-center"
        onClick={phase === "idle" ? undefined : reset}
        style={{ cursor: phase === "idle" ? "default" : "pointer" }}
      >
        <h1
          className="font-display font-800 leading-[1.05] tracking-tight m-0"
          style={{ fontSize: "clamp(2.5rem, 6vw, 4rem)", color: "var(--smtm-title-primary)" }}
        >
          Show Me the Model!
        </h1>
        <p
          className="font-mono font-medium uppercase tracking-[0.2em] mt-2 mb-0"
          style={{ fontSize: "clamp(0.75rem, 1.8vw, 1.1rem)", color: "var(--smtm-title-secondary)" }}
        >
          Economics Slop Detector
        </p>
      </div>

      <main className="mx-auto max-w-4xl px-4 pb-8">
        {phase === "idle" && <InputForm onSubmit={handleSubmit} />}

        {phase === "running" && (
          <ProgressTracker stages={stages} stageOrder={STAGE_ORDER} jobId={jobId} />
        )}

        {phase === "error" && (
          <ErrorMessage error={error} onRetry={reset} />
        )}
      </main>
    </div>
  );
}
