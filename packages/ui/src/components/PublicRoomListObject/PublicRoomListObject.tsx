
import { Button } from '../button';
import { Item, ItemActions, ItemContent, ItemDescription, ItemTitle } from '../item';

type ObjectProps = {
    roomId: string,
    callback: (roomId: string) => void
}

const PublicRoomListObject = ({roomId, callback}: ObjectProps ) => {
    return (
        <div className="flex w-full max-w-md flex-col gap-6">
            <Item variant="outline">
                <ItemContent>
                    <ItemTitle>{roomId}</ItemTitle>
                </ItemContent>
                <ItemActions>
                    <Button onClick={() => callback(roomId)} variant="outline">Join</Button>
                </ItemActions>
            </Item>
        </div>
    ); 

}

export default PublicRoomListObject;