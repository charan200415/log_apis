const express = require('express');
    const axios = require('axios');
    const WebSocket = require('ws');
    const http = require('http');
    const moment = require('moment-timezone');

    const app = express();
    const server = http.createServer(app);
    const wss = new WebSocket.Server({ server });

    const logs = [];

    app.use(express.json());

    app.get('/', (req, res) => {
      res.sendFile(__dirname + '/index.html');
    });

    app.post('/api', async (req, res) => {
      const { method, url, headers, body } = req;
      const timestamp = moment().tz('Asia/Kolkata').format();

      const logEntry = {
        method,
        url,
        headers,
        body,
        timestamp,
      };

      logs.push(logEntry);

      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ type: 'log', log: logEntry }));
        }
      });

      try {
        const fastApiUrl = 'https://charan5775-fastest.hf.space/chat';
        const fastApiData = {
          query: req.body.body.query,
        };

        if (req.body.body.stream !== undefined) {
          fastApiData.stream = req.body.body.stream;
        }
        if (req.body.body.model_name !== undefined) {
          fastApiData.model_name = req.body.body.model_name;
        }


        const fastApiResponse = await axios({
          method: 'POST',
          url: fastApiUrl,
          headers: {
            'accept': 'application/json',
            'Content-Type': 'application/json'
          },
          data: fastApiData,
          responseType: 'stream'
        });

        res.writeHead(fastApiResponse.status, fastApiResponse.headers);
        fastApiResponse.data.pipe(res);

      } catch (error) {
         console.error('Error forwarding to FastAPI:', error);
         res.status(500).json({ error: 'Failed to forward request to FastAPI' });
      }
    });

    wss.on('connection', ws => {
      ws.send(JSON.stringify({ type: 'initialLogs', logs }));
    });

    server.listen(3000, () => {
      console.log('Server started on port 3000');
    });
