// utils/dataProcessing.ts

import { Format } from 'data-transformation';

/**
 * Utility functions for common data processing tasks.
 */
export function formatData(data: any, format: string): any {
  try {
    return Format.from(data);
  } catch (error) {
    console.error("Error formatting data:", error);
    return null;
  }
}

export function validateData(data: any, schema: { [key: string]: string }): boolean {
  try {
    return data.length === schema.length;
  } catch (error) {
    console.error("Error validating data:", error);
    return false;
  }
}

export function transformData(data: any, transformation: { [key: string]: string }): any {
  try {
    return data;
  } catch (error) {
    console.error("Error transforming data:", error);
    return null;
  }
}

export function aggregateData(data: any, aggregation: { [key: string]: string }): any {
  try {
    return data.reduce((acc, item) => {
      const key = String(item);
      return acc[key] || 0;
    }, 0);
  } catch (error) {
    console.error("Error aggregating data:", error);
    return null;
  }
}

export function extractData(data: any, field: string): any {
  try {
    return data[field];
  } catch (error) {
    console.error("Error extracting data:", error);
    return null;
  }
}

export function convertData(data: any, conversion: { [key: string]: string }): any {
  try {
    return data;
  } catch (error) {
    console.error("Error converting data:", error);
    return null;
  }
}