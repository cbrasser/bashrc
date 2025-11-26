'use client';

import { useState, useEffect, useRef } from 'react';

interface FileManagerPromptProps {
  label: string;
  type?: string;
  placeholder: string;
  onSubmit: (value: string) => void;
}

export default function FileManagerPrompt({ label, type = 'text', placeholder, onSubmit }: FileManagerPromptProps) {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(input);
    setInput('');
  };

  return (
    <div onKeyDown={(e) => e.key === 'Enter' && handleSubmit(e)}>
      <span
        className="label"
        style={{
          width: '50px',
          backgroundColor: 'var(--green)',
          color: 'var(--dark)',
        }}
      >
        {label}
      </span>
      <input
        ref={inputRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSubmit(e)}
        type={type}
        placeholder={placeholder}
        id="value"
        style={{
          backgroundColor: 'var(--dark)',
          border: 'none',
          marginLeft: 0,
          color: 'var(--white)',
        }}
      />
    </div>
  );
}

