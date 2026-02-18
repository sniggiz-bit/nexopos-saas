import * as React from "react"
import { cn } from "@/lib/utils"

const Select = ({ children, value, onValueChange }: any) => {
    return (
        <div className="relative">
            {React.Children.map(children, (child) => {
                if (React.isValidElement(child)) {
                    return React.cloneElement(child as React.ReactElement<any>, { value, onValueChange });
                }
                return child;
            })}
        </div>
    );
};

const SelectTrigger = React.forwardRef<
    HTMLButtonElement,
    React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, ...props }, ref) => (
    <button
        ref={ref}
        type="button"
        className={cn(
            "flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
            className
        )}
        {...props}
    >
        {children}
    </button>
))
SelectTrigger.displayName = "SelectTrigger"

const SelectValue = ({ placeholder, value }: any) => <span>{value || placeholder}</span>

const SelectContent = ({ children, value, onValueChange }: any) => {
    return (
        <select
            value={value}
            onChange={(e) => onValueChange(e.target.value)}
            className={cn(
                "flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
                "appearance-none bg-no-repeat bg-[right_0.5rem_center] bg-[length:1em_1em]"
            )}
            style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7' /%3E%3C/svg%3E")`
            }}
        >
            {children}
        </select>
    );
};

const SelectItem = ({ value, children }: any) => (
    <option value={value}>{children}</option>
)

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem }
