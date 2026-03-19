import styles from './styles/AuthForm.module.css'


type AuthMode = {
    mode: 'login' | 'register',
    action: (formData: FormData) => void;
};

const AuthForm = ({ mode, action}: AuthMode) => {

    const HeaderButtonText = mode === 'login'? 'Login' : 'Register';

    const SwitchModeText = mode === 'login' ? 
    <a href='/auth/register'>Create a New Account</a> : 
    <a href='/auth/login'>I Already Have an Account</a>;

    return (
        <div>
            <h1>{HeaderButtonText}</h1>
            <form action={action}>
                {mode === 'register' && (
                <div>
                    <label htmlFor='username'>Username</label>
                    <input type='text' name='username' id='username'></input>
                </div>
                )}
                <div>
                    <label htmlFor='email'>Email</label>
                    <input type='email' name='email' id='email'></input>
                </div>
                <div>
                    <label htmlFor='password'>Password</label>
                    <input type='password' name='password' id='password'></input>
                </div>
               {mode === 'register' && (
                <div>
                    <label htmlFor='confirmation'>Confirm Password</label>
                    <input type='password' name='confirmation' id='confirmation'></input>
                </div>
               )}
                <div>
                    <p>{SwitchModeText}</p>
                    <button></button>
                </div>
            </form>
        </div>
    );
}

export default AuthForm;