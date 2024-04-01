export enum Action {
    login = "login",
    register = "register"
}

export interface CredentialsI {
    email: string;
    password: string;
    name?: string;
}