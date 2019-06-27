const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const PORT = process.env.PORT || 5000;
const {WebhookClient} = require('dialogflow-fulfillment');

let mqtt = require('mqtt')
let client  = mqtt.connect('mqtt://iot.eclipse.org')

client.on('connect', function () {
    client.subscribe('S1810629011A/sendTemp', function (err) {
        console.log("subscribtion");
        // if (!err) {
        //     client.publish('S1810629011A/inTopic', 'Connection working')
        // }
    })
    client.subscribe('S1810629011A/sendParkingslot', function (err) {
        console.log("subscribtion parking");
        // if (!err) {
        //     client.publish('S1810629011A/inTopic', 'Connection working')
        // }
    })


});


const server = express();
server.use(express.static(path.join(__dirname, 'public')));
server.use(bodyParser.urlencoded({
    extended: true
}));



server.use(bodyParser.json());


let widget = "<iframe\n" +
    "    allow=\"microphone;\"\n" +
    "    width=\"350\"\n" +
    "    height=\"430\"\n" +
    "    src=\"https://console.dialogflow.com/api-client/demo/embedded/e6e26c9d-f57a-48a5-b7df-1482c544691e\">\n" +
    "</iframe>";
let frontend = '<h1>page</h1>' + widget;
server.get('/', (req, res) => res.send(frontend));

server.post('/parking_bot', (request, response) => {

    const agent = new WebhookClient({request, response});
// console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
// console.log('Dialogflow Request body: ' + JSON.stringify(request.body));

function welcome(agent) {
    agent.add(`Willkommen zum Parking Bot!`);
}

function fallback(agent) {

    agent.add(`Ich konnte dich nicht verstehen`);
    // agent.add(`I'm sorry, can you try again?`);
}

function answerTemperature(agent) {
    let temp = new Promise(function(resolve, reject) {
        client.publish('S1810629011A/getTemp', 'Message sent from node');
        client.on('message', function (topic, message) {
            // message is Buffer

            console.log("message: " + message.toString());

            resolve(message.toString());
            // client.publish('S1810629011A/inTopic', 'Message sent from node')

        })


    });
    return temp.then( response =>{
        console.log("success");
        agent.add("Es hat ca " + response + " Grad");
    })
        .catch(res =>{
            console.log("Error:" + res);
            agent.add(res);
        });
}

    function answerParkingslot(agent) {
        let parking = new Promise(function(resolve, reject) {
            client.publish('S1810629011A/getParkingslot', 'Message sent from node to get parking');
            client.on('message', function (topic, message) {
                console.log("message: " + message.toString());
                resolve(message);
            })
        });
        return parking.then( response =>{
            console.log("success" + response);
            agent.add("Der Parkplatz ist " + response);
        })
            .catch(res =>{
                console.log("Error:" + res);
                agent.add(res);
            });

    }

let intentMap = new Map();
intentMap.set('Default Welcome Intent', welcome);
intentMap.set('Default Fallback Intent', fallback);
intentMap.set('parkingslot.free', answerParkingslot);
intentMap.set('temperature', answerTemperature);
agent.handleRequest(intentMap);
});


server.listen(PORT, () => console.log(`Listening on ${ PORT }`));

