import { useEffect, useRef, useCallback } from "react";

type debounceCallback = (...args: any[]) => void;

function useDebounce(callback: debounceCallback, delay: number = 1000) {
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const debounceFunction = useCallback(
        (...args: any[]) => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }
            timeoutRef.current = setTimeout(() => {
                callback(...args);
            }, delay)
        },
        [callback, delay]
    );

    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }
        }
    }, [])
    return debounceFunction
}

export default useDebounce;