import { useCallback, useEffect, useState } from "react";

type CommonControlledStateProps<T> = {
  defaultValue?: T;
  value?: T;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useControlledState<T, Rest extends any[] = []>(
  props: CommonControlledStateProps<T> & {
    onChange?: (value: T, ...args: Rest) => void;
  }
): readonly [T, (next: T, ...args: Rest) => void] {
  const { defaultValue, onChange, value } = props;

  const [state, setInternalState] = useState<T>(
    value !== undefined ? value : (defaultValue as T)
  );

  useEffect(() => {
    if (value !== undefined) setInternalState(value);
  }, [value]);

  const setState = useCallback(
    (next: T, ...args: Rest) => {
      setInternalState(next);
      onChange?.(next, ...args);
    },
    [onChange]
  );

  return [state, setState] as const;
}
