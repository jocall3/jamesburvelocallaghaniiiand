
import React, { useState, useEffect, useCallback } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  FormLabel,
  FormDescription,
  FormControl,
  FormMessage,
  FormItem,
} from './ui/form';
import { useController } from 'react-hook-form';
import { cn } from '../lib/utils';

interface Option {
  value: string;
  label: string;
  disabled?: boolean;
}

interface ControlledSelectProps {
  name: string;
  control: any; // react-hook-form control object
  label?: string;
  options: Option[];
  description?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  onValueChange?: (value: string) => void;
  className?: string;
}

const ControlledSelect: React.FC<ControlledSelectProps> = ({
  name,
  control,
  label,
  options,
  description,
  placeholder,
  disabled = false,
  required = false,
  onValueChange,
  className,
}) => {
  const {
    field: { onChange, onBlur, value, ref },
    fieldState: { isTouched, isDirty, error },
  } = useController({
    name,
    control,
  });

  const [selectedValue, setSelectedValue] = useState<string>(value || '');

  useEffect(() => {
    setSelectedValue(value || '');
  }, [value]);

  const handleValueChange = useCallback(
    (newValue: string) => {
      onChange(newValue);
      setSelectedValue(newValue);
      if (onValueChange) {
        onValueChange(newValue);
      }
    },
    [onChange, onValueChange]
  );

  return (
    <FormItem className={className}>
      {label && (
        <FormLabel className={cn('flex items-center', { 'text-red-500': required })}>
          {label} {required && <span className="ml-1 text-red-500">*</span>}
        </FormLabel>
      )}
      <FormControl>
        <Select
          onValueChange={handleValueChange}
          value={selectedValue}
          // onBlur={onBlur} // Select primitive doesn't expose onBlur directly on root usually, handled via trigger ref focus events internally often
          disabled={disabled}
          name={name}
          // ref={ref} // ref should be passed to Trigger if needed for focus
        >
          <SelectTrigger
            className={cn(
              'w-full',
              isTouched && error && 'border-red-500 focus:ring-red-500',
              disabled && 'bg-muted/50 opacity-50'
            )}
            ref={ref}
          >
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormControl>
      {description && <FormDescription>{description}</FormDescription>}
      {error && <FormMessage>{error.message}</FormMessage>}
    </FormItem>
  );
};

export default ControlledSelect;
