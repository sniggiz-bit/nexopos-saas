import * as React from "react"
import { cn } from "@/lib/utils"

interface SwitchProps {
    id?: string
    checked?: boolean
    defaultChecked?: boolean
    onCheckedChange?: (checked: boolean) => void
    className?: string
    disabled?: boolean
}

const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
    ({ id, checked, defaultChecked, onCheckedChange, className, disabled }, ref) => {
        const [internalChecked, setInternalChecked] = React.useState(defaultChecked ?? false)
        const isControlled = checked !== undefined
        const isOn = isControlled ? checked : internalChecked

        const handleClick = () => {
            if (disabled) return
            const next = !isOn
            if (!isControlled) setInternalChecked(next)
            onCheckedChange?.(next)
        }

        return (
            <button
                id={id}
                ref={ref}
                type="button"
                role="switch"
                aria-checked={isOn}
                disabled={disabled}
                onClick={handleClick}
                className={cn(
                    "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                    isOn ? "bg-[#0099CC]" : "bg-muted",
                    className
                )}
            >
                <span
                    className={cn(
                        "pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg transition-transform duration-200",
                        isOn ? "translate-x-5" : "translate-x-0"
                    )}
                />
            </button>
        )
    }
)
Switch.displayName = "Switch"

export { Switch }
