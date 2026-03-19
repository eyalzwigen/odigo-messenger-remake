const host: string = process.env.EXPRESS_SERVER_HOST ?? 'http://localhost:8080';

/**
 * An handler function that is used to log in a user
 * 
 * @remarks
 * The function sends a POST request to /api/auth/login
 * with an email and a password. The API function uses an admin client
 * (client with service role) and logs in the user. 
 * 
 * @param email - The user's email
 * @param password  - The user's password
 * @returns a Promise of:
 * an access token, a refresh token, and a @null error if there were no errors
 * a @null access token, a @null refresh token, and an error if there was an error
 */
export async function handleLogin(

    email: string, 
    password: string
    
): Promise<
{access_token: string, refresh_token: string, error: null} | 
{access_token: null, refresh_token: null, error: string}> 
{

    const req = await fetch(`${host}/api/auth/login`, {
        method: 'POST',
        body: JSON.stringify({
            email: email, 
            password: password
        }),
        headers: {'Content-Type': 'application/json'}
    });

    const res = await req.json();
    if (res.error) return {access_token: null, refresh_token: null, error: res.error};

    return {access_token: res.access_token, refresh_token: res.refresh_token, error: null};

}


/**
 * An handler function that is used to register a user
 * 
 * @remarks
 * The function sends a POST request to /api/auth/register
 * with a a username, email, a password, and a password confirmation. 
 * The API function uses an admin client (client with service role) registers the user. 
 * 
 * @param userName - New account's username
 * @param email  - New account's email
 * @param password - New account's password
 * @param confirmation - New account's password confirmation
 * @returns a Promise of:
 * @null if there were no errors (User needs to confirm their email)
 * @string if there was an error
 */
export async function handleRegisteration(
    userName: string,
    email: string, 
    password: string,
    confirmation: string

): Promise<null | string> {

    const req = await fetch(`${host}/api/auth/register`, {
        method: 'POST',
        body: JSON.stringify({
            username: userName,
            email: email, 
            password: password,
            confirmation: confirmation
        }),
        headers: {'Content-Type': 'application/json'}
    });

    const res = await req.json();
    if (res.error) return res.error; // An error occured when registering user


    return null // User needs email confirmation before accessing account

}