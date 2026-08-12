import clsx from 'clsx';
import { forwardRef } from 'react';

const FormInput = forwardRef(({ label, id, className, error, ...props }, ref) => {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label htmlFor={id} className="text-text-secondary text-sm">
          {label}
        </label>
      )}
      <input
        id={id}
        ref={ref}
        className={clsx(
          'bg-dark-main border border-dark-border rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-brand-blue focus:border-brand-blue transition-colors',
          error && 'border-brand-red focus:ring-brand-red focus:border-brand-red',
          className
        )}
        {...props}
      />
      {error && <span className="text-brand-red text-xs mt-1">{error}</span>}
    </div>
  );
});

FormInput.displayName = 'KgcFormInput';

export default FormInput;
