/**
 * Accessible form controls. Each one has a visible <label>, an optional hint,
 * and an error message linked with aria-describedby and aria-invalid.
 */

interface BaseProps {
  name: string;
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
}

function describedBy(name: string, error?: string, hint?: string) {
  const ids: string[] = [];
  if (hint) ids.push(`${name}-hint`);
  if (error) ids.push(`${name}-error`);
  return ids.length ? ids.join(" ") : undefined;
}

function Messages({ name, error, hint }: { name: string; error?: string; hint?: string }) {
  return (
    <>
      {hint && !error ? (
        <p id={`${name}-hint`} className="mt-1 text-sm text-navy-600">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${name}-error`} role="alert" className="error-text">
          {error}
        </p>
      ) : null}
    </>
  );
}

export function TextField({
  name,
  label,
  error,
  hint,
  required,
  type = "text",
  ...rest
}: BaseProps & { type?: string } & Omit<React.InputHTMLAttributes<HTMLInputElement>, "name" | "type">) {
  return (
    <div>
      <label htmlFor={name} className="label">
        {label}
        {required ? <span className="text-red-700"> *</span> : null}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        aria-invalid={!!error}
        aria-describedby={describedBy(name, error, hint)}
        className="input"
        {...rest}
      />
      <Messages name={name} error={error} hint={hint} />
    </div>
  );
}

export function SelectField({
  name,
  label,
  error,
  hint,
  required,
  options,
  placeholder,
  ...rest
}: BaseProps & {
  options: { value: string; label: string }[];
  placeholder?: string;
} & Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "name">) {
  return (
    <div>
      <label htmlFor={name} className="label">
        {label}
        {required ? <span className="text-red-700"> *</span> : null}
      </label>
      <select
        id={name}
        name={name}
        required={required}
        aria-invalid={!!error}
        aria-describedby={describedBy(name, error, hint)}
        className="input"
        {...rest}
      >
        {placeholder ? <option value="">{placeholder}</option> : null}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <Messages name={name} error={error} hint={hint} />
    </div>
  );
}

export function TextAreaField({
  name,
  label,
  error,
  hint,
  required,
  ...rest
}: BaseProps & Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "name">) {
  return (
    <div>
      <label htmlFor={name} className="label">
        {label}
        {required ? <span className="text-red-700"> *</span> : null}
      </label>
      <textarea
        id={name}
        name={name}
        required={required}
        aria-invalid={!!error}
        aria-describedby={describedBy(name, error, hint)}
        rows={3}
        className="input"
        {...rest}
      />
      <Messages name={name} error={error} hint={hint} />
    </div>
  );
}

export function CheckboxField({
  name,
  label,
  error,
  hint,
  disabled,
  ...rest
}: Omit<BaseProps, "label"> & { label: React.ReactNode; disabled?: boolean } & Omit<React.InputHTMLAttributes<HTMLInputElement>, "name" | "type">) {
  return (
    <div>
      <div className="flex min-h-[44px] items-start gap-3">
        <input
          id={name}
          name={name}
          type="checkbox"
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={describedBy(name, error, hint)}
          className="mt-1 h-5 w-5 shrink-0 accent-teal disabled:cursor-not-allowed disabled:opacity-50"
          {...rest}
        />
        <label htmlFor={name} className={`text-base ${disabled ? "text-navy/40" : "text-navy"}`}>
          {label}
        </label>
      </div>
      <Messages name={name} error={error} hint={hint} />
    </div>
  );
}

/** Shows a summary of all errors at the top of a form, linking to each field. */
export function FormErrorSummary({ message, errors }: { message?: string; errors?: Record<string, string> }) {
  const entries = Object.entries(errors ?? {});
  if (!message && entries.length === 0) return null;
  return (
    <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900">
      <p className="font-semibold">{message ?? "Please fix the highlighted fields:"}</p>
      {entries.length > 0 ? (
        <ul className="mt-2 list-disc space-y-1 pl-5">
          {entries.map(([field, msg]) => (
            <li key={field}>
              <a className="underline" href={`#${field}`}>
                {msg}
              </a>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
