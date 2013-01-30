# Server - Processing Workshop Tool

# sets nickname. If non specified, use old nickname if found in nicknames.
# If old one not found, use usrid (IP address)
setNickname = (socket, newnick) ->
  if newnick
    if socket.nickname      
      # if there was an old nickname, this is a name change
      socket.broadcast.emit "announcement", socket.nickname + " is now " + newnick
    #else
      #socket.broadcast.emit('announcement', newnick + ' connected');
  else
    newnick = (if nicknames[socket.usrid] then nicknames[socket.usrid] else socket.usrid)
  
  #socket.broadcast.emit('announcement', newnick + ' connected');
  nicknames[socket.usrid] = socket.nickname = newnick
  io.sockets.emit "nicknames", nicknames
  
#require "jade"

express = require 'express'
stylus = require 'stylus'
assets = require 'connect-assets'
http = require 'http'
socketio = require 'socket.io'

app = express()
app.use assets()

app.use express.static(__dirname + "/public")
app.set "view engine", "jade"
app.set "view options",
  layout: false
app.get "/", (req, res) ->
  res.render "index",
    layout: false

server = http.createServer app
io = socketio.listen(server)
io.set "log level", 2

server.listen 3000, ->
  console.log "Listening on port " + server.address().port

# associative array that holds user names and is
# indexed by ip addresses in this form: u127_0_0_1
nicknames = {}

io.sockets.on "connection", (socket) ->
  # set usrid
  socket.usrid = "u" + socket.handshake.address.address.replace(/\./g, "_")
  
  # chat message
  socket.on "user message", (msg) ->
    socket.broadcast.emit "user message", socket.nickname, msg

  # user source code has changed
  socket.on "code change", (id, code) ->
    socket.broadcast.emit "code change", id, code

  # user clicked question mark. he has a question
  socket.on "has question", (id, hasquestion) ->
    socket.broadcast.emit "has question", id, hasquestion

  # client asks "what's my id?" right after connection
  socket.on "whats my id", (fn) ->
    fn socket.usrid

  # attempt nickname change. if nick taken, inform client using a callback
  socket.on "nickname", (nick, fn) ->
    for i of nicknames
      if nicknames[i] is nick
        fn true
        return
    fn false
    setNickname socket, nick

  # after connection and getting id, client requests nicknames
  socket.on "nicknames request", ->
    setNickname socket

  socket.on "disconnect", ->
    return  unless socket.nickname
    
    # TODO: here we used to remove the user from nicknames
    # but I wanted to keep the user names in case he comes back.

    # I should have two tables instead of one: one with IP::nickname,
    # (that one I have already, called nicknames)
    # and another with who is logged in.

    # Currently when someone closes the browser he's still
    # listed on the web page, since I'm not deleting the entry from
    # nicknames.

    # announcements disabled to reduce chat noise
    # socket.broadcast.emit "announcement", socket.nickname + ' disconnected'
    
    socket.broadcast.emit "nicknames", nicknames


