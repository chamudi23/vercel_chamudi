import clsx from 'clsx';

export default function Button({ children, variant = 'primary', className, ...props }) {
  const baseStyles = 'px-4 py-2 rounded-lg font-medium text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-main';
  
  const variants = {
    primary: 'bg-brand-blue hover:bg-blue-600 text-white focus:ring-brand-blue',
    secondary: 'bg-dark-card hover:bg-dark-border text-white border border-dark-border focus:ring-dark-border',
    success: 'bg-brand-green hover:bg-green-600 text-white focus:ring-brand-green',
    danger: 'bg-brand-red hover:bg-red-600 text-white focus:ring-brand-red',
  };

  return (
    <button className={clsx(baseStyles, variants[variant], className)} {...props}>
      {children}
    </button>
  );
}
