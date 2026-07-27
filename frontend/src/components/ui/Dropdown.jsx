import { useEffect, useRef, useState } from 'react';
import { FiChevronDown } from 'react-icons/fi';

export function Dropdown({ label, items = [], align = 'right' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (event) => {
      if (!ref.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-xl border border-line bg-white px-3 text-sm font-semibold text-ink shadow-sm transition duration-200 hover:border-primary hover:bg-orange-50 hover:text-primary hover:shadow-md"
        onClick={() => setOpen((value) => !value)}
      >
        {label}
        <FiChevronDown className="size-4" />
      </button>
      {open ? (
        <div
          className={`enterprise-panel absolute z-30 mt-2 w-52 rounded-xl p-2 ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              className="w-full rounded-lg px-3 py-2 text-left text-sm text-ink transition hover:bg-orange-50 hover:text-primary"
              onClick={() => {
                item.onClick?.();
                setOpen(false);
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
