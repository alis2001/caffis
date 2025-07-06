const winston = require('winston');

// Simple winston configuration without exitOnError issues
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `🗺️ [${timestamp}] ${level.toUpperCase()}: ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console()
  ],
  exitOnError: false,
  handleExceptions: true,
  handleRejections: true
});

module.exports = logger;
