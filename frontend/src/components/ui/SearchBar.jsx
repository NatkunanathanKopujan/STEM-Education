import { FiSearch } from 'react-icons/fi';

export function SearchBar({ className = '', ...props }) {
  return (
    <label className={`relative block ${className}`}>
      <FiSearch className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-primary" />
      <input
        className="focus-ring h-12 w-full rounded-2xl border border-line bg-white pl-12 pr-4 text-sm font-semibold text-ink shadow-[0_10px_26px_rgba(18,87,70,0.08)] placeholder:font-normal placeholder:text-muted transition duration-200 hover:border-primary/45 hover:shadow-md focus:border-primary focus:shadow-md"
        type="search"
        placeholder="Search"
        {...props}
      />
    </label>
  );
}
