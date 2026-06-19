import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

// Stops a render crash from leaving a white screen on the wall. On error it
// shows a calm branded message and automatically reloads after a short delay —
// the reload re-reads the last-known data from the offline cache / Firestore,
// so the dashboard heals itself without anyone touching the TV.

const RELOAD_AFTER_MS = 15_000;

interface Props {
  children: ReactNode;
}
interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };
  private timer: ReturnType<typeof setTimeout> | undefined;

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[mkt-dashboard] render error — reloading shortly', error, info);
    this.timer = setTimeout(() => window.location.reload(), RELOAD_AFTER_MS);
  }

  componentWillUnmount() {
    if (this.timer) clearTimeout(this.timer);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="crash">
          <div className="crash-card">
            <div className="crash-title">Refreshing the dashboard…</div>
            <div className="crash-sub">A hiccup occurred. The screen will recover automatically.</div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
