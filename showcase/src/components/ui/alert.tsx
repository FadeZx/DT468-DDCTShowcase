import * as React from "react"

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'destructive'
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    const baseClasses = "relative w-full rounded-lg border p-4";
    const variantClasses = variant === 'destructive' 
      ? "border-red-200 bg-red-50 text-red-900" 
      : "border-gray-200 bg-gray-50 text-gray-900";
    
    const finalClasses = [baseClasses, variantClasses, className]
      .filter(Boolean)
      .join(' ');

    return (
      <div
        ref={ref}
        role="alert"
        className={finalClasses}
        {...props}
      />
    );
  }
)
Alert.displayName = "Alert"

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  const finalClasses = ["text-sm", className].filter(Boolean).join(' ');
  
  return (
    <div
      ref={ref}
      className={finalClasses}
      {...props}
    />
  );
})
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertDescription }