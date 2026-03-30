import { Button } from '@odigo/ui/components/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@odigo/ui/components/card';
import { Input } from '@odigo/ui/components/input';
import { Label } from '@odigo/ui/components/label';


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
        <div className="min-h-screen flex items-center justify-center bg-background">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>{HeaderButtonText}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                    <form action={action} className="flex flex-col gap-4">
                        {mode === 'register' && (
                            <div className="flex flex-col gap-2">
                                <Label htmlFor='username'>Username</Label>
                                <Input type='text' name='username' id='username' />
                            </div>
                        )}
                        <div className="flex flex-col gap-2">
                            <Label htmlFor='email'>Email</Label>
                            <Input type='email' name='email' id='email' />
                        </div>
                        <div className="flex flex-col gap-2">
                            <Label htmlFor='password'>Password</Label>
                            <Input type='password' name='password' id='password' />
                        </div>
                        {mode === 'register' && (
                            <div className="flex flex-col gap-2">
                                <Label htmlFor='confirmation'>Confirm Password</Label>
                                <Input type='password' name='confirmation' id='confirmation' />
                            </div>
                        )}
                        <Button type="submit" className="w-full">
                            {HeaderButtonText}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="justify-center">
                    <p className="text-sm text-muted-foreground">{SwitchModeText}</p>
                </CardFooter>
            </Card>
        </div>
    );
}

export default AuthForm;