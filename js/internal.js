
function onFailure(err) {
    'use strict';
    alert("Não foi possivel conectar ao servidor\n" + err.errorCode + " " + err.errorMessage);
}

// called when the client connects
function onConnect() {
    'use strict';
    // Once a connection has been made, make a subscription and send a message.
    document.getElementById("led_serv_con").className = "led led-orange";
    console.log("onConnect");
    connected = true;
    client.subscribe("heat/sensor/caldeira", {qos: 2});
    client.subscribe("heat/sensor/cilindro", {qos: 2});
    client.subscribe("heat/historic", {qos: 2});
    client.subscribe("nodered", {qos: 2});
    client.subscribe("heat/relay/caldeira", {qos: 2});
    client.subscribe("heat/relay/cilindro", {qos: 2});
    client.subscribe("heat/forced/caldeira", {qos: 2});
    client.subscribe("heat/forced/cilindro", {qos: 2});
    client.subscribe("heat/timer/config", {qos: 2});
    client.subscribe("heat/timer/enable", {qos: 2});
    client.subscribe("heat/timer2/config", {qos: 2});
    client.subscribe("heat/timer2/enable", {qos: 2});
    // first time here?
    if (client.reconnectTimer !== null)
    {
        clearInterval(client.reconnectTimer);
    }
}

// called when the client loses its connection
function onConnectionLost(responseObject) {
    'use strict';
    if (responseObject.errorCode !== 0) {
        document.getElementById("led_serv_con").className = "led led-red";
        document.getElementById("led_caldeira").className = "led led-red";
        document.getElementById("led_cilindro").className = "led led-red";
        console.log("onConnectionLost:" + responseObject.errorMessage);
        connected = false;
        client.reconnectTimer = setInterval(client.connect, 2000);
    }else{
        document.getElementById("led_serv_con").className = "led led-red";
        document.getElementById("led_caldeira").className = "led led-red";
        document.getElementById("led_cilindro").className = "led led-red";
        connected = false;
    }
}

function findFirstNonZero(element){
    return element !== 0;
}

// called when a message arrives
function onMessageArrived(message) {
    'use strict';
    let aux;
    let x;
    let startTime;
    let endTime;
    switch (message.destinationName) {
        case (baseTopic + "sensor/caldeira"):
            // receive mqtt controller connection status
            // console.log(message);
            gaugeCaldeira.value = parseFloat(message.payloadString);
            gaugeCaldeira.draw();
            break;
        case (baseTopic + "sensor/cilindro"):
            // receive mqtt controller connection status
            // console.log(message);
            gaugeCilindro.value = parseFloat(message.payloadString);
            gaugeCilindro.draw();
            break;
        case ("nodered"):
            if(message.payloadString === "ON"){
                document.getElementById("led_serv_con").className = "led led-green";
            }else{
                document.getElementById("led_serv_con").className = "led led-orange";
            }
            break;
        case ("heat/relay/caldeira"):
            if(message.payloadString === "ON"){
                document.getElementById("led_caldeira").className = "led led-green";
            }else{
                document.getElementById("led_caldeira").className = "led led-red";
            }
            break;
        case ("heat/relay/cilindro"):
            if(message.payloadString === "ON"){
                document.getElementById("led_cilindro").className = "led led-green";
            }else{
                document.getElementById("led_cilindro").className = "led led-red";
            }
            break;
        case ("heat/forced/caldeira"):
            x = document.getElementById("ForceCal");
            if (message.payloadString === "ON"){
                x.checked = true;
            }
            if (message.payloadString === "OFF"){
                x.checked = false;
            }
            break;
        case ("heat/forced/cilindro"):
            x = document.getElementById("ForceCil");
            if (message.payloadString === "ON"){
                x.checked = true;
            }
            if (message.payloadString === "OFF"){
                x.checked = false;
            }
            break;
        case("heat/historic"):

            aux = JSON.parse(message.payloadString);
            const index = aux.time.findIndex(findFirstNonZero);
            if (index > 0){
                tempCal = aux.tempCal.slice(index);
                tempCil = aux.tempCil.slice(index);
                labels = aux.time.slice(index);
            }else{
                tempCal = aux.tempCal;
                tempCil = aux.tempCil;
                labels = aux.time;
            }
            graph.data.labels = labels;
            graph.data.datasets[0].data = tempCil;
            graph.data.datasets[1].data = tempCal;
            graph.update();
            break;
        case("heat/timer/config"):
            aux = JSON.parse(message.payloadString);
            startTime = numberFormat(Math.floor(aux.start / 60), 2) + ":" + numberFormat(aux.start % 60, 2);
            endTime = numberFormat(Math.floor(aux.end / 60), 2) + ":" + numberFormat(aux.end % 60, 2);
            document.getElementById("timer_enabled").innerText = aux.state;
            document.getElementById("timer_on_value").innerText = startTime;
            document.getElementById("timer_off_value").innerText = endTime;
            document.getElementById("timer_offset_value").innerText = aux.offset;
            document.getElementById("timer_min_temp").innerText = aux.temp_min;
            break;
        case("heat/timer/enable"):
            x = document.getElementById("heating_auto");
            if (message.payloadString === "auto"){
                x.checked = true;
            }else{
                if(message.payloadString === "stop"){
                    x.checked = false;
                }
            }
            break;
        case("heat/timer2/config"):
            aux = JSON.parse(message.payloadString);
            startTime = numberFormat(Math.floor(aux.start / 60), 2) + ":" + numberFormat(aux.start % 60, 2);
            endTime = numberFormat(Math.floor(aux.end / 60), 2) + ":" + numberFormat(aux.end % 60, 2);
            document.getElementById("timer2_enabled").innerText = aux.state;
            document.getElementById("timer2_on_value").innerText = startTime;
            document.getElementById("timer2_off_value").innerText = endTime;
            document.getElementById("timer2_offset_value").innerText = aux.offset;
            document.getElementById("timer2_min_temp").innerText = aux.temp_min;
            break;
        case("heat/timer2/enable"):
            x = document.getElementById("heating2_auto");
            if (message.payloadString === "auto"){
                x.checked = true;
            }else{
                if(message.payloadString === "stop"){
                    x.checked = false;
                }
            }
            break;
        default:
            console.log("Message Received: Topic: ", message.destinationName, ". Payload: ", message.payloadString, ". QoS: ", message.qos);
    }
}


// Just in case someone sends html
function safe_tags_regex(str) {
    'use strict';
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function makeid() {
    'use strict';
    let text = "";
    let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let i;
    for (i = 0; i < 5; i += 1){
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
// Things to do as soon as the page loads
const user = "manager-" + makeid();
const hostname = "192.168.1.14";
const port = 8080;
const path = "/ws";
const baseTopic = "heat/";
let connected = false;
let cleanSession = true;
let labels = [];
let tempCil = [];
let tempCal = [];
const color = Chart.helpers.color;
const timeFormat = 'HH:mm';

let gaugeCaldeira = new RadialGauge({
    renderTo: "gauge_caldeira",
    width: "auto",
    height: "auto",
    type: "radial-gauge",
    title: "Caldeira",
    minValue: 0,
    maxValue: 120,
    majorTicks: [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120],
    minorTicks: 2,
    strokeSicks: true,
    units: "ºC",
    valueFormat: "3.2",
    fontNumbers: "Led",
    fontValue: "Led",
    fontValueSize: 30,
    animationDelay: 10,
    animationDuration: 200,
    animationFn: "bounce",
    colorTitle: "#00f",
    highlights: [
        {from: 0, to: 20, color: "#0000FF" },
        {from: 20, to: 60, color: "#FFFF00" },
        {from: 60, to: 90, color: "#FF9900" },
        {from: 90, to: 120, color: "#FF0000" }
    ]
}).draw();

let gaugeCilindro = new RadialGauge({
    renderTo: "gauge_cilindro",
    width: "auto",
    height: "auto",
    type: "radial-gauge",
    title: "Cilindro",
    minValue: 0,
    maxValue: 120,
    majorTicks: [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120],
    minorTicks: 2,
    strokeSicks: true,
    units: "ºC",
    valueFormat: "3.2",
    fontNumbers: "Led",
    fontValue: "Led",
    fontValueSize: 30,
    animationDelay: 10,
    animationDuration: 200,
    animationFn: "bounce",
    colorTitle: "#00f",
    highlights: [
        {from: 0, to: 20, color: "#0000FF" },
        {from: 20, to: 60, color: "#FFFF00" },
        {from: 60, to: 90, color: "#FF9900" },
        {from: 90, to: 120, color: "#FF0000" }
    ]
}).draw();

// testing graph code
let ctx = document.getElementById("graph1");
let graph = new Chart(ctx, {
    type: 'line',
    data: {
        labels: labels,
        datasets: [{
            label: 'Cilindro',
            backgroundColor: "#b70000",
            borderColor: "#fd0000",
            fill: false,
            data: tempCil
        }, {
            label: 'Caldeira',
            backgroundColor: "#0089c9",
            borderColor: "#00bcff",
            fill: false,
            data: tempCal
        }]
    },
    options: {
        title: {
            text: "Temperaturas nas últimas 6 horas"
        },
        scales: {
            xAxes: [{
                type: 'time',
                time: {
                    displayFormats: {
                        minute: timeFormat
                    },
                    tooltipFormat: 'll HH:mm'
                },
                scaleLabel: {
                    display: true,
                    labelString: 'Date'
                }
            }],
            yAxes: [{
                scaleLabel: {
                    display: true,
                    labelString: 'value'
                }
            }]
        },
    }
});


let client = new Paho.Client(hostname, Number(port), path, user);
client.reconnectTimer = null;


if (!Array.prototype.forEach) {
    Array.prototype.forEach = function(cb) {
        let i;
        let s = this.length;
        for (i = 0; i < s; i += 1) {
            cb && cb(this[i], i, this);
        }
    };
}

document.fonts && document.fonts.forEach( function(font) {
    font.loaded.then(function() {
        if (font.family.match(/Led/)) {
            document.gauges.forEach(function(gauge) {
                gauge.update();
                // gauge.options.renderTo.style.visibility = "visible";
            });
        }
    });
});



// set callback handlers
client.onConnectionLost = onConnectionLost;
client.onMessageArrived = onMessageArrived;

client.connect({
    onSuccess: onConnect,
    mqttVersion: 4,
    cleanSession: cleanSession,
    onFailure: onFailure
});

function toggleForceCal(){
    var x=document.getElementById("ForceCal");
    if(x.checked === true){
        console.log("ForceCal on");
        client.send("heat/forced/caldeira", "ON", 2, true);
    }
    if(x.checked === false){
        console.log("ForceCal off");
        client.send("heat/forced/caldeira", "OFF", 2, true);
    }
}

function toggleForceCil(){
    var x=document.getElementById("ForceCil");
    if(x.checked === true){
        console.log("ForceCil on");
        client.send("heat/forced/cilindro", "ON", 2, true);
    }
    if(x.checked === false){
        console.log("ForceCil off");
        client.send("heat/forced/cilindro", "OFF", 2, true);
    }
}

function toggleTimerConfig(id){
    let x = null;
    let i = 0;
    if (id === 1){
        // configure timer 1
        // get timer1 start settings element
        x = document.getElementsByName("timer1_start_selection");

        while(i< x.length) {
            // find the checked value
            if (x[i].checked === true) {
                // config the message to be sent
                switch(x[i].value) {
                    case "dawn":
                        console.log("Timer1 start settings: " + x[i].value);
                        client.send("heat/timer/enable", "on_override " + "dawn", 2, true);
                        break;
                    case "dusk":
                        console.log("Timer1 start settings: " + x[i].value);
                        client.send("heat/timer/enable", "on_override " + "dusk", 2, true);
                        break;
                    case "timer":
                        console.log("Timer1 start settings: " + x[i].value);
                        x = document.getElementById("timer1_start_time").value;
                        // remove seconds values
                        x.slice(0, -3);
                        x = "on_override " + x;
                        console.log(x)
                        client.send("heat/timer/enable", x, 2, true);
                        break;
                    default:
                        console.log("Timer1 start settings: unknown");
                }
                break;
            }
            i++;
        }
        // get timer1 end settings element
        x = document.getElementsByName("timer1_end_selection");
        // reset i
        i = 0;
        while(i< x.length) {
            // find the checked value
            if (x[i].checked === true) {
                // config the message to be sent
                switch(x[i].value) {
                    case "dawn":
                        console.log("Timer1 end settings: " + x[i].value);
                        client.send("heat/timer/enable", "off_override " + "dawn", 2, true);
                        break;
                    case "dusk":
                        console.log("Timer1 end settings: " + x[i].value);
                        client.send("heat/timer/enable", "off_override " + "dusk", 2, true);
                        break;
                    case "timer":
                        console.log("Timer1 end settings: " + x[i].value);
                        x = document.getElementById("timer1_end_time").value;
                        // remove seconds values
                        x.slice(0, -3);
                        x = "off_override " + x;
                        console.log(x)
                        client.send("heat/timer/enable", x, 2, true);
                        break;
                    default:
                        console.log("Timer1 end settings: unknown");
                }
                break;
            }
            i++;
        }
        // at the end, sync heating enabled or not because timer do not assume it
        x=document.getElementById("heating_auto");
        if(x.checked === true){
            console.log("Heating 1 on");
            client.send("heat/timer/enable", "auto", 2, true);
        }
        if(x.checked === false){
            console.log("Heating 1 stopped");
            client.send("heat/timer/enable", "stop", 2, true);
        }
    }else{
        // configure timer 2
        // get timer2 start settings element
        x = document.getElementsByName("timer2_start_selection");

        while(i< x.length) {
            // find the checked value
            if (x[i].checked === true) {
                // config the message to be sent
                switch(x[i].value) {
                    case "dawn":
                        console.log("Timer2 start settings: " + x[i].value);
                        client.send("heat/timer2/enable", "on_override " + "dawn", 2, true);
                        break;
                    case "dusk":
                        console.log("Timer2 start settings: " + x[i].value);
                        client.send("heat/timer2/enable", "on_override " + "dusk", 2, true);
                        break;
                    case "timer":
                        console.log("Timer2 start settings: " + x[i].value);
                        x = document.getElementById("timer2_start_time").value;
                        // remove seconds values
                        x.slice(0, -3);
                        x = "on_override " + x;
                        console.log(x)
                        client.send("heat/timer2/enable", x, 2, true);
                        break;
                    default:
                        console.log("Timer2 start settings: unknown");
                }
                break;
            }
            i++;
        }
        // get timer2 end settings element
        x = document.getElementsByName("timer2_end_selection");
        // reset i
        i = 0;
        while(i< x.length) {
            // find the checked value
            if (x[i].checked === true) {
                // config the message to be sent
                switch(x[i].value) {
                    case "dawn":
                        console.log("Timer2 end settings: " + x[i].value);
                        client.send("heat/timer2/enable", "off_override " + "dawn", 2, true);
                        break;
                    case "dusk":
                        console.log("Timer2 end settings: " + x[i].value);
                        client.send("heat/timer2/enable", "off_override " + "dusk", 2, true);
                        break;
                    case "timer":
                        console.log("Timer2 end settings: " + x[i].value);
                        x = document.getElementById("timer2_end_time").value;
                        // remove seconds values
                        x.slice(0, -3);
                        x = "off_override " + x;
                        console.log(x)
                        client.send("heat/timer2/enable", x, 2, true);
                        break;
                    default:
                        console.log("Timer2 end settings: unknown");
                }
                break;
            }
            i++;
        }
        // at the end, sync heating enabled or not because timer do not assume it
        x=document.getElementById("heating2_auto");
        if(x.checked === true){
            console.log("Heating 2 on");
            client.send("heat/timer2/enable", "auto", 2, true);
        }
        if(x.checked === false){
            console.log("Heating 2 stopped");
            client.send("heat/timer2/enable", "stop", 2, true);
        }

    }
}

function toggleHeating(id){
    let x = null;
    switch (id){
        case 1:
            x=document.getElementById("heating_auto");
            if(x.checked === true){
                console.log("Heating 1 on");
                client.send("heat/timer/enable", "auto", 2, true);
            }
            if(x.checked === false){
                console.log("Heating 1 stopped");
                client.send("heat/timer/enable", "stop", 2, true);
            }
            break;
        case 2:
            x=document.getElementById("heating2_auto");
            if(x.checked === true){
                console.log("Heating 2 on");
                client.send("heat/timer2/enable", "auto", 2, true);
            }
            if(x.checked === false){
                console.log("Heating 2 stopped");
                client.send("heat/timer2/enable", "stop", 2, true);
            }
            break;
        default:
            console.log("Unknown ID:%d", id);
    }
}

function toggle_timer(elementId, number, value){
    switch(number){
        case 1:
            if (value){
                document.getElementById(elementId).removeAttribute("hidden");
            }else{
                document.getElementById(elementId).setAttribute("hidden", true);
            }
            break;
        case 2:
            if (value){
                document.getElementById(elementId).removeAttribute("hidden");
            }else{
                document.getElementById(elementId).setAttribute("hidden",true);
            }
            break;
        default:
            console.log("Unknown value show_timer number=%d", number);
    }
}
function numberFormat(number, width){
    return new Array(width + 1 - (number + '').length).join('0') + number;
}


