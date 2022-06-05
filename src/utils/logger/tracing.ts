require('dotenv-flow').config();

import tracer from 'dd-trace';

// initialized in a different file to avoid hoisting.
tracer.init({
  // https://docs.datadoghq.com/tracing/connect_logs_and_traces/nodejs/
  logInjection: true,
  service: 'backend',
  env: process.env.NETWORK
});

tracer.use("express", {
  hooks: {
    request: (span, req) => {
      if (span && req) {
        span.addTags({
          "request-id": req.headers["x-request-id"],
          "http.user-agent": req.headers["user-agent"],
          "http.url": req.url,
          "http.ip": req.headers["x-forwarded-for"],
          "http.authorization": req.headers["authorization"],
        });
      }
    },
  },
});

export default tracer;
