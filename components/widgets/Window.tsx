'use client';

import React from 'react';

interface WindowProps {
  id: string;
  name: string;
  position: { top: number; left: number };
  dimensions: { width: number; height: number };
  draggable: boolean;
  children: React.ReactNode;
  className?: string;
}

export default function Window({
  id,
  name,
  position,
  dimensions,
  draggable,
  children,
  className = '',
}: WindowProps) {
  return (
    <div
      id={id}
      className={`draggable ${className}`}
      style={{
        position: draggable ? 'absolute' : 'relative',
        top: draggable ? `${position.top}px` : 'auto',
        left: draggable ? `${position.left}px` : 'auto',
        width: `${dimensions.width}px`,
        height: `${dimensions.height}px`,
        backgroundColor: 'var(--bg-opaque)',
        transition: '0.3s ease-in-out',
        boxSizing: 'border-box',
      }}
    >
      <div className="drag-bar" style={{ height: '2rem', width: '100%' }}></div>
      <div className="center" style={{ display: 'flex', height: 'calc(100% - 4rem)' }}>
        <div className="drag-bar h" style={{ width: '2rem', height: '100%' }}></div>
        <div className="application" style={{ width: 'calc(100% - 4rem)', height: '100%' }}>
          {children}
        </div>
        <div className="drag-bar h" style={{ width: '2rem', height: '100%' }}></div>
      </div>
      <div className="drag-bar" style={{ height: '2rem', width: '100%' }}></div>
    </div>
  );
}
