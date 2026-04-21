import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: import.meta.env.DEV,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
      showDetails: import.meta.env.DEV,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });
    console.error('[Apsis Space Error Boundary]', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  toggleDetails = () => {
    this.setState((prevState) => ({
      showDetails: !prevState.showDetails,
    }));
  };

  render() {
    if (this.state.hasError) {
      const mailtoLink = `mailto:hello@apsisspace.com?subject=Apsis Space Error Report&body=Error details:%0A%0A${encodeURIComponent(
        this.state.error?.toString() || 'Unknown error'
      )}%0A%0AStack Trace:%0A${encodeURIComponent(
        this.state.errorInfo?.componentStack || ''
      )}`;

      return (
        <div className="flex h-screen w-screen flex-col items-center justify-center bg-black p-6 text-white font-mono">
          <div className="w-full max-w-2xl border border-teal-500/30 bg-black/80 p-8 shadow-lg shadow-teal-500/10">
            <h1 className="mb-6 text-2xl font-bold tracking-widest text-teal-400">
              APSIS SPACE
            </h1>
            <p className="mb-8 text-lg text-white/90">
              Something went wrong. Apsis Space has encountered an unexpected error.
            </p>

            <div className="flex flex-wrap gap-4 mb-8">
              <button
                onClick={this.handleReload}
                className="bg-teal-500/20 px-6 py-2 text-teal-300 transition-colors hover:bg-teal-500/30 border border-teal-500/50"
              >
                Reload Application
              </button>
              <a
                href={mailtoLink}
                className="bg-white/5 px-6 py-2 text-white/80 transition-colors hover:bg-white/10 border border-white/20 inline-flex items-center"
              >
                Report this
              </a>
            </div>

            <div className="border-t border-white/10 pt-4">
              <button
                onClick={this.toggleDetails}
                className="text-sm text-teal-500/70 hover:text-teal-400 transition-colors"
              >
                {this.state.showDetails ? 'Hide technical details' : 'Show technical details'}
              </button>

              {this.state.showDetails && (
                <div className="mt-4 overflow-auto bg-white/5 p-4 text-xs text-white/70 max-h-64 whitespace-pre-wrap">
                  <p className="font-bold text-red-400 mb-2">
                    {this.state.error?.toString()}
                  </p>
                  <p>{this.state.errorInfo?.componentStack}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
