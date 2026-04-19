import React, { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { captureError } from "@/lib/errorReporter";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  scope?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error("[ErrorBoundary] Caught error:", error, errorInfo);
    captureError(error, {
      componentStack: errorInfo.componentStack ?? undefined,
      extra: { scope: this.props.scope ?? "root" },
    }, "error");
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex items-center justify-center min-h-[40vh] p-8">
          <div className="text-center max-w-md space-y-4">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
            <h2 className="text-xl font-semibold text-foreground">
              Ceva nu a funcționat corect
            </h2>
            <p className="text-muted-foreground text-sm">
              A apărut o eroare. Echipa a fost notificată automat. Încearcă să reîncarci pagina.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                Reîncarcă
              </button>
              <a
                href="/"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-border text-sm font-medium hover:bg-muted transition-colors"
              >
                Înapoi la magazin
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
