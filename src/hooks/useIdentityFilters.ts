import { useState, useMemo, useCallback } from 'react';

// Define the structure for the filters state
export interface IdentityFiltersState {
  searchQuery: string;
  applicationType: string | null;
  accountEnabled: boolean | null;
  applicationVisibility: string | null;
  assignmentRequired: boolean | null;
  isAppProxy: boolean | null;
  createdFrom: string | null;
  createdTo: string | null;
}

// Define the structure for the filter actions
export interface IdentityFiltersActions {
  setSearchQuery: (query: string) => void;
  setApplicationType: (type: string | null) => void;
  setAccountEnabled: (enabled: boolean | null) => void;
  setApplicationVisibility: (visibility: string | null) => void;
  setAssignmentRequired: (required: boolean | null) => void;
  setIsAppProxy: (isProxy: boolean | null) => void;
  setCreatedFrom: (date: string | null) => void;
  setCreatedTo: (date: string | null) => void;
  clearAllFilters: () => void;
  setFilters: (filters: Partial<IdentityFiltersState>) => void;
}

const initialFiltersState: IdentityFiltersState = {
  searchQuery: '',
  applicationType: null,
  accountEnabled: null,
  applicationVisibility: null,
  assignmentRequired: null,
  isAppProxy: null,
  createdFrom: null,
  createdTo: null,
};

export const useIdentityFilters = (): [IdentityFiltersState, IdentityFiltersActions] => {
  const [filters, setFiltersState] = useState<IdentityFiltersState>(initialFiltersState);

  const setSearchQuery = useCallback((query: string) => {
    setFiltersState(prev => ({ ...prev, searchQuery: query }));
  }, []);

  const setApplicationType = useCallback((type: string | null) => {
    setFiltersState(prev => ({ ...prev, applicationType: type }));
  }, []);

  const setAccountEnabled = useCallback((enabled: boolean | null) => {
    setFiltersState(prev => ({ ...prev, accountEnabled: enabled }));
  }, []);

  const setApplicationVisibility = useCallback((visibility: string | null) => {
    setFiltersState(prev => ({ ...prev, applicationVisibility: visibility }));
  }, []);

  const setAssignmentRequired = useCallback((required: boolean | null) => {
    setFiltersState(prev => ({ ...prev, assignmentRequired: required }));
  }, []);

  const setIsAppProxy = useCallback((isProxy: boolean | null) => {
    setFiltersState(prev => ({ ...prev, isAppProxy: isProxy }));
  }, []);

  const setCreatedFrom = useCallback((date: string | null) => {
    setFiltersState(prev => ({ ...prev, createdFrom: date }));
  }, []);

  const setCreatedTo = useCallback((date: string | null) => {
    setFiltersState(prev => ({ ...prev, createdTo: date }));
  }, []);

  const clearAllFilters = useCallback(() => {
    setFiltersState(initialFiltersState);
  }, []);

  const setFilters = useCallback((newFilters: Partial<IdentityFiltersState>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }));
  }, []);

  const actions: IdentityFiltersActions = useMemo(() => ({
    setSearchQuery,
    setApplicationType,
    setAccountEnabled,
    setApplicationVisibility,
    setAssignmentRequired,
    setIsAppProxy,
    setCreatedFrom,
    setCreatedTo,
    clearAllFilters,
    setFilters,
  }), [
    setSearchQuery,
    setApplicationType,
    setAccountEnabled,
    setApplicationVisibility,
    setAssignmentRequired,
    setIsAppProxy,
    setCreatedFrom,
    setCreatedTo,
    clearAllFilters,
    setFilters
  ]);

  return [filters, actions];
};

// Helper hook to create filters suitable for an API query based on the state
export const useIdentityQueryFilters = (filters: IdentityFiltersState) => {
  return useMemo(() => {
    const query: Record<string, string | number | boolean> = {};

    if (filters.searchQuery) {
      query['search'] = filters.searchQuery;
    }
    if (filters.applicationType) {
      query['applicationType'] = filters.applicationType;
    }
    if (filters.accountEnabled !== null) {
      query['accountEnabled'] = filters.accountEnabled;
    }
    if (filters.applicationVisibility) {
      query['applicationVisibility'] = filters.applicationVisibility;
    }
    if (filters.assignmentRequired !== null) {
      query['assignmentRequired'] = filters.assignmentRequired;
    }
    if (filters.isAppProxy !== null) {
      query['isAppProxy'] = filters.isAppProxy;
    }
    if (filters.createdFrom) {
      query['createdFrom'] = filters.createdFrom;
    }
    if (filters.createdTo) {
      query['createdTo'] = filters.createdTo;
    }

    return query;
  }, [filters]);
};
