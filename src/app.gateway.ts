import {
  SubscribeMessage,
  WebSocketGateway,
  OnGatewayInit,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Socket, Server } from 'socket.io';

type EmitGen0BudsBurnedPayload = {
  success: boolean;
  data: {
    address: string;
    maleBudId?: number;
    femaleBudId?: number;
    newBudId?: number;
  };
};

@WebSocketGateway({
  cors: {
    origin: "*",
    methods: ["GET", "HEAD", "POST", "OPTIONS"],
    allowedHeaders: ["X-Socket-Event"],
    credentials: true
  },
})
export class AppGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;

  private logger: Logger = new Logger('AppGateway');

  // @SubscribeMessage('simulateFailure')
  // handleFailure(client: Socket, payload: string): void {
  //   this.server.emit('gen0BudsBurned', {
  //     success: false,
  //     data: {
  //       address: payload
  //     }
  //   });
  // }

  // @SubscribeMessage('simulateSuccess')
  // handleSuccess(client: Socket, payload: string): void {
  //   this.server.emit('gen0BudsBurned', {
  //     success: true,
  //     data: {
  //       address: payload,
  //       maleBudId: 1,
  //       femaleBudId: 2,
  //       newBudId: 2,
  //     }
  //   });
  // }

  emitGen0BudsBurned(payload: EmitGen0BudsBurnedPayload) {
    this.server.emit('gen0BudsBurned', payload);
  }

  afterInit(server: Server) {
    this.logger.log('Init');
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  handleConnection(client: Socket, ...args: any[]) {
    this.logger.log(`Client connected: ${client.id}`);
  }
}
