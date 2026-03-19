import { createClient } from '@supabase/supabase-js'
import type { Request, Response, NextFunction } from 'express';

export const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE!,
);

/**
 * Makes sure that the user is authenticated before continuing to the API call
 * 
 * @remarks
 * Checks if the request has the user's JWT token, and if there is 
 * a user in the database that is associated with that token
 * 
 * @param req - The POST request
 * @param res - The POST response
 * @param next - A callback function
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        res.status(401).json({error: 'Authorization token needed!'})
        return;
    }
    
    const { data, error } = await supabase.auth.getUser(token);
    if (error) {
        res.status(401).json({error: 'Invalid Authorization Token!'});
        return;
    }
    
    req.user = data.user;
    next();
}

export default supabase;