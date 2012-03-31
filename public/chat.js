// Client - Processing Workshop Tool

var socket = io.connect();
var myid = '';
var interval;
var dirty = false;
var p5;

// socket events
socket.on('connect', function () {
  $('#connecting').hide();
  socket.emit('whats my id', function (id) {
    myid = id;
    socket.emit('nicknames request');
  });
});

socket.on('announcement', function (msg) {
  $('#lines').append($('<p>').append($('<em>').text(msg)));
});

socket.on('nicknames', function (nicknames) {
  // The deletion of users is not currently working. See the server
  // side for an explanation. Also, it would be more elegant to
  // receive "user logged out" notifications to delete the DIV
  // than doing this:
  // 1) mark all user windows for deletion, 2) unmarking found ones,
  // 3) deleting the rest. This comes from the way the sample chat
  // app was originally set up.

  // mark all for deletion
  $('#code DIV.user').addClass('delete');
  for (var thisid in nicknames) {
    // create window if it doesn't exist
    if($('#' + thisid).length == 0) {
      // #sample holds invisible DIVs used for cloning
      $('#sample DIV.' + (thisid == myid ? 'me' : 'notme')).clone().attr('id', thisid).appendTo('#code');
      addUsrEvents(thisid);
    }
    // mark existing users for non deletion
    $('#' + thisid).removeClass('delete');
    $('#' + thisid + ' DIV.nick').text(nicknames[thisid]);
  }
  // delete marked windows
  $('#code DIV.delete').remove();
});

socket.on('user message', add_to_chat);

socket.on('code change', in_codechange);

socket.on('has question', in_hasquestion);

socket.on('reconnect', function () {
  $('#lines').remove();
  add_to_chat('System', 'Reconnected to the server');
});

socket.on('reconnecting', function () {
  add_to_chat('System', 'Attempting to re-connect to the server');
});

socket.on('error', function (e) {
  add_to_chat('System', e ? e : 'A unknown error occurred');
});

// io
function add_to_chat(from, msg) {
  $('#lines').append($('<p>').append($('<b>').text(from), ' ', msg));
}
function in_codechange(id, code) {
  $('#' + id + ' textarea').val(code);
}
function in_hasquestion(id, has) {
  $('#' + id + ' .ask').toggleClass('active', has);
}

function setNick(nick) {
  socket.emit('nickname', nick, function (set) {
    if (!set) {
      return;
    }
    alert('Nickname already in use');
  });
}
function clear_chat_msg() {
  $('#message').val('').focus();
};
function windowResized() {
  $('#lines').height($(window).height() - 80);
  centerP5();
}
function centerP5() {
  $('#p5display').css('left', $(window).width()/2 - $('#p5display').width()/2).
    css('top', $(window).height()/2 - $('#p5display').height()/2);
}
function addUsrEvents(id) {
  // allow me to change my nick
  // detect my code changes
  if(id == myid) {
    $('#' + id + ' .nick').click(click_set_nick);
    $('#' + id + ' textarea').keypress(key_pressed);
  }
  // hack to let me (admin) unclick "user has question" from anybody, not only my own.
  // assumes I run the server on my computer and I'm accessing localhost:3000 instead of 192.168...
  if(id == myid || myid == 'u127_0_0_1') {
    $('#' + id + ' .ask').click(click_has_question);
  }
  // anyone can run anyones code
  $('#' + id + ' .run').click(click_run_code);
}

// mouse / key / timer events
function click_run_code() {
  if(p5) {
    p5.exit();
  }
  $('#p5display').show();
  // create processing
  $('#p5container').append('<canvas id="p5canvas"></canvas>');
  var code = $(this).parent().parent().find('textarea').val();
  p5 = new Processing(document.getElementById('p5canvas'), code);
  centerP5();
}
function click_set_nick() {
  var n = prompt("What's your name?");
  if(n) {
    setNick(n);
  }
}
function click_has_question() {
  var id = $(this).parent().parent().attr('id');
  $(this).toggleClass('active');
  socket.emit('has question', id, $(this).hasClass('active'));
}
function key_pressed(e) {
  dirty = true;
  // allow tabbing in textareas, but convert to double space
  if (e.keyCode == 9) {
      var myValue = "  "; // \t
      var startPos = this.selectionStart;
      var endPos = this.selectionEnd;
      var scrollTop = this.scrollTop;
      this.value = this.value.substring(0, startPos) + myValue + this.value.substring(endPos,this.value.length);
      this.focus();
      this.selectionStart = startPos + myValue.length;
      this.selectionEnd = startPos + myValue.length;
      this.scrollTop = scrollTop;

      e.preventDefault();
  }
}
// if code changed during the last second, send to everybody
function on_timer() {
  if(dirty) {
    socket.emit('code change', myid, $('#' + myid + ' textarea').val());
  }
  dirty = false;
}

// set up
$(function () {

  // activate chat send button
  $('#send-message').submit(function () {
    add_to_chat('me', $('#message').val());
    socket.emit('user message', $('#message').val());
    clear_chat_msg();
    $('#lines').get(0).scrollTop = 10000000;
    return false;
  });

  // activate p5 close button
  $('#p5close').click(function() {
    if(p5) {
      p5.exit();
      p5 = undefined;
    }
    $('#p5display').hide();
    $('#p5container').empty();
  });

  // listen to window size change
  $(window).resize(function() {
    windowResized();
  });
  windowResized();

  // timer used for checking if code was edited
  interval = setInterval(on_timer, 1000);
});
