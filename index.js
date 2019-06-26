const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const PORT = process.env.PORT || 5000;
const {WebhookClient} = require('dialogflow-fulfillment');

let mqtt = require('mqtt')
let client  = mqtt.connect('mqtt://iot.eclipse.org')

client.on('connect', function () {
    client.subscribe('S1810629011A/outTopic', function (err) {
        console.log("subscribtion");
        if (!err) {
            client.publish('S1810629011A/inTopic', 'Connection working')
        }
    })
})


const server = express();
server.use(express.static(path.join(__dirname, 'public')));
server.use(bodyParser.urlencoded({
    extended: true
}));



server.use(bodyParser.json());
let frontend = '<h1>page</h1>';
server.get('/', (req, res) => res.send(frontend));

server.post('/parking_bot', (request, response) => {

    const agent = new WebhookClient({request, response});
console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
console.log('Dialogflow Request body: ' + JSON.stringify(request.body));

function welcome(agent) {
    agent.add(`Willkommen zum Parking Bot!`);
}

function fallback(agent) {
    agent.add(`Ich konnte dich nicht verstehen`);
    // agent.add(`I'm sorry, can you try again?`);
}

function answer(agent) {

    client.on('message', function (topic, message) {
        // message is Buffer

        console.log("message: " + message.toString());
        client.publish('S1810629011A/inTopic', 'Message sent from node')
        agent.add(message.toString());

    })

}

let intentMap = new Map();
intentMap.set('Default Welcome Intent', welcome);
intentMap.set('Default Fallback Intent', fallback);
intentMap.set('parkingslot.free', answer);
agent.handleRequest(intentMap);
});




server.listen(PORT, () => console.log(`Listening on ${ PORT }`));

