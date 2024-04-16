export class User {
    public _id: string;
    public fullName: string;
    public password?: string;
    public gender?: string;
    public username: string;
    public isOnline?: boolean;
    constructor(
        _id: string, 
        fullName: string,  
        password: string, 
        gender: string, 
        username: string,
        isOnline: boolean,
    ) {
        this._id = _id;
        this.fullName = fullName;
        this.password = password;
        this.username = username;
        this.gender = gender;
        this.isOnline = isOnline;
    }
}