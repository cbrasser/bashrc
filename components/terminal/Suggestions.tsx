'use client';

interface SuggestionsProps {
  suggestions: string[];
  suggestionIndex: number;
  show: boolean;
  onSelect?: (suggestion: string) => void;
}

export default function Suggestions({ suggestions, suggestionIndex, show, onSelect }: SuggestionsProps) {
  if (!show || suggestions.length === 0) return null;

  return (
    <ul
      id="suggestions"
      style={{
        columnCount: 3,
        columnWidth: '100px',
        paddingLeft: 0,
        listStyle: 'none',
      }}
    >
      {suggestions.map((sug, index) => (
        <li
          key={index}
          className="suggestion"
          onClick={() => onSelect?.(sug)}
          style={{
            backgroundColor: index === suggestionIndex ? 'var(--pink)' : 'transparent',
            color: index === suggestionIndex ? 'var(--dark)' : 'inherit',
            cursor: 'pointer',
          }}
        >
          {sug}
        </li>
      ))}
    </ul>
  );
}

