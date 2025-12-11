import {
    Identity,
    IdentityState,
    IdentityActionTypes,
    SortConfig,
    SortDirection,
    SET_INITIAL_DATA,
    SET_FILTER,
    SET_SORT,
    UPDATE_IDENTITY,
} from '../types';

const initialState: IdentityState = {
    allIdentities: [],
    displayIdentities: [],
    sortConfig: null,
    filterQuery: '',
};

const applyFilterAndSort = (
    identities: Identity[],
    filterQuery: string,
    sortConfig: SortConfig | null
): Identity[] => {
    let processedIdentities = [...identities];

    // Apply filter
    if (filterQuery) {
        const lowercasedQuery = filterQuery.toLowerCase();
        processedIdentities = processedIdentities.filter(item =>
            Object.values(item).some(value =>
                String(value).toLowerCase().includes(lowercasedQuery)
            )
        );
    }

    // Apply sort
    if (sortConfig !== null) {
        const { key, direction } = sortConfig;
        processedIdentities.sort((a, b) => {
            const valA = a[key] ?? '';
            const valB = b[key] ?? '';
            const modifier = direction === 'asc' ? 1 : -1;

            if (key === 'accountEnabled' || key === 'assignmentRequired' || key === 'isAppProxy') {
                const boolA = valA === 'True';
                const boolB = valB === 'True';
                if (boolA === boolB) return 0;
                return (boolA > boolB ? 1 : -1) * modifier;
            }

            if (key === 'createdDateTime') {
                const dateA = new Date(valA || 0).getTime();
                const dateB = new Date(valB || 0).getTime();
                if (isNaN(dateA) || isNaN(dateB)) return 0;
                return (dateA - dateB) * modifier;
            }

            if (typeof valA === 'string' && typeof valB === 'string') {
                return valA.localeCompare(valB) * modifier;
            }

            if (valA < valB) return -1 * modifier;
            if (valA > valB) return 1 * modifier;
            return 0;
        });
    }

    return processedIdentities;
};

const identityReducer = (state = initialState, action: IdentityActionTypes): IdentityState => {
    switch (action.type) {
        case SET_INITIAL_DATA:
            return {
                ...state,
                allIdentities: action.payload,
                displayIdentities: applyFilterAndSort(action.payload, state.filterQuery, state.sortConfig),
            };

        case SET_FILTER: {
            const filterQuery = action.payload;
            const displayIdentities = applyFilterAndSort(
                state.allIdentities,
                filterQuery,
                state.sortConfig
            );
            return {
                ...state,
                filterQuery,
                displayIdentities,
            };
        }

        case SET_SORT: {
            const key = action.payload;
            let newDirection: SortDirection = 'asc';
            if (state.sortConfig && state.sortConfig.key === key && state.sortConfig.direction === 'asc') {
                newDirection = 'desc';
            }
            const newSortConfig: SortConfig = { key, direction: newDirection };

            const displayIdentities = applyFilterAndSort(
                state.allIdentities,
                state.filterQuery,
                newSortConfig
            );

            return {
                ...state,
                sortConfig: newSortConfig,
                displayIdentities,
            };
        }

        case UPDATE_IDENTITY: {
            const { id, field, value } = action.payload;

            const updateItem = (item: Identity): Identity =>
                item.id === id ? { ...item, [field]: value } : item;

            const newAllIdentities = state.allIdentities.map(updateItem);

            const newDisplayIdentities = applyFilterAndSort(
                newAllIdentities,
                state.filterQuery,
                state.sortConfig
            );

            return {
                ...state,
                allIdentities: newAllIdentities,
                displayIdentities: newDisplayIdentities,
            };
        }

        default:
            return state;
    }
};

export default identityReducer;