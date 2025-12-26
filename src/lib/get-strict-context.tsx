import { createContext, useContext, type ReactNode } from "react";

function getStrictContext<T>(
  name?: string
): readonly [
  ({
    children,
    value,
  }: {
    value: T;
    children?: ReactNode;
  }) => React.JSX.Element,
  () => T
] {
  const Context = createContext<T | undefined>(undefined);

  function Provider({ children, value }: { value: T; children?: ReactNode }) {
    return <Context.Provider value={value}>{children}</Context.Provider>;
  }

  function useSafeContext() {
    const ctx = useContext(Context);
    if (ctx === undefined) {
      throw new Error(`useContext must be used within ${name ?? "a Provider"}`);
    }
    return ctx;
  }

  return [Provider, useSafeContext] as const;
}

export { getStrictContext };
