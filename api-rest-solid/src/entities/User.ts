interface UserProps {
    name: string;
    email: string;
    password: string;
}

export class User {
    public readonly id: string;
    public name: string;
    public email: string;
    public password: string;

    constructor(props: UserProps, id?: string) {
        this.name = props.name;
        this.email = props.email;
        this.password = props.password;
        this.id = id ?? crypto.randomUUID();
    }
}
