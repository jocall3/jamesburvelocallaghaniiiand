export interface SortOptions<T> {
  /** The key of the property to sort by. */
  key: keyof T;
  /** The sort order: 'asc' for ascending, 'desc' for descending. Defaults to 'asc'. */
  order?: 'asc' | 'desc';
  /**
   * An optional custom comparator function for complex types or specific sorting logic.
   * It should return a negative number if a < b, a positive number if a > b, and 0 if a == b.
   */
  comparator?: (a: T[keyof T], b: T[keyof T]) => number;
}

/**
 * Filters an array of objects based on a predicate function.
 * This function returns a new array and does not mutate the original.
 *
 * @template T The type of objects in the array.
 * @param {T[]} data The array of objects to filter.
 * @param {(item: T, index: number, array: T[]) => boolean} predicate A function that returns true for elements to keep.
 * @returns {T[]} A new array containing only the filtered elements.
 */
export function filterData<T>(data: T[], predicate: (item: T, index: number, array: T[]) => boolean): T[] {
  if (!Array.isArray(data)) {
    console.warn("filterData received non-array data:", data);
    return [];
  }
  return data.filter(predicate);
}

/**
 * Filters an array of objects based on a simple key-value match.
 * This function returns a new array and does not mutate the original.
 *
 * @template T The type of objects in the array.
 * @template K The type of the key to filter by.
 * @param {T[]} data The array of objects to filter.
 * @param {K} key The key of the property to match.
 * @param {T[K]} value The value to match against.
 * @param {boolean} [caseSensitive=false] Whether string comparisons should be case-sensitive (default: false).
 * @returns {T[]} A new array containing only the filtered elements.
 */
export function filterByKey<T, K extends keyof T>(
  data: T[],
  key: K,
  value: T[K],
  caseSensitive: boolean = false
): T[] {
  if (!Array.isArray(data)) {
    console.warn("filterByKey received non-array data:", data);
    return [];
  }

  if (typeof value === 'string' && !caseSensitive) {
    const lowerCaseValue = (value as string).toLowerCase();
    return data.filter(item => {
      const itemValue = item[key];
      return typeof itemValue === 'string' && itemValue.toLowerCase().includes(lowerCaseValue);
    });
  }
  return data.filter(item => item[key] === value);
}

/**
 * Sorts an array of objects based on one or more keys.
 * Supports ascending and descending order, and handles different data types (strings, numbers, dates).
 * This function returns a new array and does not mutate the original.
 *
 * @template T The type of objects in the array.
 * @param {T[]} data The array of objects to sort.
 * @param {SortOptions<T>[]} options An array of sort options, each specifying a key and order.
 *                                   Sorting is applied in the order of options provided.
 * @returns {T[]} A new array containing the sorted elements.
 */
export function sortData<T>(data: T[], options: SortOptions<T>[]): T[] {
  if (!Array.isArray(data)) {
    console.warn("sortData received non-array data:", data);
    return [];
  }
  if (options.length === 0) {
    return [...data]; // Return a shallow copy if no sort options
  }

  // Create a shallow copy to avoid mutating the original array
  const sortedData = [...data];

  sortedData.sort((a, b) => {
    for (const option of options) {
      const { key, order = 'asc', comparator } = option;

      const valA = a[key];
      const valB = b[key];

      let comparison = 0;

      if (comparator) {
        comparison = comparator(valA, valB);
      } else if (typeof valA === 'string' && typeof valB === 'string') {
        comparison = valA.localeCompare(valB);
      } else if (typeof valA === 'number' && typeof valB === 'number') {
        comparison = valA - valB;
      } else if (valA instanceof Date && valB instanceof Date) {
        comparison = valA.getTime() - valB.getTime();
      } else if (valA === null || valA === undefined) {
        comparison = (valB === null || valB === undefined) ? 0 : -1; // Nulls/undefined at the end
      } else if (valB === null || valB === undefined) {
        comparison = 1; // Nulls/undefined at the end
      } else {
        // Fallback for other types, try string comparison
        comparison = String(valA).localeCompare(String(valB));
      }

      if (comparison !== 0) {
        return order === 'desc' ? -comparison : comparison;
      }
    }
    return 0; // Elements are equal based on all sort criteria
  });

  return sortedData;
}

/**
 * Groups an array of objects by a specified key.
 * This function returns a new object and does not mutate the original array.
 *
 * @template T The type of objects in the array.
 * @template K The type of the key to group by.
 * @param {T[]} data The array of objects to group.
 * @param {K} key The key by which to group the objects. The value of this key will be used as the group identifier.
 * @returns {Record<string | number | symbol, T[]>} An object where keys are the unique values of the specified key,
 *                                                 and values are arrays of objects belonging to that group.
 */
export function groupBy<T, K extends keyof T>(data: T[], key: K): Record<string | number | symbol, T[]> {
  if (!Array.isArray(data)) {
    console.warn("groupBy received non-array data:", data);
    return {};
  }
  return data.reduce((acc, item) => {
    const groupKey = item[key];
    if (groupKey !== undefined && groupKey !== null) {
      const keyString = String(groupKey); // Ensure key is a string for object property
      if (!acc[keyString]) {
        acc[keyString] = [];
      }
      acc[keyString].push(item);
    }
    return acc;
  }, {} as Record<string | number | symbol, T[]>);
}

/**
 * Extracts a specific property from each object in an array.
 * This function returns a new array and does not mutate the original.
 *
 * @template T The type of objects in the array.
 * @template K The type of the key to extract.
 * @param {T[]} data The array of objects.
 * @param {K} key The key of the property to extract.
 * @returns {T[K][]} An array containing the values of the specified property.
 */
export function pluck<T, K extends keyof T>(data: T[], key: K): T[K][] {
  if (!Array.isArray(data)) {
    console.warn("pluck received non-array data:", data);
    return [];
  }
  return data.map(item => item[key]);
}

/**
 * Transforms an array of objects into a new array of objects using a mapping function.
 * This is essentially a typed wrapper around `Array.prototype.map`.
 * This function returns a new array and does not mutate the original.
 *
 * @template T The type of objects in the input array.
 * @template U The type of objects in the output array after transformation.
 * @param {T[]} data The array of objects to transform.
 * @param {(item: T, index: number, array: T[]) => U} mapper A function that transforms each item into a new type.
 * @returns {U[]} A new array containing the transformed elements.
 */
export function transformData<T, U>(data: T[], mapper: (item: T, index: number, array: T[]) => U): U[] {
  if (!Array.isArray(data)) {
    console.warn("transformData received non-array data:", data);
    return [];
  }
  return data.map(mapper);
}

/**
 * Paginates an array of data, returning only the items for the specified page.
 * This function returns a new array and does not mutate the original.
 *
 * @template T The type of items in the array.
 * @param {T[]} data The array of data to paginate.
 * @param {number} pageNumber The current page number (1-indexed). Must be a positive integer.
 * @param {number} pageSize The number of items per page. Must be a positive integer.
 * @returns {T[]} An array containing the items for the specified page.
 */
export function paginateData<T>(data: T[], pageNumber: number, pageSize: number): T[] {
  if (!Array.isArray(data)) {
    console.warn("paginateData received non-array data:", data);
    return [];
  }
  if (pageNumber < 1 || pageSize < 1) {
    console.warn("paginateData received invalid pageNumber or pageSize. Both must be positive integers.");
    return [];
  }

  const startIndex = (pageNumber - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  return data.slice(startIndex, endIndex);
}

/**
 * Calculates pagination metadata for a given dataset.
 *
 * @param {number} totalItems The total number of items in the dataset.
 * @param {number} pageNumber The current page number (1-indexed).
 * @param {number} pageSize The number of items per page.
 * @returns {{
 *   totalItems: number;
 *   pageSize: number;
 *   pageNumber: number;
 *   totalPages: number;
 *   hasNextPage: boolean;
 *   hasPreviousPage: boolean;
 *   currentPageItems: number;
 *   startIndex: number;
 *   endIndex: number;
 * }} An object containing pagination details.
 */
export function getPaginationMetadata(totalItems: number, pageNumber: number, pageSize: number) {
  if (totalItems < 0 || pageNumber < 1 || pageSize < 1) {
    console.warn("getPaginationMetadata received invalid input. totalItems must be non-negative, pageNumber and pageSize must be positive.");
    return {
      totalItems: 0, pageSize: 0, pageNumber: 1, totalPages: 0,
      hasNextPage: false, hasPreviousPage: false, currentPageItems: 0,
      startIndex: 0, endIndex: 0
    };
  }

  const totalPages = Math.ceil(totalItems / pageSize);
  const hasNextPage = pageNumber < totalPages;
  const hasPreviousPage = pageNumber > 1;
  const startIndex = (pageNumber - 1) * pageSize;
  const endIndex = Math.min(pageNumber * pageSize - 1, totalItems - 1);
  const currentPageItems = Math.max(0, endIndex - startIndex + 1);

  return {
    totalItems,
    pageSize,
    pageNumber,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    currentPageItems,
    startIndex,
    endIndex,
  };
}

/**
 * Performs a deep clone of an object or array.
 * This is useful for ensuring immutability when modifying data.
 *
 * Note: This function handles JSON-serializable types (primitives, arrays, plain objects, Dates).
 * It will not correctly clone functions, RegExps, Maps, Sets, or other complex objects
 * that are not directly supported by JSON.stringify/parse or simple recursion.
 * For more robust deep cloning, consider a library like 'lodash.clonedeep'.
 *
 * @template T The type of the object or array to clone.
 * @param {T} obj The object or array to clone.
 * @returns {T} A deep copy of the input.
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime()) as T;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => deepClone(item)) as T;
  }

  // Handle plain objects
  const clonedObj = {} as T;
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      clonedObj[key] = deepClone(obj[key]);
    }
  }
  return clonedObj;
}

/**
 * Deeply merges two or more objects. Properties in later objects
 * overwrite properties in earlier objects. Arrays are replaced, not merged.
 * This function returns a new object and does not mutate the original inputs.
 *
 * Note: This function handles JSON-serializable types (primitives, arrays, plain objects, Dates).
 * It will not correctly merge functions, RegExps, Maps, Sets, or other complex objects.
 *
 * @template T The base type of the objects to merge.
 * @param {T} target The initial object to merge into.
 * @param {Partial<T>[]} sources One or more source objects to merge from.
 * @returns {T} A new object representing the deep merge of all inputs.
 */
export function deepMerge<T extends object>(target: T, ...sources: Partial<T>[]): T {
  if (target === null || typeof target !== 'object') {
    return target;
  }

  const output = deepClone(target); // Start with a deep clone of the target

  for (const source of sources) {
    if (source !== null && typeof source === 'object') {
      for (const key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          const sourceValue = source[key];
          const targetValue = output[key];

          if (sourceValue !== null && typeof sourceValue === 'object' &&
              targetValue !== null && typeof targetValue === 'object' &&
              !Array.isArray(sourceValue) && !Array.isArray(targetValue) &&
              !(sourceValue instanceof Date) && !(targetValue instanceof Date)) {
            // Both are plain objects, recurse
            output[key] = deepMerge(targetValue as object, sourceValue as object) as T[Extract<keyof T, string>];
          } else {
            // Otherwise, directly assign (overwrite)
            output[key] = deepClone(sourceValue) as T[Extract<keyof T, string>];
          }
        }
      }
    }
  }
  return output;
}