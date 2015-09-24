# Learning OpenTok Web


This sample client app shows how to accomplish the following using the OpenTok.js SDK:

* Initialize and connect to an OpenTok session, publish to a stream and subscribe to a stream
* The ability to record the session, stop the recording, and view the recording
* Text chat for the participants

The code for this sample is found the following git branches:

* basics -- This branch shows you how to connect to the OpenTok session, publish a stream, subscribe to a stream, and mute audio.

* archiving -- This branch shows you how to record the session.

* signaling -- This branch shows you how to use the OpenTok signaling API to implement text chat.

You will also need to clone the OpenTok GettingStarted repo and run its code on a PHP-enabled web server. See the next section for more information.

## Setting up the test web service

The [Learning OpenTok PHP](https://github.com/opentok/learning-opentok-php) repo includes code for
setting up a web service that handles the following API calls:

* "/session" -- The JS client calls this endpoint to get an OpenTok session ID, token, and API key.
* "/start" -- The JS client calls this endpoint to start recording the OpenTok session to an archive.
* "/stop" -- The JS client calls this endpoint to stop recording the archive.
* "/view" -- The JS client loads this endpoint in a web browser to display the archive recording.

Download the repo and run its code on a PHP-enabled web server. If you do not have a PHP
server set up, you can use Heroku to run a remote test server -- see [Automatic deployment to
Heroku](https://github.com/opentok/learning-opentok-php#automatic-deployment-to-heroku).

## Configuring the application

1. Clone this repository. This repository as mentioned earlier has three branches.

2. When you do a git clone, you check out the `basics` branch. To check out other branches you need
to execute the following commands:

        git fetch
        git checkout -b signaling origin/signaling

        git checkout -b archiving origin/archiving

3. Now, switch to `basics` branch using `git checkout basics` command. Navigate to `web/js`
directory and make a copy of the sampleconfig.js file named config.js.

4. Edit the config.js file and set the value for SAMPLE_SERVER_BASE_URL.

   If you deployed a the test web service to a local PHP server, set this to the following:

        var SAMPLE_SERVER_BASE_URL = 'http://localhost:8080';

   If you deployed this to Heroku, set this to the following:

        var SAMPLE_SERVER_BASE_URL = 'https://YOUR-HEROKU-APP-URL';

   Do not add the trailing slash of the URL.

5. The web app lives at index.html. You will need to run this on a web server. If you have Python on
your system, you can start the web server by running `python -m SimpleHTTPServer 8000` in the `web` folder.

6. Once you have the server running open the index.html in a supported browser. For example, if
your local web server is running on port 8000, load the following URL:

   http://localhost:8000

   The OpenTok.js library is supported in Chrome, Firefox, and Internet Explorer 9 - 11.
   (Internet Explorer requires installation of the OpenTok plugin, which the libary asks you
   to install, if you haven't already.)

7. When prompted, grand the page access to your camera and microphone.

8. Mute the speaker on your computer, and then load the page again in another browser tab.

   You will see a person-to-person video chat session using OpenTok.


## Getting an OpenTok session ID, token, and API key

An OpenTok session connects different clients letting them share audio-video streams and send
messages. Clients in the same session can include iOS, Android, and web browsers.

**Session ID** -- Each client that connects to the session needs the session ID, which identifies
the session. Think of a session as a room, in which clients meet. Depending on the requirements of
your application, you will either reuse the same session (and session ID) repeatedly or generate
new session IDs for new groups of clients.

*Important*: This demo application assumes that only two clients -- the local Web client and
another client -- will connect in the same OpenTok session. For test purposes, you can reuse the
same session ID each time two clients connect. However, in a production application, your
server-side code must create a unique session ID for each pair of clients. In other applications,
you may want to connect many clients in one OpenTok session (for instance, a meeting room) and
connect others in another session (another meeting room). For examples of apps that connect users
in different ways, see the OpenTok ScheduleKit, Presence Kit, and Link Kit [Starter Kit
apps](https://tokbox.com/opentok/starter-kits/).

Since this app uses the OpenTok archiving feature to record the session, the session must be set to
use the routed media mode, indicating that it will use the OpenTok Media Router. The OpenTok Media
Router provides other advanced features (see [The OpenTok Media Router and media
modes](https://tokbox.com/opentok/tutorials/create-session/#media-mode)). If your application does
not require the features provided by the OpenTok Media Router, you can set the media mode to
relayed.

**Token** -- The client also needs a token, which grants them access to the session. Each client is
issued a unique token when they connect to the session. Since the user publishes an audio-video
stream to the session, the token generated must include the publish role (the default). For more
information about tokens, see the OpenTok [Token creation
overview](https://tokbox.com/opentok/tutorials/create-token/).

**API key** -- The API key identifies your OpenTok developer account.

Upon starting up, the application calls the `getApiAndToken()` method defined in the app.js file.
This method makes an XHR (or Ajax request) to the "/session" endpoint of the web service. The web
service returns an HTTP response that includes the session ID, the token, and API key formatted as
JSON data:

    {
         "sessionId": "2_MX40NDQ0MzEyMn5-fn4",
         "apiKey": "12345",
         "token": "T1==cGFydG5lcl9pZD00jg="
    }

## Connecting to the session

Upon obtaining the session ID, token, and API, the `getApiAndToken()` method calls the
`initializeSession()` method. This method initializes a Session object and connects to the
OpenTok session:

    // Initialize Session Object
    var session = OT.initSession(apiKey, sessionId);

The `OT.initSession()` method takes two parameters -- the OpenTok API key and the session ID. It
initializes and returns an OpenTok Session object.

The `connect()` method of the Session object connects the client application to the OpenTok
session. You must connect before sending or receiving audio-video streams in the session (or before
interacting with the session in any way). The `connect()` method takes two parameters -- a token
and a completion handler function:

    // Connect to the Session
    session.connect(token, function(error) {

      // If the connection is successful, initialize a publisher and publish to the session
      if (!error) {
        var publisher = OT.initPublisher('publisher', {
          insertMode: 'append',
          width: '100%',
          height: '100%'
        });

        session.publish(publisher);
      } else {
        console.log('There was an error connecting to the session:', error.code, error.message);
      }
    });

An error object is passed into the completion handler of the connect event if the client fails to
connect to the OpenTok session. Otherwise, no error object is passed in, indicating that the client
connected successfully to the session.

The session object dispatches a `streamCreated` event when a new stream is created in the session.
It dispatches a `sessionDisconnected` event when your client disconnects from the session. The
application defines event handlers to listen to these two events.

## Publishing an audio video stream to the session

Upon successfully connecting to the OpenTok session (see the previous section), the application
initializes an OpenTok Publisher object and publishes an audio-video stream to the session. This is
done inside the completion handler for the connect() method, since you should only publish to the
session once you are connected to it.

The Publisher object is initialized as shown below. It takes three optional parameters (two of
which are shown in the code below). The first parameter is the DOM element that the publisher video
replaces. The second parameter specifies the properties of the publisher. The third parameter (not
shown) specifies the completion handler.

    var publisher = OT.initPublisher('publisher', {
      insertMode: 'append',
      width: '100%',
      height: '100%'
    });

Once the Publisher object is initialized, we publish to the session using the `publish()`
method of the Session object:

    session.publish(publisher);

## Subscribing to another client's audio-video stream

The Session object dispatches a `streamCreated` event when a new stream (other than your own) is
created in a session. A stream is created when a client publishes to the session. The
`streamCreated` event is also dispatched for each existing stream in the session when you first
connect. This event is defined by the StreamEvent object, which has a `stream` property,
representing stream that was created. The application listens to the `streamCreated` event and
subscribes to all streams created in the session using the `Session.subscribe()` method, as shown
below:

    // Subscribe to a newly created stream
   
    session.on('streamCreated', function(event) {
      session.subscribe(event.stream, 'subscriber', {
        insertMode: 'append',
        width: '100%',
        height: '100%'
      });
    });

The subscribe method takes four parameters:

* The Stream object to which we are subscribing
* The DOM element or DOM element ID (optional) that the subscriber video replaces
* A set of properties (optional) that customize the appearance of the subscriber view
* The completion handler function (optional) that is called when the `subscribe()` method completes
  successfully or fails

## Recording the session to an archive

**Important**: To view the code for this functionality, switch to the *archiving* branch of this
git repository.

The OpenTok archiving API lets you record a session's audio-video streams to MP4 files. You use
server-side code to start and stop archive recordings. In the config.js file, you set the `SAMPLE_SERVER_BASE_URL` variable to the base URL of the web service the app calls to start archive
recording, stop recording, and play back the recorded video:

The archiving application uses the same code available in the basics branch to initialize an
OpenTok session, connect to the session, publish a stream and subscribe to stream in the session.
If you have not already gotten familiar with the code in that branch, consider doing so before
continuing (see the previous sections).

To start recording the video stream, the user clicks the Start Recording button which invokes the
`startArchive()` method in app.js. This method in turn sends an XHR (or Ajax) request to server.
The session ID of the session that needs to be recorded is passed as a URL parameter to the server.
As soon as the `startArchive()` method is called, the Start Recording button is hidden and the Stop
Recording button is displayed.

    function startArchive() {
      $.post(SAMPLE_SERVER_BASE_URL + '/start/' + sessionId);
      $('#start').hide();
      $('#stop').show();
    }

To stop the recording, the user clicks the Stop Recording button, which invokes the `stopArchive()`
method. This method is similar to the `startArchive()` method in that it sends an Ajax request to
the server to stop the archive. The only difference is that this method passes the archive ID of
the archive that needs to be stopped as a URL parameter instead of the sessionId. The Stop
Recording button is hidden and the View Archive button is enabled.

    function stopArchive() {
      $.post(SAMPLE_SERVER_BASE_URL + '/stop/' + archiveID);
      $('#stop').hide();
      $('#start').show();
      $('#view').prop('disabled', false);
    }

To download the archive that has just been recorded, the user clicks View Archive button which
invokes the `viewArchive()` method. This method is similar to the `startArchive()` and
`stopArchive()` methods in that it sends an Ajax request to the server. The server code has the
logic to check if the archive is available for download or not. If it is available, the application
is redirected to the archive page. If not, a new page is loaded which continuously checks whether
the archive is available for download or not and loads it when it is available.

## Using the signaling API to implement text chat

**Important**: To view the code for this functionality, switch to the *signaling* branch of this
git repository.
   
Text chat is implemented using the OpenTok signaling API. A signal is sent using the `signal()`
method of the Session object. To receive a signal a client needs to listen to the `signal` event
dispatched by the session object.

In our application, when the user enters text in the input text field, the form.addEventListener
method is called:

    form.addEventListener('submit', function(event) {
    event.preventDefault();

      session.signal({
          type: 'chat',
          data: msgTxt.value
        }, function(error) {
        if (!error) {
          msgTxt.value = '';
        }
      });
    });


This method calls the `signal()` method of the Session object, which sends a signal to all clients
connected to the OpenTok session. Each signal is defined by a `type` property identifying the type
of message (in this case "chat") and a `data` property containing the message. The text entered is
sent in the data property of the signal method.

When another client connected to the session (in this app, there is only one) sends a message, the
session's `signal` event handler is invoked:

    session.on('signal:chat', function(event) {
      var msg = document.createElement('p');
      msg.innerHTML = event.data;
      msg.className = event.from.connectionId === session.connection.connectionId ? 'mine' : 'theirs';
      msgHistory.appendChild(msg);
      msg.scrollIntoView();
    });

This method checks to see if the signal was sent by the local web client or by the other client
connected to the session:

    event.from.connectionId === session.connection.connectionId ? 'mine' : 'theirs';

The Session object represents your OpenTok session. It has a `connection` property, which has a
`connectionId` property. The event object represents the event associated with this signal. It has
a `from` property (which is a Connection object) with a `connectionId` property. This represents
the connection ID of the client sending the signal. If these match, the signal was sent by the
local web client.

The data associated with the event is then appended as a child of the `history` DOM element.

This app uses the OpenTok signaling API to implement text chat. However, you can use the signaling
API to send messages to other clients (individually or collectively) connected to the session.

## Other resources

See the following:

* [API reference](https://tokbox.com/developer/sdks/js/reference/) -- Provides details on
the OpenTok.js API

* [Developer guides](https://tokbox.com/developer/guides/) -- Includes conceptual information and code samples for all OpenTok features
