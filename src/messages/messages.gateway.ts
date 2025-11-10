import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: true })
export class MessagesGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('send_message')
  handleMessage(
    @MessageBody() data: { sender: string; text: string },
    @ConnectedSocket() client: Socket,
  ) {
    this.server.emit('receive_message', data);
  }
}
