import React, { forwardRef } from 'react';

export interface SelectOption {
    value: string | number;
    label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    options?: SelectOption[];
    error?: string;
    helperText?: string;
    containerClassName?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
    ({ className = '', containerClassName = '', label, options, children, error, helperText, id, ...props }, ref) => {
        // Generate a unique ID if one isn't provided but a label is present
        const selectId = id || (label ? `select-${label.replace(/\s+/g, '-').toLowerCase()}-${Math.random().toString(36).substr(2, 9)}` : undefined);

        return (
            <div className={`w-full ${containerClassName}`}>
                {label && (
                    <label htmlFor={selectId} className="block text-gray-300 text-sm font-bold mb-2">
                        {label}
                    </label>
                )}
                <div className="relative">
                    <select
                        id={selectId}
                        ref={ref}
                        className={`
                            w-full bg-gray-700/50 border border-gray-600 text-white text-sm rounded-lg 
                            focus:ring-cyan-500 focus:border-cyan-500 block p-2.5 pr-10
                            disabled:opacity-50 disabled:cursor-not-allowed
                            appearance-none
                            transition-colors duration-200
                            ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
                            ${className}
                        `}
                        {...props}
                    >
                        {options
                            ? options.map((option) => (
                                  <option key={option.value} value={option.value}>
                                      {option.label}
                                  </option>
                              ))
                            : children}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                        </svg>
                    </div>
                </div>
                {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
                {helperText && !error && <p className="mt-1 text-sm text-gray-400">{helperText}</p>}
            </div>
        );
    }
);

Select.displayName = 'Select';

export default Select;