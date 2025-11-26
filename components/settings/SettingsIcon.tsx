'use client';

interface SettingsIconProps {
  open: boolean;
  onClick: () => void;
  bgColor?: string;
  fgColor?: string;
}

export default function SettingsIcon({ open, onClick, bgColor = '#1a1e21', fgColor = '#d8dee9' }: SettingsIconProps) {
  return (
    <div
      className="settings-icon fixed top-5 right-5 z-[9999] cursor-pointer p-3 rounded-lg transition-all duration-300 hover:scale-105"
      style={{
        backgroundColor: bgColor,
        color: fgColor,
        boxShadow: '0 3px 5px -1px rgba(0, 0, 0, 0.2), 0 6px 10px 0 rgba(0, 0, 0, 0.14), 0 1px 18px 0 rgba(0, 0, 0, 0.12)',
        minWidth: '48px',
        minHeight: '48px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={onClick}
      role="button"
      aria-label="Open settings"
    >
      <div className="flex flex-col justify-between w-6 h-[18px] transition-all duration-300">
        <span
          className="block h-[3px] w-full rounded-sm transition-all duration-300"
          style={{
            backgroundColor: fgColor,
            transform: open ? 'rotate(45deg) translate(8px, 8px)' : 'none',
          }}
        ></span>
        <span
          className="block h-[3px] w-full rounded-sm transition-all duration-300"
          style={{
            backgroundColor: fgColor,
            opacity: open ? 0 : 1,
            transform: open ? 'translateX(-10px)' : 'none',
          }}
        ></span>
        <span
          className="block h-[3px] w-full rounded-sm transition-all duration-300"
          style={{
            backgroundColor: fgColor,
            transform: open ? 'rotate(-45deg) translate(8px, -8px)' : 'none',
          }}
        ></span>
      </div>
    </div>
  );
}

