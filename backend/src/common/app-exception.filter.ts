import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { AppError } from './errors';

interface ErrorBody {
  error: { code: string; message: string };
}

@Catch()
export class AppExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const { status, body } = this.traduzir(exception);
    response.status(status).json(body);
  }

  private traduzir(exception: unknown): { status: number; body: ErrorBody } {
    if (exception instanceof AppError) {
      return {
        status: exception.status,
        body: { error: { code: exception.code, message: exception.message } },
      };
    }

    if (exception instanceof HttpException) {
      return {
        status: exception.getStatus(),
        body: {
          error: {
            code: 'VALIDACAO',
            message: this.mensagemDeHttpException(exception),
          },
        },
      };
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      body: {
        error: {
          code: 'ERRO_INTERNO',
          message: 'Erro inesperado. Tente novamente.',
        },
      },
    };
  }

  // O ValidationPipe embute as mensagens do class-validator em `message: string[]`;
  // a tela mostra uma linha só, então juntamos.
  private mensagemDeHttpException(exception: HttpException): string {
    const resposta = exception.getResponse();

    if (typeof resposta === 'string') {
      return resposta;
    }

    const mensagem = (resposta as { message?: unknown }).message;

    if (Array.isArray(mensagem)) {
      return mensagem.join('. ');
    }

    if (typeof mensagem === 'string') {
      return mensagem;
    }

    return exception.message;
  }
}
