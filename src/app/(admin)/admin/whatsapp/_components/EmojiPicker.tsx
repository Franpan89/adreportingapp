'use client';

import { useEffect, useRef } from 'react';

const EMOJIS = [
  '😊','😄','😂','🥰','😍','🤩','😎','🙏','👍','👋',
  '❤️','🎉','✅','⚠️','❌','💬','📋','📞','📧','🔔',
  '💡','📅','🕐','🚀','🎯','💪','🙌','👏','🤝','💼',
  '📊','💰','🛒','📦','🔄','⭐','🌟','✨','🎁','📌',
];

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

export function EmojiPicker({ onSelect, onClose }: EmojiPickerProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute bottom-full mb-2 left-0 z-50 w-64 p-3 rounded-xl
                 bg-[#E7E5E4] neu-raised shadow-xl border border-[#d1cec9]"
    >
      <div className="grid grid-cols-8 gap-1">
        {EMOJIS.map(e => (
          <button
            key={e}
            type="button"
            onClick={() => onSelect(e)}
            className="w-7 h-7 flex items-center justify-center text-base
                       rounded hover:bg-[#d1cec9] transition-colors"
          >
            {e}
          </button>
        ))}
      </div>
    </div>
  );
}
