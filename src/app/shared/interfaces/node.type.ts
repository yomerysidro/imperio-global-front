export interface Nodes{
    title: string;
    value: string;
    key: string;
    children: Nodes[];
    isLeaf: boolean;
}