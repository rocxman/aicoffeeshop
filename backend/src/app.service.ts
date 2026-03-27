import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return '☕ Welcome to AI Coffee Shop Assistant Platform!';
  }
}
