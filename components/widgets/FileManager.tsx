'use client';

import { useState, useEffect, useRef } from 'react';
import { useStore } from '@/lib/store';
import FileManagerPrompt from '../filemanager/Prompt';

export default function FileManager() {
  const { fileTree: fs, workingDirectory: wd, updateFileTree, updateWorkingDirectory } = useStore();
  const [selected, setSelected] = useState(0);
  const [promptActive, setPromptActive] = useState(false);
  const [type, setType] = useState('');
  const [filter, setFilter] = useState('');
  const [input, setInput] = useState('');
  const [markedRemove, setMarkedRemove] = useState<number[]>([]);
  const filemanagerRef = useRef<HTMLDivElement>(null);

  const placeholders: Record<string, string> = {
    touch: 'filename url',
    mkdir: 'name',
    search: 'string',
    cd: 'directory',
  };

  useEffect(() => {
    filemanagerRef.current?.focus();
  }, []);

  if (!fs || !wd) {
    return <div className="w-full h-full bg-[var(--bg)] rounded-lg p-4" style={{ color: 'var(--fg)' }}>Loading...</div>;
  }

  const content = (() => {
    let items: Array<{ name: string; type: 'directory' | 'file'; url?: string }> = [];
    const children = wd.getChildren();
    if (children) {
      items = items.concat(
        children.map((c: any) => ({
          name: c.getName(),
          type: 'directory' as const,
        }))
      );
    }
    items = items.concat(
      wd.getFiles().map((f: any) => ({
        name: f.getName(),
        type: 'file' as const,
        url: f.getUrl(),
      }))
    );
    if (filter.length > 0) {
      return items.filter((n) => n.name.indexOf(filter) !== -1);
    }
    return items;
  })();

  const dirname = wd.getPath ? wd.getPath() : '~';

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (promptActive) return;

    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        leave();
        break;
      case 'ArrowDown':
        e.preventDefault();
        down();
        break;
      case 'ArrowUp':
        e.preventDefault();
        up();
        break;
      case 'ArrowRight':
      case 'Enter':
        e.preventDefault();
        enter();
        break;
      case 'f':
        onInput('touch');
        break;
      case 'n':
        onInput('mkdir');
        break;
      case 'c':
        onInput('cd');
        break;
      case 'd':
        remove();
        break;
      case 'p':
        paste();
        break;
      case 'Escape':
        e.preventDefault();
        cancel();
        break;
    }
  };

  const leave = () => {
    if (promptActive) return;
    const res = fs.cd(wd, '..');
    if (res.directory) {
      updateWorkingDirectory(res.directory);
      setSelected(0);
    }
  };

  const enter = () => {
    if (promptActive) return;
    const node = content[selected];
    if (!node) return;
    enterClicked(node);
  };

  const enterClicked = (node: { name: string; type: string; url?: string }) => {
    if (node.type === 'directory') {
      const res = fs.cd(wd, node.name);
      if (res.directory) {
        updateWorkingDirectory(res.directory);
        setSelected(0);
      }
    } else if (node.type === 'file' && node.url) {
      window.open(node.url, '_blank');
    }
  };

  const down = () => {
    if (promptActive) return;
    setSelected((selected + 1) % content.length);
  };

  const up = () => {
    if (promptActive) return;
    setSelected(selected > 0 ? selected - 1 : content.length - 1);
  };

  const onInput = (inputType: string) => {
    if (promptActive) return;
    setType(inputType);
    setPromptActive(true);
  };

  const remove = () => {
    if (promptActive) return;
    if (markedRemove.indexOf(selected) === -1) {
      setMarkedRemove([...markedRemove, selected]);
    } else {
      setMarkedRemove(markedRemove.filter((i) => i !== selected));
    }
  };

  const cancel = () => {
    setPromptActive(false);
    setFilter('');
    filemanagerRef.current?.focus();
  };

  const paste = () => {
    for (const index of markedRemove) {
      const node = content[index];
      if (node.type === 'file') {
        fs.rm(wd, [node.name]);
      } else if (node.type === 'directory') {
        fs.rmdir(wd, [node.name]);
      }
    }
    updateFileTree(fs);
    setMarkedRemove([]);
    setSelected(0);
  };

  const onSubmit = (value: string) => {
    switch (type) {
      case 'touch':
        fs.touch(wd, value.split(' '));
        break;
      case 'mkdir':
        fs.mkdir(wd, value);
        break;
      case 'search':
        setFilter(value);
        break;
      case 'cd':
        const node = content.filter((n) => n.name === value)[0];
        if (node) enterClicked(node);
        break;
    }
    updateFileTree(fs);
    setType('');
    setPromptActive(false);
    filemanagerRef.current?.focus();
  };

  return (
    <div
      id="filemanager"
      ref={filemanagerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="w-full h-full bg-[var(--bg)] rounded-lg"
      style={{ color: 'var(--fg)', outline: 'none' }}
    >
      <div className="wrapper" style={{ position: 'relative', width: '100%', height: '100%', display: 'flex' }}>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {content.map((node, index) => (
            <li
              key={index}
              onClick={() => enterClicked(node)}
              style={{
                cursor: 'pointer',
                backgroundColor:
                  index === selected
                    ? node.type === 'directory'
                      ? 'var(--cyan)'
                      : 'var(--yellow)'
                    : markedRemove.indexOf(index) !== -1
                    ? 'var(--red)'
                    : 'transparent',
                color:
                  index === selected
                    ? 'var(--dark)'
                    : markedRemove.indexOf(index) !== -1
                    ? 'var(--dark)'
                    : node.type === 'directory'
                    ? 'var(--cyan)'
                    : 'var(--yellow)',
              }}
            >
              {node.name}
            </li>
          ))}
        </ul>
        {promptActive && (
          <div
            className="fm-prompt-wrapper"
            style={{
              position: 'absolute',
              bottom: '22px',
              width: '100%',
              height: '22px',
              margin: 'auto',
              overflow: 'hidden',
            }}
          >
            <FileManagerPrompt
              label={type}
              placeholder={placeholders[type] || ''}
              onSubmit={onSubmit}
            />
          </div>
        )}
        <div
          className="status-bar"
          style={{
            position: 'absolute',
            bottom: 0,
            height: '22px',
            width: '100%',
            color: 'var(--dark)',
            backgroundColor: 'var(--red)',
          }}
        >
          <span className="position" style={{ marginLeft: '1rem' }}>
            {selected + 1}/{content.length}
          </span>
          <span className="wd" style={{ marginLeft: '1rem' }}>
            {dirname}
          </span>
          {filter.length > 0 && (
            <span className="filter" style={{ float: 'right' }}>
              filter: {filter}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
