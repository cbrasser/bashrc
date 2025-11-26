'use client';

import { useState, useEffect, useCallback } from 'react';
import { useStore } from '@/lib/store';
import Prompt from '../terminal/Prompt';
import TermOut from '../terminal/TermOut';
import { newResponse } from '@/lib/components/response';
import { log } from '@/lib/components/logger';
import { get_browser_info } from '@/lib/components/utility';

export default function Terminal() {
  const { fileTree: fs, workingDirectory: wd, updateFileTree, updateWorkingDirectory } = useStore();
  const [out, setOut] = useState({ dirs: [] as string[], files: [] as Array<{ name: string; url: string }>, messages: [] as Array<{ type: string; value: string; css?: React.CSSProperties }> });
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [windowHeight, setWindowHeight] = useState(100);
  const [windowWidth, setWindowWidth] = useState(100);
  const [commands, setCommands] = useState<any>({});

  useEffect(() => {
    const handleResize = () => {
      setWindowHeight(window.innerHeight);
      setWindowWidth(window.innerWidth);
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    buildCommands();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const buildCommands = useCallback(() => {
    const cmds: any = {
      clear: () => newResponse(),
      fetch: () => {
        const res = newResponse();
        res.messages.push({
          type: 'value',
          value: 'OS > ' + window.navigator.platform,
          css: { color: 'var(--orange)' },
        });
        res.messages.push({
          type: 'value',
          value: 'Kernel > bashrc v1.0.1',
          css: { color: 'var(--yellow)' },
        });
        const seconds = Math.floor(Math.random() * 60);
        const minutes = Math.floor(Math.random() * 60);
        res.messages.push({
          type: 'value',
          value: `Uptime > ${minutes} minutes - ${seconds} seconds`,
          css: { color: 'var(--green)' },
        });
        res.messages.push({
          type: 'value',
          value: 'Resolution > ' + windowWidth + 'x' + windowHeight,
          css: { color: 'var(--pink)' },
        });
        res.messages.push({
          type: 'value',
          value: 'DE > ' + get_browser_info().name,
          css: { color: 'var(--darkblue)' },
        });
        return res;
      },
      pwd: () => {
        const res = newResponse();
        if (wd) {
          res.messages.push({ type: 'value', value: wd.getName() });
        }
        return res;
      },
      echo: (args: string[]) => {
        const res = newResponse();
        res.messages.push({ type: 'value', value: args.join(' ') });
        return res;
      },
      locate: (args: string[]) => {
        if (args[0]) {
          window.open('https://duckduckgo.com/' + args.join(' '));
        } else {
          const res = newResponse();
          res.messages.push({ type: 'error', value: 'Please enter a valid search query' });
          return res;
        }
      },
      open: (args: string[]) => {
        log('open', args);
        const res = newResponse();
        if (!args[0]) {
          res.messages.push({ type: 'error', value: 'open: missing operand' });
          return res;
        }
        if (!fs || !wd) return res;
        const file = fs.getNode(wd, args[0]);
        if (!file) {
          res.messages.push({
            type: 'error',
            value: `open: cannot open '${args[0]}': No such file or directory`,
          });
          return res;
        }
        if (file.url) {
          window.location.href = file.url;
        }
        return res;
      },
      getMethods: () => {
        return Object.keys(cmds).filter((m) => typeof cmds[m] === 'function' && m !== 'getMethods');
      },
    };
    setCommands(cmds);
  }, [wd, windowWidth, windowHeight]);

  const onCommand = (input: string) => {
    suggest(input);
  };

  const onCommandSubmit = (com: string) => {
    setOut({ dirs: [], files: [], messages: [] });
    const parts = com.split(' ');
    const command = parts[0];
    const args = parts.slice(1);

    try {
      if (commands[command]) {
        const response = commands[command](args);
        if (response) {
          setOut({
            dirs: response.dirs || [],
            files: response.files || [],
            messages: response.messages || [],
          });
        }
        return;
      }

      if (!fs || !wd) return;
      const res = fs.call(command, wd, args);
      if (res) {
        if (res.success) {
          updateFileTree(fs);
        }
        if (res.directory) {
          updateWorkingDirectory(res.directory);
        } else {
          setOut({
            dirs: res.dirs || [],
            files: res.files || [],
            messages: res.messages || [],
          });
        }
      }
    } catch (e) {
      log('error', String(e), 'red');
      const res = newResponse();
      res.messages.push({
        type: 'error',
        value: `bashrc: command not found: ${command}`,
      });
      setOut({
        dirs: [],
        files: [],
        messages: res.messages,
      });
    }
  };

  const suggest = (input: string) => {
    log('input', input, 'green');
    if (input.length === 0) {
      setSuggestions([]);
      return;
    }
    if (input.indexOf(' ') !== -1) {
      log('Suggesting', 'files', 'green');
      suggestFiles(input);
    } else {
      log('Suggesting', 'commands', 'green');
      suggestCommands(input);
    }
  };

  const suggestCommands = (input: string) => {
    if (!fs || !wd) return;
    const cmdMethods = commands.getMethods ? commands.getMethods() : [];
    const files = wd.getFileNames();
    const all = cmdMethods.concat(fs.api()).concat(files);
    setSuggestions(all.filter((c: string) => c.substr(0, input.length) === input));
  };

  const suggestFiles = (input: string) => {
    if (!fs || !wd) return;
    const command = input.split(' ')[0] + ' ';
    let path = input.split(' ').slice(1).join(' ');
    let content: string[];

    if (path.indexOf(fs.separator) !== -1) {
      path = path.substr(0, path.lastIndexOf(fs.separator));
      const node = fs.getNode(wd, path);
      if (node) {
        content = node.getChildrenNames();
      } else {
        content = [];
      }
    } else {
      content = wd.getChildrenNames();
    }
    setSuggestions(content);
  };

  const wdPath = wd ? wd.getPath() : '~';

  return (
    <div className="w-full h-full bg-[var(--bg)] rounded-lg p-4 font-mono text-sm" style={{ opacity: 0.95, color: 'var(--fg)' }}>
      <Prompt
        wd={wdPath}
        suggestions={suggestions}
        onInput={onCommand}
        onSubmit={onCommandSubmit}
      />
      <TermOut out={out} onCd={onCommandSubmit} />
    </div>
  );
}
