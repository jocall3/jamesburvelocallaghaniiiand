import React from 'react';
import { Controller, Control, FieldValues, Path, RegisterOptions } from 'react-hook-form';
import { TextField, TextFieldProps } from '@mui/material';

interface ControlledInputProps<T extends FieldValues> extends Omit<TextFieldProps, 'name'> {
    name: Path<T>;
    control: Control<T>;
    rules?: RegisterOptions<T>;
}

const ControlledInput = <T extends FieldValues>({
    name,
    control,
    rules,
    ...props
}: ControlledInputProps<T>) => {
    return (
        <Controller
            name={name}
            control={control}
            rules={rules}
            render={({ field: { ref, ...fieldProps }, fieldState: { error } }) => (
                <TextField
                    {...props}
                    {...fieldProps}
                    inputRef={ref}
                    value={fieldProps.value ?? ''}
                    error={!!error}
                    helperText={error ? error.message : props.helperText}
                />
            )}
        />
    );
};

export default ControlledInput;