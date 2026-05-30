import { useState, useEffect } from 'react';

/**
 * Delays updating a value until the specified delay has elapsed
 * since the last change. Useful for deferring expensive operations
 * like API calls triggered by user input.
 *
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds (default: 300)
 * @returns The debounced value
 *
 * @example
 * const debouncedSearch = useDebounce(searchQuery, 300);
 */
export function useDebounce<T>(value: T, delay = 300): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => clearTimeout(timer);
    }, [value, delay]);

    return debouncedValue;
}
