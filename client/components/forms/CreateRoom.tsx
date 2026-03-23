import styles from './styles/CreateRoom.module.css'

const CreatePublicRoomForm = ({callback}: {callback: (formData: FormData) => Promise<void>}) => {

    return (
        <div>
            <h1>Create Room</h1>
            <form action={callback}>
                <div>
                    <label htmlFor='room_name'>Room Name</label>
                    <input type='text' name='room_name' id='room_name'></input>
                </div>
                <div>
                    <input type='submit' value='Create Room'/>
                </div>
            </form>
        </div>
    );
}

export default CreatePublicRoomForm