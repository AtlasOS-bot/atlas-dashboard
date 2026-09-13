import { createContext, useContext } from "react";

const CurrentUserContext = createContext({ email: null, person: null });

export function CurrentUserProvider({ email, person, children }) {
  return (
    <CurrentUserContext.Provider value={{ email, person }}>
      {children}
    </CurrentUserContext.Provider>
  );
}

export function useCurrentUser() {
  return useContext(CurrentUserContext);
}
