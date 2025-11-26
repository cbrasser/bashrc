'use client';

import { useState } from 'react';
import PromptDecoration from './PromptDecoration';
import WorkingDirectory from './WorkingDirectory';
import PromptInput from './PromptInput';

interface PromptProps {
  wd: string;
  suggestions: string[];
  onInput: (value: string) => void;
  onSubmit: (value: string) => void;
}

export default function Prompt({ wd, suggestions, onInput, onSubmit }: PromptProps) {
  return (
    <div className="prompt-line" style={{ marginBottom: '1rem' }}>
      <div className="prompt-wrapper" style={{ float: 'left', marginRight: '1rem' }}>
        <PromptDecoration />
        <WorkingDirectory wd={wd} />
      </div>
      <div className="form-wrapper" style={{ width: 'auto', overflow: 'hidden' }}>
        <PromptInput
          termSuggestions={suggestions}
          onInput={onInput}
          onSubmit={onSubmit}
        />
      </div>
    </div>
  );
}

