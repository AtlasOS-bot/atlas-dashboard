import { createContext, useContext, useState } from "react";

const ModuleContext = createContext(null);

export function ModuleProvider({ children }) {
  const [module, setModule] = useState("resale");

  return (
    <ModuleContext.Provider value={{ module, setModule }}>
      {children}
    </ModuleContext.Provider>
  );
}

export function useModule() {
  return useContext(ModuleContext);
}
