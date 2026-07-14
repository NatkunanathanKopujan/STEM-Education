import { FiSearch } from 'react-icons/fi';

export function SearchBar({ className = '', ...props }) {
  return (
    <label className={`relative block ${className}`}>
      <FiSearch className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
      <input
        className="focus-ring h-11 w-full rounded-xl border border-line bg-white pl-10 pr-3 text-sm text-ink placeholder:text-muted transition focus:border-primary"
        type="search"
        placeholder="Search"
        {...props}
      />
    </label>
  );
}
