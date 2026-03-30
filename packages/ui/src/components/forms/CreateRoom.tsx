import { Button } from '@odigo/ui/components/button';
import { Card, CardContent, CardHeader, CardTitle } from '@odigo/ui/components/card';
import { Input } from '@odigo/ui/components/input';
import { Label } from '@odigo/ui/components/label';

const CreatePublicRoomForm = ({callback}: {callback: (formData: FormData) => Promise<void>}) => {

    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Create Room</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                    <form action={callback} className="flex flex-col gap-4">
                        <div className="flex flex-col gap-2">
                            <Label htmlFor='room_name'>Room Name</Label>
                            <Input type='text' name='room_name' id='room_name'></Input>
                        </div>
                        <Button type='submit' className="w-full">
                            Create Room
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

export default CreatePublicRoomForm