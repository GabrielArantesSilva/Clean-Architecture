// Contrato comum dos servers (padrão tecnoflow): o entrypoint orquestra uma
// lista de IServer — HttpServer hoje, QueueServer amanhã — sem saber o que
// cada um é por dentro.
export interface IServer {
	start(): Promise<void> | void
	stop(): Promise<void> | void
}
