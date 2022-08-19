import { Controller, Get, Req } from '@nestjs/common';
import type { Request } from 'express';

@Controller('')
export class AppController {

  @Get('health')
  async health() {
    return 'Ok'
  }

  @Get('ip')
  async getIp(@Req() req: Request) {
    return {
      ip: req.ip,
      ips: req.ips,
      host: req.headers['x-forwarded-for']
    }
  }
}
