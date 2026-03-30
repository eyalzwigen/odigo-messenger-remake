import { Router } from 'express';
import type { SupabaseClient, Session } from '@supabase/supabase-js'
import { LoginForm, RegisterForm } from '../../../packages/shared/lib/zodSchemas.js';

export default function authRouter (supabase: SupabaseClient) {
    
    const router = Router();

    const sessionResponse = (session: Session) => ({
        access_token: session.access_token,
        refresh_token: session.refresh_token
    });

    router.post('/login', async (req, res): Promise<void> => {
        const result = LoginForm.safeParse(req.body);
        if (!result.success) {
            res.status(400).json({error: result.error});
            return;
        }

        const { data, error } = await supabase.auth.signInWithPassword({
            'email': req.body.email,
            'password': req.body.password
        });

        if (error) {
            res.status(error.status ?? 401).json({error: error.message});
            return;
        }
        
        res.status(200).json(sessionResponse(data.session));
    });


    router.post('/register', async (req, res): Promise<void> => {
        const result = RegisterForm.safeParse(req.body);
        if (!result.success) {
            res.status(400).json({error: result.error});
            return;
        }

        const { data, error } = await supabase.auth.signUp({
            'email': req.body.email,
            'password': req.body.password,
            options: {
                data: { username: req.body.username } 
            }
        });

        if (error) {
            res.status(error.status ?? 401).json({error: error.message});
            return;
        }


        res.status(200).json({ error: null});
    });

    return router;
}