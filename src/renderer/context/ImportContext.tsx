import { createContext, useContext, useReducer, type Dispatch, type ReactNode } from 'react';
import type { Volume, MediaFile, ImportProgress, ImportResult } from '../../shared/types';

export type AppPhase = 'idle' | 'scanning' | 'ready' | 'importing' | 'complete';
export type ViewMode = 'grid' | 'single';

interface State {
  volumes: Volume[];
  selectedSource: string | null;
  files: MediaFile[];
  phase: AppPhase;
  destination: string | null;
  skipDuplicates: boolean;
  importProgress: ImportProgress | null;
  importResult: ImportResult | null;
  focusedIndex: number;
  viewMode: ViewMode;
}

export type Action =
  | { type: 'SET_VOLUMES'; volumes: Volume[] }
  | { type: 'SELECT_SOURCE'; path: string | null }
  | { type: 'SCAN_START' }
  | { type: 'SCAN_BATCH'; files: MediaFile[] }
  | { type: 'SCAN_COMPLETE' }
  | { type: 'SET_DESTINATION'; path: string }
  | { type: 'SET_SKIP_DUPLICATES'; value: boolean }
  | { type: 'IMPORT_START' }
  | { type: 'IMPORT_PROGRESS'; progress: ImportProgress }
  | { type: 'IMPORT_COMPLETE'; result: ImportResult }
  | { type: 'DISMISS_SUMMARY' }
  | { type: 'SET_THUMBNAIL'; filePath: string; thumbnail: string }
  | { type: 'SET_DUPLICATE'; filePath: string }
  | { type: 'CLEAR_DUPLICATES' }
  | { type: 'SET_PICK'; filePath: string; pick: 'selected' | 'rejected' | undefined }
  | { type: 'CLEAR_PICKS' }
  | { type: 'SET_FOCUSED'; index: number }
  | { type: 'SET_VIEW_MODE'; mode: ViewMode }
  | { type: 'RESET_FILES' };

const initialState: State = {
  volumes: [],
  selectedSource: null,
  files: [],
  phase: 'idle',
  destination: null,
  skipDuplicates: true,
  importProgress: null,
  importResult: null,
  focusedIndex: -1,
  viewMode: 'grid' as ViewMode,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_VOLUMES':
      return { ...state, volumes: action.volumes };
    case 'SELECT_SOURCE':
      return { ...state, selectedSource: action.path, files: [], phase: 'idle' };
    case 'SCAN_START':
      return { ...state, files: [], phase: 'scanning', focusedIndex: -1 };
    case 'SCAN_BATCH':
      return { ...state, files: [...state.files, ...action.files] };
    case 'SCAN_COMPLETE':
      return { ...state, phase: state.files.length > 0 ? 'ready' : 'idle' };
    case 'SET_DESTINATION':
      return { ...state, destination: action.path };
    case 'SET_SKIP_DUPLICATES':
      return { ...state, skipDuplicates: action.value };
    case 'IMPORT_START':
      return { ...state, phase: 'importing', importProgress: null, importResult: null };
    case 'IMPORT_PROGRESS':
      return { ...state, importProgress: action.progress };
    case 'IMPORT_COMPLETE':
      return { ...state, phase: 'complete', importResult: action.result };
    case 'DISMISS_SUMMARY':
      return { ...state, phase: 'ready', importResult: null, importProgress: null };
    case 'SET_THUMBNAIL':
      return {
        ...state,
        files: state.files.map((f) =>
          f.path === action.filePath ? { ...f, thumbnail: action.thumbnail } : f,
        ),
      };
    case 'SET_DUPLICATE':
      return {
        ...state,
        files: state.files.map((f) =>
          f.path === action.filePath ? { ...f, duplicate: true } : f,
        ),
      };
    case 'CLEAR_DUPLICATES':
      return {
        ...state,
        files: state.files.map((f) => ({ ...f, duplicate: false })),
      };
    case 'SET_PICK':
      return {
        ...state,
        files: state.files.map((f) =>
          f.path === action.filePath ? { ...f, pick: action.pick } : f,
        ),
      };
    case 'CLEAR_PICKS':
      return {
        ...state,
        files: state.files.map((f) => ({ ...f, pick: undefined })),
      };
    case 'SET_FOCUSED':
      return { ...state, focusedIndex: action.index };
    case 'SET_VIEW_MODE':
      return { ...state, viewMode: action.mode };
    case 'RESET_FILES':
      return { ...state, files: [], phase: 'idle', focusedIndex: -1 };
    default:
      return state;
  }
}

const StateContext = createContext<State>(initialState);
const DispatchContext = createContext<Dispatch<Action>>(() => {});

export function ImportProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <StateContext.Provider value={state}>
      <DispatchContext.Provider value={dispatch}>
        {children}
      </DispatchContext.Provider>
    </StateContext.Provider>
  );
}

export function useAppState() {
  return useContext(StateContext);
}

export function useAppDispatch() {
  return useContext(DispatchContext);
}
