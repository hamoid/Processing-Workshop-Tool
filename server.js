// Server - Processing Workshop Tool

require('jade');

var stylus = require('stylus'),
    express = require('express'),
    http = require('http'),
    app = express(),
    server = http.createServer(app);

app.use(stylus.middleware({ src: __dirname + '/public' }));
app.set('view engine', 'jade');
app.set('view options', { layout: false });

app.get('/*.(js|css)', function(req, res){
  res.sendfile("./public" + req.url);
});

app.get('/', function (req, res) {
  res.render('index', { layout: false });
});

server.listen(3000);

// associative array that holds user names and is
// indexed by ip addresses in this form: u127_0_0_1
var nicknames = {};

var io = require('socket.io').listen(server);
io.set('log level', 2);

io.sockets.on('connection', function (socket) {
  // set usrid
  socket.usrid = 'u' + socket.handshake.address.address.replace(/\./g, '_');

  // chat message
  socket.on('user message', function (msg) {
    socket.broadcast.emit('user message', socket.nickname, msg);
  });

  // user source code has changed
  socket.on('code change', function(id, code) {
    socket.broadcast.emit('code change', id, code);
  });

  // user clicked question mark. he has a question.
  socket.on('has question', function(id, hasquestion) {
    socket.broadcast.emit('has question', id, hasquestion);
  });

  // client asks "what's my id?" right after connection
  socket.on('whats my id', function(fn) {
    fn(socket.usrid);
  });

  // attempt nickname change. if nick taken, inform client using a callback
  socket.on('nickname', function (nick, fn) {
    for (var i in nicknames) {
      if(nicknames[i] == nick) {
        fn(true);
        return;
      }
    }
    fn(false);
    setNickname(socket, nick);
  });

  // after connection and getting id, client requests nicknames
  socket.on('nicknames request', function() {
    setNickname(socket);
  });

  socket.on('disconnect', function () {
    if (!socket.nickname) return;
    // TODO: here we used to remove the user from nicknames
    // but I wanted to keep the user names in case he comes back.

    // I should have two tables instead of one: one with IP>nickname,
    // (that one I have already, called nicknames)
    // and another with who is logged in.

    // Currently when someone closes the webserver he's still stays
    // listed on the web page, since I'm not deleting the entry from
    // nicknames.

    // announcements disabled to reduce chat noise
    //socket.broadcast.emit('announcement', socket.nickname + ' disconnected');
    socket.broadcast.emit('nicknames', nicknames);
  });
});

// sets nickname. If non specified, use old nickname if found in nicknames.
// If old one not found, use usrid (IP address)
function setNickname(socket, newnick) {
  if (newnick) {
    if(socket.nickname) {
      // if there was an old nickname, this is a name change
      socket.broadcast.emit('announcement', socket.nickname + ' is now ' + newnick);
    } else {
      //socket.broadcast.emit('announcement', newnick + ' connected');
    }
  } else {
    newnick = nicknames[socket.usrid] ? nicknames[socket.usrid] : socket.usrid;
    //socket.broadcast.emit('announcement', newnick + ' connected');
  }

  nicknames[socket.usrid] = socket.nickname = newnick;

  io.sockets.emit('nicknames', nicknames);
}
