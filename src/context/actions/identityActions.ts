import { Identity, SortConfig } from '../reducers/identityReducer';

// Action Type Constants
export const LOAD_IDENTITIES_START = 'LOAD_IDENTITIES_START';
export const LOAD_IDENTITIES_SUCCESS = 'LOAD_IDENTITIES_SUCCESS';
export const LOAD_IDENTITIES_ERROR = 'LOAD_IDENTITIES_ERROR';

export const SET_FILTER = 'SET_FILTER';
export const SET_SORT = 'SET_SORT';
export const CLEAR_FILTERS = 'CLEAR_FILTERS';
export const SET_SEARCH_TERM = 'SET_SEARCH_TERM';

// Action Interfaces
interface LoadIdentitiesStartAction {
  type: typeof LOAD_IDENTITIES_START;
}

interface LoadIdentitiesSuccessAction {
  type: typeof LOAD_IDENTITIES_SUCCESS;
  payload: Identity[];
}

interface LoadIdentitiesErrorAction {
  type: typeof LOAD_IDENTITIES_ERROR;
  payload: string; // Error message
}

interface SetFilterAction {
  type: typeof SET_FILTER;
  payload: { key: keyof Identity; value: string };
}

interface SetSortAction {
  type: typeof SET_SORT;
  payload: SortConfig;
}

interface ClearFiltersAction {
  type: typeof CLEAR_FILTERS;
}

interface SetSearchTermAction {
  type: typeof SET_SEARCH_TERM;
  payload: string;
}

// Union type for all possible identity actions
export type IdentityAction =
  | LoadIdentitiesStartAction
  | LoadIdentitiesSuccessAction
  | LoadIdentitiesErrorAction
  | SetFilterAction
  | SetSortAction
  | ClearFiltersAction
  | SetSearchTermAction;

// Action Creators
export const loadIdentitiesStart = (): LoadIdentitiesStartAction => ({
  type: LOAD_IDENTITIES_START,
});

export const loadIdentitiesSuccess = (identities: Identity[]): LoadIdentitiesSuccessAction => ({
  type: LOAD_IDENTITIES_SUCCESS,
  payload: identities,
});

export const loadIdentitiesError = (error: string): LoadIdentitiesErrorAction => ({
  type: LOAD_IDENTITIES_ERROR,
  payload: error,
});

export const setFilter = (key: keyof Identity, value: string): SetFilterAction => ({
  type: SET_FILTER,
  payload: { key, value },
});

export const setSort = (sortConfig: SortConfig): SetSortAction => ({
  type: SET_SORT,
  payload: sortConfig,
});

export const clearFilters = (): ClearFiltersAction => ({
  type: CLEAR_FILTERS,
});

export const setSearchTerm = (term: string): SetSearchTermAction => ({
    type: SET_SEARCH_TERM,
    payload: term,
});