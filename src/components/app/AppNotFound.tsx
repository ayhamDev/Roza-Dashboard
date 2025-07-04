"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Home } from "lucide-react";

export function AppNotFound({ buttons = true }: { buttons?: boolean }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br dark:bg-accent bg-white">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="pb-4">
          <div className="mx-auto mb-4 text-6xl font-bold text-gray-400 dark:text-gray-600">
            404
          </div>
          <CardTitle className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            Page Not Found
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Sorry, we couldn't find the page you're looking for. It might have
            been moved, deleted, or you entered the wrong URL.
          </CardDescription>
        </CardHeader>
        {buttons && (
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                asChild
                variant="default"
                className="flex items-center gap-2"
              >
                <Link to="/dashboard">
                  <Home className="w-4 h-4" />
                  Go Home
                </Link>
              </Button>
              <Button
                variant="outline"
                onClick={() => window.history.back()}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Go Back
              </Button>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}

export default AppNotFound;
