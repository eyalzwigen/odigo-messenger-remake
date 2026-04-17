// A single row in the public rooms list.
// Displays the room ID and a "Join" button that calls the parent callback.

import { Button } from "../button";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "../item";

interface ObjectProps {
  /** The unique ID / name of the room to display */
  roomId: string;
  /** Called with roomId when the user clicks "Join" */
  callback: (roomId: string) => void;
}

/**
 * Renders a styled list item for a single public room.
 * Used by the public rooms browser page to display each available room.
 *
 * @param roomId - The room's identifier shown as its title
 * @param callback - Handler called with roomId when the Join button is clicked
 */
const PublicRoomListObject = ({ roomId, callback }: ObjectProps) => {
  return (
    <div className="flex w-full max-w-md flex-col gap-6">
      <Item variant="outline">
        <ItemContent>
          <ItemTitle>{roomId}</ItemTitle>
        </ItemContent>
        <ItemActions>
          <Button onClick={() => callback(roomId)} variant="outline">
            Join
          </Button>
        </ItemActions>
      </Item>
    </div>
  );
};

export default PublicRoomListObject;
