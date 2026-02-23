import { createContext, useContext, useState } from "react";

type FlowState = {
  rootId: string | null;
  chain: string[];
};

type FlowContextType = {
  state: FlowState;
  startFlow: (rootId: string) => void;
  chooseNode: (id: string) => void;
  goBack: () => void;
  reset: () => void;
};

const FlowContext = createContext<FlowContextType | null>(null);

export function FlowProvider({ children }: { children: React.ReactNode }) {

  const [state, setState] = useState<FlowState>({
    rootId: null,
    chain: []
  });

  function startFlow(rootId: string) {
    setState({
      rootId,
      chain: [rootId]
    });
  }

  function chooseNode(id: string) {
    setState(s => ({
      ...s,
      chain: [...s.chain, id]
    }));
  }

  function goBack() {
    setState(s => ({
      ...s,
      chain: s.chain.slice(0, -1)
    }));
  }

  function reset() {
    setState({
      rootId: null,
      chain: []
    });
  }

  return (
    <FlowContext.Provider value={{
      state,
      startFlow,
      chooseNode,
      goBack,
      reset
    }}>
      {children}
    </FlowContext.Provider>
  );
}

export function useFlow() {
  const ctx = useContext(FlowContext);
  if (!ctx) throw new Error("FlowContext missing");
  return ctx;
}