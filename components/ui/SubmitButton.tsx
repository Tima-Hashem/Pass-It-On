'use client';

import { useFormStatus } from 'react-dom';

interface SubmitButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  loadingText?: string;
}

export default function SubmitButton({ children, loadingText = 'Loading...', className, disabled, value, name, ...props }: SubmitButtonProps) {
  const { pending, data } = useFormStatus();
  
  // If the form is pending, check if this specific button was the one clicked
  // by comparing its name and value to the submitted FormData.
  // If the button has no name/value, assume it's the only submit button and spin it.
  const isThisButtonClicked = pending && (!name || !value || data?.get(name) === value);
  const isLoading = isThisButtonClicked || disabled;
  
  // We want to disable ALL buttons in the form while it's pending, but only spin the clicked one.
  const isDisabled = pending || disabled;

  return (
    <button
      disabled={isDisabled}
      className={`relative flex items-center justify-center transition-all ${className} ${isDisabled ? 'opacity-75 cursor-not-allowed' : ''}`}
      name={name}
      value={value}
      {...props}
    >
      {isThisButtonClicked ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>{loadingText}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
