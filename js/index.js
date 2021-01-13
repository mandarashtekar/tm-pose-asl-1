/*
*  Pexip Sample Personal
*
*  This is a simplified version of Pexip sample code
*/

'use strict';

/*window.onload = () => {
  console.log("inside index.js - onload");
}

$(document).ready(function(){
    console.log("inside index.js - document.ready");
});*/

var isHost = false;

$('input:radio[name="role"]').change(function() {
    console.log("Role selected");
    if ($(this).val() == '2') {
        console.log("Host Role selected");
        pinentry.classList.remove("hidden");
        isHost = true;
        $("#id_pin").focus();
    } else {
        console.log("Guest Role selected");
        pinentry.classList.add("hidden");
    }
});

$("#join-conf").on("click", function(){
    console.log("join-conf clicked");

    var alias = $("#id_alias").val();
    var name = $("#id_name").val();
    var bandwidth = "1280";
    var source = "Join+Conference";
    var id_guest = document.getElementById('id_guest');
    var pin = $("#id_pin").val();

    window.location.href = "videoconf.html?alias="+alias+"&name="+name+"&bandwidth="+bandwidth+"&source="+source+"&pin="+pin+"&isHost="+isHost;

    // initialise("vve-tpmg-lab.kp.org", alias, bandwidth, name, "", source);
});

