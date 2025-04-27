import { HTTP_URL } from "@/lib/config";
import { element_type } from "@/lib/types";
import axios from "axios";

import { useState, SetStateAction } from "react";
// TODO: Optimise the history logic to use actions instead of storing whole state
// TODO: Use Batch Updates to DB for state, not instantaneous
type HistorySetter = (
  action: SetStateAction<element_type[]>,
  overwrite?: boolean
) => void;

export function useHistory(
  initialState: element_type[]
): [element_type[], HistorySetter, () => void, () => void] {
  const [history, setHistory] = useState([initialState]);
  const [index, setIndex] = useState(initialState.length > 0 ? 1 : 0);
  const setState = (action: any, overwrite = false) => {
    const newState =
      typeof action === "function" ? action(history[index]) : action;
    if (overwrite) {
      const historyCopy = new Array(...history);
      historyCopy[index] = newState;
      setHistory(historyCopy);
    } else {
      const updatedState = [...history].slice(0, index + 1);
      setHistory([...updatedState, newState]);
      setIndex((prevState) => prevState + 1);
    }
  };

  const undo = () => {
    if (index > 0) {
      if (!history[index]) return;
      setIndex((prevState) => prevState - 1);
    }
  };
  const redo = () => {
    if (index < history.length - 1) {
      setIndex((prevState) => prevState + 1);
    }
  };
  return [history[index] || initialState, setState, undo, redo];
}
