'use client';

import { useState, useEffect, useRef } from 'react';
import Suggestions from './Suggestions';

interface PromptInputProps {
  termSuggestions: string[];
  onInput: (value: string) => void;
  onSubmit: (value: string) => void;
}

export default function PromptInput({ termSuggestions, onInput, onSubmit }: PromptInputProps) {
  const [input, setInput] = useState('');
  const [index, setIndex] = useState(-1);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInput(value);
    onInput(value);
    setIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      if (termSuggestions.length === 0) return;
      if (!showSuggestions) {
        setShowSuggestions(true);
        setIndex(0);
      } else {
        if (termSuggestions.length === 1) {
          handleEnter(e);
        } else {
          setIndex((index + 1) % termSuggestions.length);
        }
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleEnter(e);
    }
  };

  const handleEnter = (e: React.KeyboardEvent) => {
    if (index === -1) {
      onSubmit(input);
      setInput('');
      setShowSuggestions(false);
    } else {
      const completedInput = getCompletedInput(input);
      let newInput = completedInput + termSuggestions[index];
      if (completedInput.length > 0) {
        newInput += '/';
      } else {
        newInput += ' ';
      }
      setInput(newInput);
      onInput(newInput);
      setIndex(-1);
      setShowSuggestions(false);
    }
  };

  const getCompletedInput = (input: string) => {
    const spaceInd = input.lastIndexOf(' ');
    const sepInd = input.lastIndexOf('/');
    const last = spaceInd > sepInd ? spaceInd : sepInd;
    if (last === -1) {
      return '';
    } else {
      return input.substring(0, last + 1);
    }
  };

  return (
    <div>
      <form style={{ display: 'inline' }}>
        <input
          ref={inputRef}
          id="input_field"
          name="cmd"
          value={input}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          type="text"
          autoFocus
          autoComplete="off"
          style={{
            width: '100%',
            outline: 'none',
            background: 'none',
            border: 'none',
            color: '#fff',
            fontSize: '1em',
          }}
        />
      </form>
      <Suggestions
        suggestions={termSuggestions}
        suggestionIndex={index}
        show={showSuggestions}
      />
    </div>
  );
}

