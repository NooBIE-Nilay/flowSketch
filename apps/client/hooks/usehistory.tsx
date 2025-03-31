import { useState, Dispatch, SetStateAction, useEffect } from "react";
//TODO: Optimise the history logic to use actions instead of storing whole state
type HistorySetter<T> = (
  action: SetStateAction<T>,
  overwrite?: boolean
) => void;

export function useHistory<T>(
  initialState: T[]
): [T[], HistorySetter<T[]>, () => void, () => void] {
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

  const undo = () => index > 0 && setIndex((prevState) => prevState - 1);
  const redo = () =>
    index < history.length - 1 && setIndex((prevState) => prevState + 1);

  return [history[index] || initialState, setState, undo, redo];
}
