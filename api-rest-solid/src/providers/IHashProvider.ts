export interface IHashProvider {
    hash(payload: string): Promise<string>;
}
