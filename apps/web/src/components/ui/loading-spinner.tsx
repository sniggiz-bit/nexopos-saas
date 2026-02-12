import { ComponentProps } from "react"
import { cn } from "../../lib/utils"

export function LoadingSpinner({
    className,
    ...props
}: ComponentProps<"div">) {
    return (
        <div
            className={cn(
                "flex min-h-[50vh] w-full items-center justify-center",
                className
            )}
            {...props}
        >
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
    )
}
