'use client';

import { useState, useEffect, useRef } from 'react';

interface Tag {
  name: string;
  color: string;
}

interface Task {
  name: string;
  description: string;
  tags: string[];
}

interface Todos {
  active: Task[];
  completed: Task[];
  tags: Tag[];
}

export default function Todo() {
  const [todos, setTodos] = useState<Todos>({
    active: [],
    completed: [],
    tags: [],
  });
  const [input, setInput] = useState('');
  const [label, setLabel] = useState('add');
  const [colorPickerActive, setColorPickerActive] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  const colors = [
    'var(--cyan)',
    'var(--blue)',
    'var(--darkblue)',
    'var(--orange)',
    'var(--yellow)',
    'var(--pink)',
    'var(--green)',
    'var(--red)',
    'var(--white)',
  ];

  useEffect(() => {
    loadFromLocalStorage();
  }, []);

  const loadFromLocalStorage = () => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem('todo');
    if (stored) {
      try {
        const json_obj = JSON.parse(stored);
        setTodos(json_obj);
      } catch (e) {
        console.error('Error loading todos', e);
      }
    }
  };

  const storeToLocalStorage = () => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('todo', JSON.stringify(todos));
  };

  const getTagColor = (tag: string) => {
    const tagObj = todos.tags.find((t) => t.name === tag);
    return tagObj ? tagObj.color : 'white';
  };

  const setTagColor = (color: string) => {
    const newTags = todos.tags.map((t) => (t.name === selectedTag ? { ...t, color } : t));
    setTodos({ ...todos, tags: newTags });
    storeToLocalStorage();
    setColorPickerActive(false);
  };

  const showColorPicker = (tag: string) => {
    setSelectedTag(tag);
    setColorPickerActive(true);
  };

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    const input_both = input.split(':');
    const name = input_both[0].split(' ')[0];
    const task: Task = { name, description: input_both[1] || '', tags: [] };

    const tagsMatch = input_both[0].match(/\[(.*?)\]/);
    if (tagsMatch) {
      const tags = tagsMatch[1].split(/,\s*/);
      task.tags = tags;
      addTagsIfNew(tags);
    }

    setTodos({ ...todos, active: [...todos.active, task] });
    setInput('');
    storeToLocalStorage();
  };

  const addTagsIfNew = (tags: string[]) => {
    const newTags = tags.filter((t) => todos.tags.findIndex((g) => g.name === t) === -1);
    const tagObjects = newTags.map((t) => ({ name: t, color: 'white' }));
    setTodos({ ...todos, tags: [...todos.tags, ...tagObjects] });
  };

  const completeTask = (name: string) => {
    const index = todos.active.findIndex((t) => t.name === name);
    if (index !== -1) {
      const task = todos.active[index];
      setTodos({
        ...todos,
        active: todos.active.filter((_, i) => i !== index),
        completed: [...todos.completed, task],
      });
      storeToLocalStorage();
    }
  };

  useEffect(() => {
    storeToLocalStorage();
  }, [todos]);

  return (
    <div className="todo-wrapper w-full h-full bg-[var(--bg)] rounded-lg p-4" style={{ opacity: 0.95, color: 'var(--fg)' }}>
      <div className="todo-title" style={{ textTransform: 'uppercase', marginBottom: '1.5rem' }}>
        todo
      </div>
      <div
        className="todo-list"
        style={{
          overflow: 'auto',
          scrollbarWidth: 'none',
          maxHeight: 'calc(100% - 3rem)',
        }}
      >
        {todos.active.map((task, index) => (
          <div key={index} className="todo-entry" style={{ marginBottom: '1rem' }}>
            <div className="todo-name" style={{ display: 'inline' }}>
              {'> '}
              {task.name}
            </div>
            <div className="todo-tags" style={{ display: 'inline', marginLeft: '0.5rem' }}>
              {task.tags.map((tag, tagIndex) => (
                <span
                  key={tagIndex}
                  className="tag"
                  onClick={() => showColorPicker(tag)}
                  style={{
                    backgroundColor: getTagColor(tag),
                    color: 'var(--dark)',
                    fontSize: '0.8rem',
                    padding: '0.1rem',
                    cursor: 'pointer',
                    marginRight: '0.3rem',
                    borderRadius: '3px',
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
            <div
              className="todo-complete"
              onClick={() => completeTask(task.name)}
              style={{ float: 'right', cursor: 'pointer', display: 'inline' }}
            >
              <i className="material-icons">backspace</i>
            </div>
            <div className="todo-text" style={{ marginTop: '0.5rem' }}>{task.description}</div>
          </div>
        ))}
      </div>

      <form
        className="todo-prompt"
        onSubmit={addTask}
        style={{
          position: 'absolute',
          bottom: '22px',
          width: '70%',
          height: '22px',
          margin: 'auto',
          overflow: 'hidden',
          display: 'flex',
        }}
      >
        <span
          className="todo-prompt-label"
          style={{
            marginRight: '0.2rem',
            padding: '0',
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
          onKeyDown={(e) => e.key === 'Enter' && addTask(e)}
          placeholder="task [tag, tog]: Do this thing finally"
          id="value"
          style={{
            backgroundColor: 'var(--dark)',
            border: 'none',
            marginLeft: 0,
            color: 'var(--white)',
            flexGrow: 1,
          }}
        />
      </form>

      <div
        className="color-picker"
        style={{
          display: 'flex',
          opacity: colorPickerActive ? 1 : 0,
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '100%',
          transition: 'opacity 0.6s',
        }}
      >
        {colors.map((color, index) => (
          <span
            key={index}
            className="color"
            onClick={() => setTagColor(color)}
            style={{
              height: '20px',
              width: '40px',
              display: 'inline-block',
              cursor: 'pointer',
              flexGrow: 1,
              backgroundColor: color,
            }}
          ></span>
        ))}
      </div>
    </div>
  );
}
