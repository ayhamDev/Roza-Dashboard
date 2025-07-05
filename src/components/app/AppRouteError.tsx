import React from "react";
import { useRouter } from "@tanstack/react-router";
import { AlertTriangle, Home, RefreshCw, ChevronLeft } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "../ui/button";

interface RouterErrorComponentProps {
  error?: Error;
  reset?: () => void;
  showRetry?: boolean;
  showHome?: boolean;
  showBack?: boolean;
  className?: string;
}

const AppRouteError: React.FC<RouterErrorComponentProps> = ({
  error,
  reset,
  showRetry = true,
  showHome = true,
  showBack = true,
  className = "",
}) => {
  const router = useRouter();

  const handleGoHome = () => {
    router.navigate({ to: "/dashboard" });
  };

  const handleGoBack = () => {
    router.history.back();
  };

  const handleRetry = () => {
    if (reset) {
      reset();
    } else {
      window.location.reload();
    }
  };

  const isNotFound =
    error?.message?.includes("404") || error?.message?.includes("Not Found");
  const isDevelopment = process.env.NODE_ENV === "development";

  return (
    <div className="min-h-screen w-full flex justify-center items-center">
      <div
        className={`min-h-[400px] flex items-center justify-center p-6 ${className}`}
      >
        <div className="max-w-md w-full space-y-6">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <AlertTriangle className="h-16 w-16 text-destructive" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight">
                {isNotFound ? "Page Not Found" : "Something went wrong"}
              </h1>
              <p className="text-muted-foreground">
                {isNotFound
                  ? "The page you're looking for doesn't exist or has been moved."
                  : "We encountered an unexpected error. Please try again."}
              </p>
            </div>
          </div>

          {/* Error Details in Development */}
          {isDevelopment && error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="font-mono text-sm">
                <div className="space-y-1">
                  <div className="font-semibold">{error.name}</div>
                  <div>{error.message}</div>
                  {error.stack && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-xs opacity-70 hover:opacity-100">
                        Stack trace
                      </summary>
                      <pre className="mt-1 text-xs whitespace-pre-wrap opacity-70">
                        {error.stack}
                      </pre>
                    </details>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            {showRetry && (
              <Button onClick={handleRetry}>
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
            )}

            {showHome && (
              <Button onClick={handleGoHome}>
                <Home className="h-4 w-4" />
                Go Home
              </Button>
            )}

            {showBack && (
              <Button onClick={handleGoBack}>
                <ChevronLeft className="h-4 w-4" />
                Go Back
              </Button>
            )}
          </div>

          {/* Help Text */}
          <div className="text-center text-sm text-muted-foreground">
            If the problem persists, please contact support or try refreshing
            the page.
          </div>
        </div>
      </div>
    </div>
  );
};
export default AppRouteError;
