# Processing Workshop Tool

This tool was written as an experiment to be used in a four day creative programming workshop with up to 10 students. It runs on my laptop and all users must be connected to the same wireless network.

It allows each student to view the code written by the teacher and by the other students almost in real time. It includes a simple chat, allows running the code written by any of the participants using processing.js, and has a question mark button to call the attention of the teacher (like calling for the flight attendant in airplanes).

There is no registration or security of any kind. I wanted it to work just by opening a URL.

Everything was done in three days, from watching tutorials about node.js, socket.io, jade, etc., to downloading node.js and npm, compiling it all and writing the programs. If something is totally wrong, you know why :)

Tested on Ubuntu 11.10, Firefox 11, Chromium 17, Node 0.6.3 and npm 1.1.12.

## Install
* Download and compile a recent version of node.js: http://nodejs.org/#download and
* Download and install a recent version of npm: http://npmjs.org/
* git clone git://github.com/hamoid/Processing-Workshop-Tool.git
* cd Processing-Workshop-Tool/
* npm install express
* npm install jade
* npm install socket.io
* npm install sqlite3
* npm install stylus

## Run
* cd Processing-Workshop-Tool/
* node server.js
* Open http://localhost:3000 in your browser.
* Open http://{your IP}:3000 in other computers or smartphones in your network.
* Click the green window title bar to set your name.
* Type Processing code in your green window.
* Click run to execute code.
* Click the question mark if you want to ask something to the teacher.
* Chat.

## Ideas
* Show line numbers in the editor.
* Double click any keyword to open Processing documentation.
* Block interface while running code.
* Are there memory leaks when running code multiple times? Not tested.
* Collapse editor windows when too many users.
* Allow pausing real time updates to make it easy to copy code from others. It's hard to select and copy code being edited.
* Short-cut for running code.
* Currently data is all in memory. If you stop node, it's all gone. Save to a sqlite3 database.
* Is there a way to send key presses on real time instead of sending the whole code once per second?
* Add a new associative array to keep track of connected users. Notify clients when users are gone to hide their editors.
* Let users mark when code is in a runnable state.

## Links
* http://processing.org
* http://processingjs.org
* http://jquery.com
* http://funprogramming.org

MIT licensed. Copyright (c) 2012 Abe Pazos - http://hamoid.com
