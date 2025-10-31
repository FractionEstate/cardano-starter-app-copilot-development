"use client";
import React from 'react';
import { CardanoProvider } from "../contexts/CardanoContext";

interface ProvidersProps {
  readonly children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps): JSX.Element {
  return (
    <CardanoProvider>
      {children}
    </CardanoProvider>
  );
}
