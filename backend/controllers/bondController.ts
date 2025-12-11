import { Request, Response } from 'express';
import * as bondService from '../services/bondService'; // Assuming a service layer handles business logic and data access

/**
 * Handles common error responses for controller methods.
 * @param res The Express response object.
 * @param error The error object caught.
 * @param defaultMessage A default error message if the error is not an instance of Error.
 * @param statusCode The HTTP status code to send.
 */
const handleControllerError = (res: Response, error: unknown, defaultMessage: string = 'Internal Server Error', statusCode: number = 500) => {
    if (error instanceof Error) {
        console.error(`Error in bond controller: ${error.message}`);
        return res.status(statusCode).json({ message: error.message });
    }
    console.error(`Unknown error in bond controller: ${error}`);
    return res.status(statusCode).json({ message: defaultMessage });
};

/**
 * Searches for bonds based on a query string.
 * Expects a query parameter 'q' from the request.
 *
 * Example: GET /api/bonds/search?q=USA
 */
export const searchBonds = async (req: Request, res: Response) => {
    try {
        const { q } = req.query; // 'q' is the search query string

        if (!q || typeof q !== 'string') {
            return res.status(400).json({ message: 'Search query parameter "q" is required and must be a string.' });
        }

        // Delegate the search logic to the bond service
        const bonds = await bondService.searchBonds(q as string);

        if (!bonds || bonds.length === 0) {
            return res.status(404).json({ message: `No bonds found matching "${q}".` });
        }

        res.status(200).json(bonds);
    } catch (error) {
        handleControllerError(res, error, 'Failed to search for bonds.');
    }
};

/**
 * Retrieves detailed information for a specific bond by its ISIN.
 * Expects the bond ISIN as a URL parameter.
 *
 * Example: GET /api/bonds/:isin (e.g., /api/bonds/US912796P781)
 */
export const getBondDetails = async (req: Request, res: Response) => {
    try {
        const { isin } = req.params; // ISIN from URL parameter

        if (!isin) {
            return res.status(400).json({ message: 'Bond ISIN is required as a URL parameter.' });
        }

        // Delegate the detail retrieval to the bond service
        const bond = await bondService.getBondDetails(isin);

        if (!bond) {
            return res.status(404).json({ message: `Bond with ISIN "${isin}" not found.` });
        }

        res.status(200).json(bond);
    } catch (error) {
        handleControllerError(res, error, `Failed to retrieve details for bond with ISIN "${isin}".`);
    }
};

/**
 * Fetches the latest bond issues.
 *
 * Example: GET /api/bonds/latest-issues
 */
export const getLatestIssues = async (req: Request, res: Response) => {
    try {
        // You might want to add pagination or a limit here in a real application
        const latestIssues = await bondService.getLatestIssues();

        if (!latestIssues || latestIssues.length === 0) {
            return res.status(404).json({ message: 'No latest bond issues found.' });
        }

        res.status(200).json(latestIssues);
    } catch (error) {
        handleControllerError(res, error, 'Failed to retrieve latest bond issues.');
    }
};