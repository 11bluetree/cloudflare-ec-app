import * as React from 'react';
import { cn } from '../../lib/utils';
import { Label } from './label';

/**
 * FormField - フォームフィールドのラッパーコンポーネント
 */
type FormFieldProps = {
  label: string;
  required?: boolean;
  error?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  htmlFor?: string;
};

export const FormField: React.FC<FormFieldProps> = ({
  label,
  required,
  error,
  description,
  children,
  className,
  htmlFor,
}) => {
  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor={htmlFor}>
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      {children}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {description && !error && <p className="text-sm text-gray-500">{description}</p>}
    </div>
  );
};

/**
 * FormSection - フォームセクションのラッパーコンポーネント
 */
type FormSectionProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
};

export const FormSection: React.FC<FormSectionProps> = ({ title, description, children, className }) => {
  return (
    <section className={cn('rounded-lg border border-gray-200 bg-white p-6 shadow-sm', className)}>
      <div className="mb-6">
        <h2 className="text-xl font-semibold">{title}</h2>
        {description && <p className="mt-2 text-sm text-gray-600">{description}</p>}
      </div>
      {children}
    </section>
  );
};
