import { format, createLogger, transports } from "winston";

const logger = createLogger({
  level: "info",
  format: format.combine(format.colorize({ all: true })),
  transports: [
    new transports.Console({
      format: format.simple(),
    }),
  ],
});

export default logger;
