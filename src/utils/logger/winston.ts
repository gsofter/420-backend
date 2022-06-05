import { createLogger, format, transports, LoggerOptions } from "winston";

const { combine, timestamp, json } = format;

export const logOptions: LoggerOptions = {
  format: combine(
    timestamp({
      format: "YYYY-MM-DD HH:mm:ss",
    }),
    json()
  ),
  defaultMeta: {
    service: "backend",
  },
  // Datadog / kubernetes picks up logs when written to STDOUT
  transports: [new transports.Console()],
  exceptionHandlers: [new transports.Console()],
};
