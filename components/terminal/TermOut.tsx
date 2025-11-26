'use client';

interface TermOutProps {
  out: {
    dirs: string[];
    files: Array<{ name: string; url: string }>;
    messages: Array<{ type: string; value: string; css?: React.CSSProperties }>;
  };
  onCd?: (dir: string) => void;
}

export default function TermOut({ out, onCd }: TermOutProps) {
  return (
    <div
      id="console_out"
      className="console-out"
      style={{
        maxHeight: '100%',
        overflow: 'scroll',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      }}
    >
      {out.dirs.map((dir, index) => (
        <a
          key={index}
          className="directory"
          onClick={() => onCd?.(`cd ${dir}`)}
          style={{
            display: 'block',
            color: 'var(--cyan)',
            textDecoration: 'none',
            cursor: 'pointer',
          }}
        >
          {dir}
        </a>
      ))}
      {out.files.map((file, index) => (
        <a
          key={index}
          className="file"
          href={file.url}
          style={{
            display: 'block',
            color: 'var(--yellow)',
            textDecoration: 'none',
          }}
        >
          {file.name}
        </a>
      ))}
      {out.messages.map((msg, index) => (
        <a
          key={index}
          className={msg.type}
          style={{
            display: 'block',
            color: msg.type === 'error' ? 'var(--red)' : msg.type === 'success' ? 'var(--green)' : 'white',
            ...msg.css,
          }}
        >
          {msg.value}
        </a>
      ))}
    </div>
  );
}

