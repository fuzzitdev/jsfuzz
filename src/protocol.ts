export enum WorkerMessageType {
    RESULT,
    CRASH,
}
export interface WorkerMessage {
    type: WorkerMessageType,
    coverage: number,
    error: number
}

export enum ManageMessageType {
    WORK,
    STOP,
}
export interface ManagerMessage {
    type: ManageMessageType
    buf: string
}