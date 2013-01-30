# Client - Processing Workshop Tool

# io
add_to_chat = (from, msg) ->
  $("#lines").append $("<p>").append($("<b>").text(from), " ", msg)

in_codechange = (id, code) ->
  $("#" + id + " textarea").val code

in_hasquestion = (id, has) ->
  $("#" + id + " .ask").toggleClass "active", has

setNick = (nick) ->
  socket.emit "nickname", nick, (set) ->
    return  unless set
    alert "Nickname already in use"

clear_chat_msg = ->
  $("#message").val("").focus()

windowResized = ->
  $("#lines").height $(window).height() - 80
  centerP5()

centerP5 = ->
  $("#p5display").css("left", $(window).width() / 2 - $("#p5display").width() / 2).css "top", $(window).height() / 2 - $("#p5display").height() / 2

addUsrEvents = (id) ->  
  # allow me to change my nick
  # detect my code changes
  if id is myid
    $("#" + id + " .nick").click click_set_nick
    $("#" + id + " textarea").keypress key_pressed
  
  # hack to let me (admin) unclick "user has question" from anybody, not only my own.
  # assumes I run the server on my computer and I'm accessing localhost:3000 instead of 192.168...
  $("#" + id + " .ask").click click_has_question  if id is myid or myid is "u127_0_0_1"
  
  # anyone can run anyones code
  $("#" + id + " .run").click click_run_code

# mouse / key / timer events
click_run_code = ->
  p5.exit()  if p5
  $("#p5display").show()
  
  # create processing
  $("#p5container").append "<canvas id=\"p5canvas\"></canvas>"
  code = $(this).parent().parent().find("textarea").val()
  p5 = new Processing(document.getElementById("p5canvas"), code)
  centerP5()

click_set_nick = ->
  n = prompt("What's your name?")
  setNick n  if n

click_has_question = ->
  id = $(this).parent().parent().attr("id")
  $(this).toggleClass "active"
  socket.emit "has question", id, $(this).hasClass("active")

key_pressed = (e) ->
  dirty = true
  
  # allow tabbing in textareas, but convert to double space
  if e.keyCode is 9
    myValue = "  " # \t
    startPos = @selectionStart
    endPos = @selectionEnd
    scrollTop = @scrollTop
    @value = @value.substring(0, startPos) + myValue + @value.substring(endPos, @value.length)
    @focus()
    @selectionStart = startPos + myValue.length
    @selectionEnd = startPos + myValue.length
    @scrollTop = scrollTop
    e.preventDefault()

# if code changed during the last second, send to everybody
on_timer = ->
  socket.emit "code change", myid, $("#" + myid + " textarea").val()  if dirty
  dirty = false

socket = io.connect()
myid = ""
interval = undefined
dirty = false
p5 = undefined

# socket events
socket.on "connect", ->
  $("#connecting").hide()
  socket.emit "whats my id", (id) ->
    myid = id
    socket.emit "nicknames request"

socket.on "announcement", (msg) ->
  $("#lines").append $("<p>").append($("<em>").text(msg))

socket.on "nicknames", (nicknames) ->
  # The deletion of users is not currently working. See the server
  # side for an explanation. Also, it would be more elegant to
  # receive "user logged out" notifications to delete the DIV
  # than doing this:
  # 1) mark all user windows for deletion, 2) unmarking found ones,
  # 3) deleting the rest. This comes from the way the sample chat
  # app was originally set up.

  # mark all for deletion
  $("#code DIV.user").addClass "delete"
  for thisid of nicknames
    # create window if it doesn't exist
    if $("#" + thisid).length is 0
      # #sample holds invisible DIVs used for cloning
      $("#sample DIV." + ((if thisid is myid then "me" else "notme"))).clone().attr("id", thisid).appendTo "#code"
      addUsrEvents thisid
    # mark existing users for non deletion
    $("#" + thisid).removeClass "delete"
    $("#" + thisid + " DIV.nick").text nicknames[thisid]
  # delete marked windows
  $("#code DIV.delete").remove()

socket.on "user message", add_to_chat
socket.on "code change", in_codechange
socket.on "has question", in_hasquestion
socket.on "reconnect", ->
  $("#lines").remove()
  add_to_chat "System", "Reconnected to the server"

socket.on "reconnecting", ->
  add_to_chat "System", "Attempting to re-connect to the server"

socket.on "error", (e) ->
  add_to_chat "System", (if e then e else "A unknown error occurred")


# set up
$ ->
  
  # activate chat send button
  $("#send-message").submit ->
    add_to_chat "me", $("#message").val()
    socket.emit "user message", $("#message").val()
    clear_chat_msg()
    $("#lines").get(0).scrollTop = 10000000
    false
  
  # activate p5 close button
  $("#p5close").click ->
    if p5
      p5.exit()
      p5 = `undefined`
    $("#p5display").hide()
    $("#p5container").empty()
  
  # listen to window size change
  $(window).resize ->
    windowResized()

  windowResized()
  
  # timer used for checking if code was edited
  interval = setInterval(on_timer, 1000)

