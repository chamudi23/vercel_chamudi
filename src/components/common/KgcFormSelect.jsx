import clsx from 'clsx';
import { forwardRef } from 'react';

const FormSelect = forwardRef(({ label, id, options, className, error, ...props }, ref) => {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label htmlFor={id} className="text-text-secondary text-sm">
          {label}
        </label>
      )}
      <select
        id={id}
        ref={ref}
        className={clsx(
          'bg-dark-main border border-dark-border rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-1 focus:ring-brand-blue focus:border-brand-blue transition-colors appearance-none',
          error && 'border-brand-red focus:ring-brand-red focus:border-brand-red',
          className
        )}
        {...props}
      >
        <option value="" disabled className="text-gray-500">Select an option</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <span className="text-brand-red text-xs mt-1">{error}</span>}
    </div>
  );
});

FormSelect.displayName = 'KgcFormSelect';

export default FormSelect;
