
import styles from './PublicRoomListObject.module.css'

type ObjectProps = {
    roomId: string,
    callback: (roomId: string) => void
}

const PublicRoomListObject = ({roomId, callback}: ObjectProps ) => {
    return (
        <div className={styles.RoomListObject}>
            <p>{roomId}</p>
            <button onClick={() => callback(roomId)}>Join</button>
        </div>
    ); 

}

export default PublicRoomListObject;