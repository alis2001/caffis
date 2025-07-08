// caffis-map-service/backend/src/utils/logger.js
const winston = require('winston');

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Tell winston that you want to link the colors
winston.addColors(colors);

// Define which logs to print to console based on the current environment
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  const logLevel = process.env.LOG_LEVEL || 'info';
  
  if (env === 'development') {
    return logLevel === 'debug' ? 'debug' : 'info';
  }
  return 'warn';
};

// Define different log formats
const format = winston.format.combine(
  // Add timestamp to logs
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  // Add colors to console output
  winston.format.colorize({ all: true }),
  // Define log format
  winston.format.printf((info) => {
    return `${info.timestamp} ${info.level}: ${info.message}`;
  })
);

// Define console transport
const consoleTransport = new winston.transports.Console({
  format: format,
  level: level(),
  handleExceptions: true,
  handleRejections: true
});

// Define file transports for production
const transports = [consoleTransport];

// Add file transports in production
if (process.env.NODE_ENV === 'production') {
  // Error log file
  transports.push(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );

  // Combined log file
  transports.push(
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );
}

// Create the logger
const logger = winston.createLogger({
  level: level(),
  levels,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports,
  exitOnError: false,
});

// Add HTTP request logging method
logger.http = (message, meta = {}) => {
  logger.log('http', message, meta);
};

// Add debug logging method
logger.debug = (message, meta = {}) => {
  logger.log('debug', message, meta);
};

// Stream for Morgan HTTP logging
logger.stream = {
  write: (message) => {
    logger.http(message.trim());
  },
};

module.exports = logger;