'use client';

interface WorkingDirectoryProps {
  wd: string;
}

export default function WorkingDirectory({ wd }: WorkingDirectoryProps) {
  return (
    <span id="wd" style={{ color: 'var(--cyan)' }}>
      {wd}
    </span>
  );
}

