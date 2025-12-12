/*
Mastering Form Control: What a Simple Select Component Taught Me About React Hook Form

Ever found yourself wrestling with forms in React? Integrating a beautiful UI library component with a robust form management solution like `react-hook-form` can feel like a delicate dance. We often think of simple `<select>` elements as straightforward, but peek under the hood of a well-crafted `ControlledSelect` component, and you'll uncover a treasure trove of best practices and surprising insights. Let's dive into what this seemingly humble component reveals about building truly resilient and user-friendly forms.

Takeaway 1: The Dual Life of State: Why Your Select Needs Both `useState` and `useController`
At first glance, it might seem redundant: why does our `ControlledSelect` component maintain its own `selectedValue` state using `useState` while also being managed by `react-hook-form`'s `useController`? This isn't an oversight; it's a deliberate design choice for a smoother user experience. The local `useState` ensures the UI updates instantly as the user interacts, providing immediate visual feedback. Meanwhile, `useController` acts as the official conduit to `react-hook-form`'s global state, ensuring validation, submission, and overall form integrity are handled correctly. It's a beautiful separation of concerns, where the component handles its immediate display, and the form library manages the data lifecycle.

> "The component acts as a bridge, translating user interaction into form-friendly data, ensuring both immediate UI responsiveness and robust form management."

Takeaway 2: `useController`: Your Secret Weapon for Third-Party Component Integration
If you've ever struggled to integrate a custom input or a UI library component with `react-hook-form`, `useController` is your answer. This powerful hook provides everything you need: `field` (containing `onChange`, `onBlur`, `value`, and `ref`) and `fieldState` (with `isTouched`, `isDirty`, and `error`). It abstracts away the complexity of registering and managing your component's state within the form context. Instead of manually wiring up `register` or using the more verbose `Controller` component, `useController` offers a clean, hook-based API that makes your custom components first-class citizens in your `react-hook-form` setup.

> "It's the elegant handshake between your custom UI and `react-hook-form`'s powerful engine, making integration seamless and intuitive."

Takeaway 3: Form Semantics Aren't Optional: Building for Everyone
A truly great form isn't just functional; it's empathetic. Our `ControlledSelect` leverages components like `FormLabel`, `FormDescription`, and `FormMessage` (likely from a UI library like Shadcn UI's form system). This isn't just about aesthetics; it's about accessibility and user experience. A clear label, a helpful description, and precise error messages are crucial for guiding users, especially those relying on assistive technologies. Notice the `required` prop, which not only adds a visual indicator but also informs screen readers, making the form usable and understandable for a wider audience. Prioritizing these semantic elements elevates your forms from merely working to truly serving your users.

> "A truly great form isn't just functional; it's empathetic, guiding every user with clarity and support."

Takeaway 4: The Nuance of Refs and Triggers: When UI Libraries Change the Rules
One subtle but critical detail lies in how `ref` is handled. While you might typically pass a `ref` directly to an `<input>`, complex UI components often have their own internal DOM structure. The comment `// ref should be passed to Trigger if needed for focus` is a prime example. It reminds us that with components like `Select`, the actual interactive element that needs focus (and thus the `ref`) might not be the root `Select` component itself, but a specific sub-component like `SelectTrigger`. Understanding the internal workings and API of your chosen UI library is paramount to correctly managing focus, accessibility, and programmatic interactions.

> "Sometimes, the path to focus isn't direct; it's through the trigger, revealing the intricate dance within UI components."

Conclusion:
From a simple dropdown, we've uncovered layers of thoughtful design: state management strategies, powerful integration hooks, the non-negotiable importance of accessibility, and the subtle intricacies of UI component APIs. These aren't just lessons for building a better select component; they're foundational principles for crafting robust, user-friendly, and maintainable forms across your entire application. As you build your next form, consider these insights. How can you apply these principles to make your forms not just functional, but truly exceptional?
*/
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