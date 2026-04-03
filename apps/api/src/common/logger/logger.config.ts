import { format, transports } from 'winston';
import { WinstonModule } from 'nest-winston';
import 'winston-daily-rotate-file';

export const loggerConfig = WinstonModule.createLogger({
  transports: [
    new transports.Console({
      format: format.combine(
        format.timestamp(),
        format.ms(),
        format.colorize(),
        format.printf(({ timestamp, level, message, context, ms }) => {
          return `[Nest] ${timestamp} ${level} [${context || 'Application'}] ${message} ${ms}`;
        }),
      ),
    }),
    new transports.DailyRotateFile({
      filename: 'logs/application-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
      format: format.combine(
        format.timestamp(),
        format.json(),
      ),
    }),
    new transports.DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
      level: 'error',
      format: format.combine(
        format.timestamp(),
        format.json(),
      ),
    }),
  ],
});
