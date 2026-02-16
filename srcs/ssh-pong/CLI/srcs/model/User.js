import {v4 as uuidv4} from "uuid";

class User
{
    constructor()
    {
        this.token = null;
        this.socket = null;
        this.uuid = uuidv4();
		this.side = null;
		this.twoFA = null;
    }
}

export default User;