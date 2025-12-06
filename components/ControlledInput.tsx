import React from 'react';
import {
  Control,
  Controller,
  FieldErrors,
  FieldValues,
  Path,
  RegisterOptions,
} from 'react-hook-form';
import { InputProps } from '@mui/material/Input';
import { TextField, TextFieldProps } from '@mui/material';

interface ControlledInputProps<TFieldValues extends FieldValues> {
  name: Path<TFieldValues>;
  control: Control<TFieldValues>;
  rules?: RegisterOptions<TFieldValues, Path<TFieldValues>>;
  errors?: FieldErrors<TFieldValues>;
  textFieldProps?: TextFieldProps;
  inputProps?: Omit<InputProps, 'value' | 'onChange' | 'onBlur'>;
  label?: string;
  type?: React.InputHTMLAttributes<HTMLInputElement>['type'];
  required?: boolean;
  helperText?: string;
}

const ControlledInput = <TFieldValues extends FieldValues>({
  name,
  control,
  rules,
  errors,
  textFieldProps,
  inputProps,
  label,
  type = 'text',
  required = false,
  helperText,
}: ControlledInputProps<TFieldValues>) => {
  const error = errors ? errors[name] : undefined;

  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field: { onChange, onBlur, value, ref } }) => (
        <TextField
          name={name}
          label={label}
          type={type}
          required={required}
          error={!!error}
          helperText={error?.message || helperText || ''}
          value={value ?? ''}
          onChange={onChange}
          onBlur={onBlur}
          inputRef={ref}
          fullWidth
          InputProps={inputProps}
          {...(textFieldProps as Partial<TextFieldProps>)}
        />
      )}
    />
  );
};

export default ControlledInput;