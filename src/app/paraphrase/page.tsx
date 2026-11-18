'use client';

import React from 'react';
import { AntiAiParaphraseStudio } from '@/components/AntiAiParaphraseStudio';

export default function ParaphrasePage() {
  return (
    <div className="min-h-screen bg-[var(--cw-paper)]">
      <AntiAiParaphraseStudio />
    </div>
  );
}

