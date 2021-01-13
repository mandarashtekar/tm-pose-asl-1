// **** WEBUI **** //

var video;
var flash;
var presentation = null;
var flash_button = null;
var bandwidth;
var conf_uri;
var conference;
var videoURL;
var presWidth = 1280;
var presHeight = 720;
var presenter;
var pin;
var source = null;
var presenting = false;
var startTime = null;
var userResized = false;
var presentationURL = '';
var videoPresentation = true;

var id_selfview;
var id_muteaudio;
var id_mutevideo;
var id_fullscreen;
var id_screenshare;
var id_presentation;

var isProvider = "true";
var set_interval = "false";
var set_interval_callback;
var layout;
var media_stats;
webuiLoaded = true;

var trans = Array();
trans['BUTTON_MUTEAUDIO'] = "Mute Audio";
trans['BUTTON_UNMUTEAUDIO'] = "Unmute Audio";
trans['BUTTON_MUTEVIDEO'] = "Mute Video";
trans['BUTTON_UNMUTEVIDEO'] = "Unmute Video";
trans['BUTTON_FULLSCREEN'] = "Fullscreen";
trans['BUTTON_NOPRES'] = "No Presentation Active";
trans['BUTTON_SHOWPRES'] = "View Presentation";
trans['BUTTON_HIDEPRES'] = "Hide Presentation";
trans['BUTTON_SHOWSELF'] = "Show Selfview";
trans['BUTTON_HIDESELF'] = "Hide Selfview";
trans['BUTTON_SCREENSHARE'] = "Share Screen";
trans['BUTTON_STOPSHARE'] = "Stop Sharing";
trans['HEADING_ROSTER_LIST'] = "Participants";
trans['TITLE_HOSTS'] = "Hosts";
trans['TITLE_GUESTS'] = "Guests";

/* ~~~ PRESENTATION STUFF ~~~ */
function presentationClosed() {
    id_presentation.textContent = trans['BUTTON_SHOWPRES'];
    if (presentation && presentation.document.getElementById('presvideo')) {
        rtc.stopPresentation();
    }
    presentation = null;
}

function remotePresentationClosed(reason) {
    if (presentation) {
        if (reason) {
            alert(reason);
        }
        presentation.close()
    }
}

function checkForBlockedPopup() {
    id_presentation.classList.remove("inactive");
    if (!presentation || typeof presentation.innerHeight === "undefined" || (presentation.innerHeight === 0 && presentation.innerWidth === 0)) {
        // Popups blocked
        presentationClosed();
        flash_button = setInterval(function(){id_presentation.classList.toggle('active');}, 1000);
    } else {
        id_presentation.textContent = trans['BUTTON_HIDEPRES'];
        presentation.document.title = decodeURIComponent(conference) + " presentation from " + presenter;
        if (flash_button) {
            clearInterval(flash_button);
            flash_button = null;
            id_presentation.classList.remove('active');
        }
        if (presentation.document.getElementById('presvideo')) {
            rtc.getPresentation();
        } else {
            loadPresentation(presentationURL);
        }
    }
}

function createPresentationWindow() {
    if (presentation == null) {
        presentation = window.open(document.location, 'presentation', 'height=' + presHeight + ',width=' + presWidth + ',location=no,menubar=no,toolbar=no,status=no');
        setTimeout(checkForBlockedPopup, 1000);

        if (presentation != null) {
            presentation.document.write("<html><body bgcolor='#000000'>");
            presentation.document.write("<script type='text/javascript'>function switchImage() { presimage.src = loadimage.src; }</script>");
            presentation.document.write("<img src='' id='loadimage' style='position:absolute;left:0;top:0;display:none' width='0px' height='0px' onLoad='switchImage();'/>");
            presentation.document.write("<div width='100%' height='100%' style='overflow:auto;position:absolute;left:0;right:0;top:0;bottom:0'>");
            presentation.document.write("<img src='' id='presimage' width='100%'/>");
            presentation.document.write("</div>");
            presentation.document.write("</body></html>");
            presentation.addEventListener('beforeunload', presentationClosed);
            presentation.addEventListener('resize', function() { userResized = true; });
            userResized = false;
        }
    }
}

function loadPresentation(url) {
    if (presentation && presentation.document.getElementById('loadimage')) {
        presentation.loadimage.src = url;
        setTimeout(resizePresentationWindow, 500);
    } else {
        presentationURL = url;
    }
}

function resizePresentationWindow() {
    if (presentation != null && presentation.presimage.clientWidth > 640 && !userResized) {
        presWidth = presentation.presimage.clientWidth;
        presHeight = presentation.presimage.clientHeight;
        presentation.window.resizeTo(presWidth + (presentation.outerWidth - presentation.innerWidth), presHeight + (presentation.outerHeight - presentation.innerHeight));
    }
}

function loadPresentationStream(videoURL) {
    if (presentation && presentation.document.getElementById('presvideo')) {
        presentation.presvideo.poster = "";
        presentation.presvideo.src = videoURL;
    }
}

function createPresentationStreamWindow() {
    if (presentation == null) {
        presentation = window.open(document.location, 'presentation', 'height=' + presHeight + ',width=' + presWidth + ',location=no,menubar=no,toolbar=no,status=no');
        setTimeout(checkForBlockedPopup, 1000);

        if (presentation != null) {
            presentation.document.write("<html><body bgcolor='#333333'>");
            presentation.document.write("<div width='100%' height='100%' style='overflow:auto;position:absolute;left:0;right:0;top:0;bottom:0'>");
            presentation.document.write("<video id='presvideo' width='100%' autoplay='autoplay' poster='img/spinner.gif'/>");
            presentation.document.write("</div>");
            presentation.document.write("</body></html>");
            presentation.addEventListener('beforeunload', presentationClosed);
        }
    }
}

function presentationStartStop(setting, pres) {
    if (setting == true) {
        presenter = pres;
        if (presenting && id_presentation.classList.contains("inactive")) {
            id_presentation.textContent = trans['BUTTON_SHOWPRES'];
            id_presentation.classList.remove("inactive");
        } else if (source == 'screen') {
            rtc.disconnect();
        } else if (videoPresentation) {
            createPresentationStreamWindow();
        } else {
            createPresentationWindow();
        }
    } else {
        if (presentation != null) {
            presentation.close();
        }
        if (flash_button) {
            clearInterval(flash_button);
            flash_button = null;
            id_presentation.classList.remove('active');
        }
        id_presentation.textContent = trans['BUTTON_NOPRES'];
        id_presentation.classList.add("inactive");
    }
}

function togglePresentation() {
    if (presentation) {
        presentation.close();
    } else if (!id_presentation.classList.contains("inactive")) {
        if (videoPresentation) {
            createPresentationStreamWindow();
        } else {
            createPresentationWindow();
        }
    }
}

function goFullscreen() {
    if (!id_fullscreen.classList.contains("inactive")) {
        video.goFullscreen = ( video.webkitRequestFullscreen || video.mozRequestFullScreen );
        video.goFullscreen();
    }
}

function presentScreen() {
    if (!id_screenshare.classList.contains("inactive")) {
        if (!presenting) {
            id_screenshare.textContent = trans['BUTTON_STOPSHARE'];
            rtc.present('screen');
            presenting = true;
        } else {
            rtc.present(null);
        }
    }
}

function unpresentScreen(reason) {
    if (reason) {
        alert(reason);
    }
    id_screenshare.textContent = trans['BUTTON_SCREENSHARE'];
    presenting = false;
}

/* ~~~ MUTE AND HOLD/RESUME ~~~ */

function muteAudioStreams() {
    if (!id_muteaudio.classList.contains("inactive")) {
        muteAudio = rtc.muteAudio();
        id_muteaudio.classList.toggle('selected');
        if (muteAudio) {
            id_muteaudio.textContent = trans['BUTTON_UNMUTEAUDIO'];
        } else {
            id_muteaudio.textContent = trans['BUTTON_MUTEAUDIO'];
        }
    }
}

function muteVideoStreams() {
    if (!id_mutevideo.classList.contains("inactive")) {
        muteVideo = rtc.muteVideo();
        id_mutevideo.classList.toggle('selected');
        if (muteVideo) {
            id_mutevideo.textContent = trans['BUTTON_UNMUTEVIDEO'];
        } else {
            id_mutevideo.textContent = trans['BUTTON_MUTEVIDEO'];
        }
    }
}

function toggleSelfview() {
    console.log("toggleSelfview");
    
    if (!id_selfview.classList.contains("inactive")) {
        if (flash) {
            //flash.toggleSelfview();
            if (id_selfview.classList.contains('selected')) {
                flash.hideSelfview();
                id_selfview.classList.remove('selected');
                id_selfview.textContent = trans['BUTTON_SHOWSELF'];
            } else {
                flash.showSelfview();
                id_selfview.classList.add('selected');
                id_selfview.textContent = trans['BUTTON_HIDESELF'];
            }
        } else {
            selfview.hidden = !selfview.hidden;
            if (selfview.hidden) {
                id_selfview.textContent = trans['BUTTON_SHOWSELF'];
                id_selfview.classList.remove('selected');
                rosterlist.classList.remove('shorter');
            } else {
                id_selfview.textContent = trans['BUTTON_HIDESELF'];
                id_selfview.classList.add('selected');
                rosterlist.classList.add('shorter');
            }
        }
    }
}

function holdresume(setting) {
    if (setting === true) {
        video.src = "";
        video.poster = "img/OnHold.jpg";
        id_muteaudio.classList.add("inactive");
        id_mutevideo.classList.add("inactive");
    } else {
        video.poster = "";
        video.src = videoURL;
        if (presentation != null) {
            loadPresentation();
        }
        id_muteaudio.classList.remove("inactive");
        id_mutevideo.classList.remove("inactive");
    }
}

/* ~~~ ROSTER LIST ~~~ */

function updateRosterList(roster) {
    rosterlist.removeChild(rosterul);
    rosterul = document.createElement("ul");
    rosterlist.appendChild(rosterul);

    var state = "";
    if (roster.length > 0 && 'role' in roster[0]) {
        var h2 = document.createElement("h2");
        h2.innerHTML = trans['TITLE_HOSTS'];
        rosterul.appendChild(h2);
        state = "HOSTS";
    }

    rosterheading.textContent = trans['HEADING_ROSTER_LIST'] + " (" + roster.length + ")";

    for (var i = 0; i < roster.length; i++) {
        if (roster[i]['role'] == "unknown") {
            continue;
        } else if (roster[i]['role'] == "guest" && state == "HOSTS") {
            var h2 = document.createElement("h2");
            h2.innerHTML = trans['TITLE_GUESTS'];
            rosterul.appendChild(h2);
            state = "GUESTS";
        }

        var li = document.createElement("li");
        if (roster[i]['display_name'] != "" && roster[i]['display_name'] != roster[i]['uri']) {
            var subtitle = document.createElement("p");
            subtitle.innerHTML = roster[i]['uri'];
            var surtitle = document.createElement("h3");
            surtitle.innerHTML = roster[i]['display_name'];
            if (roster[i]['is_presenting'] == "YES") {
                surtitle.classList.add("presenting");
            }
            li.appendChild(surtitle);
            li.appendChild(subtitle);
        } else {
            var surtitle = document.createElement("h3");
            surtitle.innerHTML = roster[i]['uri'];
            li.appendChild(surtitle);
            if (roster[i]['is_presenting'] == "YES") {
                surtitle.classList.add("presenting");
            }
        }

        rosterul.appendChild(li);
    }

    if (video && navigator.userAgent.indexOf("Chrome") != -1 && navigator.userAgent.indexOf("Mobile") == -1 && !source) {
        id_screenshare.classList.remove("inactive");
    }
}

/* ~~~ SETUP AND TEARDOWN ~~~ */

function cleanup(event) {
    if (video) {
        video.src = "";
    }
    if (presentation) {
        presentation.close();
    }
}

function finalise(event) {
    console.log("inside webui finalise");
    rtc.disconnect();
    cleanup();
}

function remoteDisconnect(reason) {
    cleanup();
    alert(reason);
    window.removeEventListener('beforeunload', finalise);
    window.location = "index.html";
    /*if(isProvider == "true"){
        window.location.href =  '/videovisit/myMeetings.htm';
    } else{
        window.location.href = '/videovisit/landingready.htm';
    }*/
}

function handleError(reason) {
    console.log("HandleError");
    console.log(reason);
    if (video && !selfvideo.src && new Date() - startTime > 30000) {
        reason = "WebSocket connection error.";
    }
    //remoteDisconnect(reason);
}

function doneSetup(url, pin_status, conference_extension) {
    console.log("inside doneSetup");
    console.log("doneSetup - pin: " +pin);
    pin = "2222";

    if (url) {
        if (typeof(MediaStream) !== "undefined" && url instanceof MediaStream) {
            selfvideo.srcObject = url;
        } else {
            selfvideo.src = url;
        }
    }
    /*console.log("PIN status: " + pin_status);
    console.log("IVR status: " + conference_extension);
    if (pin_status == 'required') {
        pinentry.classList.remove("hidden");
    } else if (pin_status == 'optional') {
        selectrole.classList.remove("hidden");
    } else if (conference_extension) {
        ivrentry.classList.remove("hidden");
    } else {
        maincontent.classList.remove("hidden");
        rtc.connect(pin);
    }*/
    rtc.connect(pin);
}

/*function submitSelectRole() {
    var id_guest = document.getElementById('id_guest');
    selectrole.classList.add("hidden");
    if (id_guest.checked) {
        maincontent.classList.remove("hidden");
        rtc.connect('');
    } else {
        pinentry.classList.remove("hidden");
    }
}

function submitPinEntry() {
    var id_pin = document.getElementById('id_pin');
    pinentry.classList.add("hidden");
    maincontent.classList.remove("hidden");
    pin = id_pin.value;
    console.log("PIN is now " + pin);
    rtc.connect(pin);
    return false;
}

function submitIVREntry() {
    var id_room = document.getElementById('id_room');
    ivrentry.classList.add("hidden");
    room = id_room.value;
    console.log("Target room is now " + room);
    rtc.connect(null, room);
    return false;
}*/

function sipDialOut() {
	console.log("SIP Dial Out");

    var phone_num = $("#phone_num").val();
    console.log("phone_num: " +phone_num);
    
	if(isProvider == "true"){
		$.ajax({
	        type: "POST",
	        url: VIDEO_VISITS.Path.grid.meeting.vendorDialOut,
	        cache: false,
	        async: true,
	        data: phone_num,
	        success: function(returndata){
	            alert("success - work in progress");
	        },
	        error: function(){
	            // display error message
	            alert("error");
	        }
	    });
	} else{
		alert("coming soon...");
	}
}

function participantCreated(participant){
    var participantDetails = participant;
	console.log("inside participantCreated: " +participant);
	
    /*var participant_name = participant.display_name;
    console.log("Participant Name: " +participant.display_name);

    var providerFirstName = $("#providerFirstName").val();
    console.log("Provider First Name: " +providerFirstName);

    if(providerFirstName.toLowerCase().indexOf(participant_name.toLowerCase()) > -1){
        console.log("it's a match!!!");
        console.log("Participant uuid: " +participant.uuid);
    } else{
        console.log("it's not a match!!! :(");
    }*/
	
    if(isProvider == "true"){
        // var patientFirstName = $("#patientDisplayName").val().split(/[ ,]+/);
        // var participantName = participant.display_name.split(/[ ,]+/);

        var patientFirstName = "Patient1";
        var participantName = "Participant1";

        console.log("patientFirstName: " +patientFirstName);
        console.log("participantName: " +participantName);

        for (var i = 0; i < patientFirstName.length; i++) {
            for (var j = 0; j < participantName.length; j++) {
                if (patientFirstName[i] === participantName[j]) {
                    console.log("It's a match!!! :)");

                    var uuid = participant.uuid;
                    console.log("Participant uuid: " +participant.uuid);

                    rtc.setParticipantSpotlight(uuid, true);
                } else{
                    console.log("It's not a match!!! :(");         
                }
            }
        }
        return false;
    } else{
        // var providerFirstName = $("#providerFirstName").val().split(",");
        // var participantName = participant.display_name.split(/[ ,]+/);
        
        var providerFirstName = "Provider1";
        var participantName = "Participant1";

        console.log("providerFirstName: " +providerFirstName);
        console.log("participantName: " +participantName);

        for (var i = 0; i < providerFirstName.length; i++) {
            for (var j = 0; j < participantName.length; j++) {
                if (providerFirstName[i] === participantName[j]) {
                    console.log("It's a match!!! :)");

                    var uuid = participant.uuid;
                    console.log("Participant uuid: " +participant.uuid);

                    rtc.setParticipantSpotlight(uuid, true);
                } else{
                    console.log("It's not a match!!! :(");         
                }
            }
        }
        return false;
    }
}

function participantUpdated(participant){
    console.log("inside participantUpdated");
}

function participantDeleted(participant){
    console.log("inside participantDeleted");
}

function layoutUpdate(view){
    console.log("inside layoutUpdate - view: " +view.view);
    
    switch(view.view){
        case "1:7":
            console.log("Layout 1:7");
            break;
        case "1:21":
            console.log("Layout 1:21");
            break;
        case "2:21":
            console.log("Layout 2:21");
            break;
        case "1:0":
            console.log("Layout 1:0");
            break;
        case "4:0":
            console.log("Layout 4:0");
            // rtc.transformLayout({layout: "2:21", streaming_indicator: true, enable_overlay_text:true});
            // rtc.transformLayout({"layout": "4:0"});
            break;            
        default:
            console.log("default case - cannot get view");
            break;
    }
}
// {view: "1:7", participants: ["a0196175-b462-48a1-b95c-f322c3af57c1", "65b4af2f-657a-4081-98a8-b17667628ce3”]};

/*function adjustLayout(participants, isHostAvail){
    var totalPartcicipants = participants.length;
    var view = "";
    if(isHostAvail){
        if(totalPartcicipants == 2){
            view = "1:0";
            console.log("adjustLayout - view:" +view);
        } else if(totalPartcicipants > 2){
            view = "1:7";
            console.log("adjustLayout - view:" +view);
        }
    } else {
        if(totalPartcicipants > 1){
          view = "4:0";
        } else {
            view = "1:0";
        }
    }
    if(currentLayout != view){
        rtc.transformLayout({"layout": view});
    }
}*/

function getMediaStats(){
    console.log("inside getMediaStats");

    if(set_interval == "false"){
        set_interval = "true";

        set_interval_callback = setInterval(function(){
            console.log("getting info every 5 seconds");
            media_stats = rtc.getMediaStatistics();
            media_stats_for_console = JSON.stringify(rtc.getMediaStatistics());
            console.log("Media Stats: " +media_stats_for_console);

            $("#stat-window").html("<tr>" +
                    "<th> Incoming Audio </th>" +
                    "<th> Incoming Video </th>" +
                    "<th> Outgoing Audio </th>" +
                    "<th> Outgoing Video </th>" +
                "</tr>" +
                "<tr>" +
                    "<td> Bitrate - " + media_stats.incoming.audio.bitrate + "</td>" +
                    "<td> Bitrate - " + media_stats.incoming.video.bitrate + "</td>" +
                    "<td> Bitrate - " + media_stats.outgoing.audio.bitrate + "</td>" +
                    "<td> Bitrate - " + media_stats.outgoing.video.bitrate + "</td>" +
                "</tr>" +
                "<tr>" +
                    "<td> Codec - " + media_stats.incoming.audio.codec + "</td>" +
                    "<td> Codec - " + media_stats.incoming.video.codec + "</td>" +
                    "<td> Codec - " + media_stats.outgoing.audio.codec + "</td>" +
                    "<td> Codec - " + media_stats.outgoing.video.codec + "</td>" +
                "</tr>" +
                "<tr>" +
                    "<td> Packets Lost - " + media_stats.incoming.audio['packets-lost'] + '</td>' +
                    "<td> Decode Delay - " + media_stats.incoming.video['decode-delay'] + "</td>" +
                    "<td> Packets Lost - " + media_stats.outgoing.audio['packets-lost'] + "</td>" +
                    "<td> Configured Bitrate - " + media_stats.outgoing.video['configured-bitrate'] + "</td>" +
                "</tr>" +
                "<tr>" +
                    "<td> Packets Received - " + media_stats.incoming.audio['packets-received'] + "</td>" +
                    "<td> Packets Lost - " + media_stats.incoming.video['packets-lost'] + "</td>" +
                    "<td> Packets Sent - " + media_stats.outgoing.audio['packets-sent'] + "</td>" +
                    "<td> Packets Lost - " + media_stats.outgoing.video['packets-lost'] + "</td>" +
                "</tr>" +
                "<tr>" +
                    "<td> Percentage Lost - " + media_stats.incoming.audio['percentage-lost'] + "</td>" +
                    "<td> Packets Received - " + media_stats.incoming.video['packets-received'] + "</td>" +
                    "<td> Percentage Lost - " + media_stats.outgoing.audio['percentage-lost'] + "</td>" +
                    "<td> Packets Sent - " + media_stats.outgoing.video['packets-sent'] + "</td>" +
                "</tr>" +
                "<tr>" +
                    "<td> Percentage Lost Recent - " + media_stats.incoming.audio['percentage-lost-recent'] + "</td>" +
                    "<td> Percentage Lost - " + media_stats.incoming.video['percentage-lost'] + "</td>" +
                    "<td> Percentage Lost Recent - " + media_stats.outgoing.audio['percentage-lost-recent'] + "</td>" +
                    "<td> Percentage Lost - " + media_stats.outgoing.video['percentage-lost'] + "</td>" +
                "</tr>" +
                "<tr>" +
                    "<td> </td>" +
                    "<td> Percentage Lost Recent - " + media_stats.incoming.video['percentage-lost-recent'] + "</td>" +
                    "<td> </td>" +
                    "<td> Percentage Lost Recent - " + media_stats.outgoing.video['percentage-lost-recent'] + "</td>" +
                "</tr>" +
                "<tr>" +
                    "<td> </td>" +
                    "<td> Resolution - " + media_stats.incoming.audio.resolution + "</td>" +
                    "<td> </td>" +
                    "<td> Resolution - " + media_stats.incoming.video.resolution + "</td>" +
                "</tr>");
        }, 1000);
        
        $("#stat-window-container").toggle();
        $("#info-button").css("background", "#f38b3c");
        
        /*if ($("#stat-window-container").style.display === "none") {
            $("#stat-window-container").style.display = "block";
        } else {
            $("#stat-window-container").style.display = "none";
        }*/
        
    } else if(set_interval == "true"){
        console.log("Stop Info");
        set_interval = "false";
        $("#stat-window-container").toggle();
        $("#info-button").css("background", "#555");
        clearInterval(set_interval_callback);
    }
}

function connected(url) {
    console.log("inside connected");

    if (source == 'screen') {
        video.poster = "img/screenshare.png";
    } else {
        videoURL = url;
        if (video) {
            video.poster = "";
            if (typeof(MediaStream) !== "undefined" && videoURL instanceof MediaStream) {
                video.srcObject = videoURL;
            } else {
                video.src = videoURL;
            } 
            id_fullscreen.classList.remove("inactive");
        }
    }
//    toggleSelfview();
}

function switchDevices(){
    // rtc.user_media_stream = stream;

	// rtc.video_source =  cameraID;
    // rtc.audio_source =  microPhoneID;
    
    // if(switchingDevice==1)
    	// rtc.renegotiate(vmrInfoData.confNode, "meet.KNW_3344556611","rads", bandwidth);
    // rtc.renegotiate("Join+Conference");
    
	rtc.renegotiate();
}

function initialise(confnode, conf, userbw, username, userpin, req_source, flash_obj) {
    console.log("inside webui initialise");

    /*$("#selectPeripheral").detach().appendTo($("#rosterlist"));
    $("#enterDetails").addClass("hidden");
    $("#enterDetails").addClass("hidden");
    $("#selectrole").removeClass("hidden");*/

    video = document.getElementById("video");
    id_selfview = document.getElementById('id_selfview');
    id_muteaudio = document.getElementById('id_muteaudio');
    id_mutevideo = document.getElementById('id_mutevideo');
    id_fullscreen = document.getElementById('id_fullscreen');
    id_screenshare = document.getElementById('id_screenshare');
    id_presentation = document.getElementById('id_presentation');

    // flash = flash_obj;
    // if (flash) {
    //     id_selfview.textContent = trans['BUTTON_HIDESELF'];
    //     id_selfview.classList.add('selected');
    //     videoPresentation = false;
    // }
    console.log("Video: " + video);
    console.log("Bandwidth: " + userbw);

    pin = userpin;
    bandwidth = parseInt(userbw);
    name = decodeURIComponent(username).replace('+', ' ');
    source = req_source;

    rtc = new PexRTC();

    // rtc.video_source =  cameraID;    //cameraID
    // rtc.audio_source =  audioSource;    //microPhoneID
    
    window.addEventListener('beforeunload', finalise);

    rtc.onSetup = doneSetup;
    rtc.onConnect = connected;
    rtc.onError = handleError;
    rtc.onDisconnect = remoteDisconnect;
    rtc.onHoldResume = holdresume;
    rtc.onRosterList = updateRosterList;
    rtc.onPresentation = presentationStartStop;
    rtc.onPresentationReload = loadPresentation;
    rtc.onScreenshareStopped = unpresentScreen;
    rtc.onPresentationConnected = loadPresentationStream;
    rtc.onPresentationDisconnected = remotePresentationClosed;
    rtc.onParticipantCreate = participantCreated;
    rtc.onParticipantUpdate = participantUpdated;
    rtc.onParticipantDelete = participantDeleted;
    rtc.onLayoutUpdate = layoutUpdate;
    
    conference = conf;
    console.log("Conference: " + conference);

    startTime = new Date();
    rtc.makeCall(confnode, conference, name, bandwidth, source, flash);
}

function disconnect(){
    console.log("inside disconnect");
    rtc.disconnect();
    window.location.href =  'index.html';
    /*if(isProvider == "true"){
        window.location.href =  '/videovisitproviderpexip/myMeetings.htm';
        window.location.href =  '/videovisit/myMeetings.htm';
    } else{
    	window.location.href = '/videovisitmemberpexip/landingready.htm';
        window.location.href = '/videovisit/landingready.htm';
    }*/
}
