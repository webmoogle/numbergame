const app = require('express')();
const logger = require('morgan');
const fetch = require('node-fetch');

app.set('trust proxy', "127.0.0.1");
app.use(logger("dev"));

const http = require('http').Server(app);
const io = require('socket.io')(http,{
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    transports: ['websocket', 'polling'], // Allow WebSocket transport
    credentials: true // Set this to 'true' if you're using cookies or credentials
  }
});

const httpReq = async (game = 'min3') => {
  let d = new Date();
  const response = await fetch(`https://www.playround.global/api/game/result?game=${game}&session=${d.getTime()}`);
  const body = await response.text();
  io.emit('message', body);
};


let min1reset = 60, min1count = 60;
let min3reset = 180, min3count = 180;
let min5reset = 300, min5count = 300;
let min10reset = 600, min10count = 600;
let min1Flag = true;
let min3Flag = true;
let min5Flag = true;
let min10Flag = true;
const gamecount = setInterval(async()=>{
  io.emit('message', `{"min1":${min1count},"min3":${min3count},"min5":${min5count},"min10":${min10count}}`);
  min1count--; min3count--; min5count--; min10count--;
  if(min1count<1){ min1count = min1reset; min1Flag = true; }
  if(min3count<1){ min3count = min3reset; min3Flag = true; }
  if(min5count<1){ min5count = min5reset; min5Flag = true; }
  if(min10count<1){ min10count = min10reset; min10Flag = true; }
  if(min1Flag && min1count<5){ min1Flag = false; await httpReq('min1'); }
  if(min3Flag && min3count<5){ min3Flag = false; await httpReq('min3'); }
  if(min5Flag && min5count<5){ min5Flag = false; await httpReq('min5'); }
  if(min10Flag && min10count<5){ min10Flag = false; await httpReq('min10'); }
},1000);

const port = process.env.PORT || 8080;
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', async(socket) => {
    await gamecount;
  /* socket.on('message', msg => { io.emit('message', msg); }); */
});

app.get('/send', (req, res) => {
  if(req.query.objdata){
    io.emit('message', req.query.objdata);
    res.send(req.query.objdata);
  }
});

http.listen(port, () => {
  console.log(`Socket.IO server running at http://localhost:${port}/`);
});
