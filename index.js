const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const PORT = process.env.PORT || 5000;
const {WebhookClient} = require('dialogflow-fulfillment');
const {Card, Suggestion} = require('dialogflow-fulfillment');

const server = express();
server.use(express.static(path.join(__dirname, 'public')));
server.use(bodyParser.urlencoded({
    extended: true
}));
server.use(bodyParser.json());

server.get('/', (req, res) = > res.send('page'));

server.post('/parking_bot', (request, response) = > {
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
    agent.add('Antwort von Node');
}

let intentMap = new Map();
intentMap.set('Default Welcome Intent', welcome);
intentMap.set('Default Fallback Intent', fallback);
intentMap.set('parkingslot.free', answer);
agent.handleRequest(intentMap);
})
;