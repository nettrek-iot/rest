import express from 'express';
//Library to handle requests to site
import { Request, Response } from 'express';
//Library to get absolute paths
import path from 'path';

//Library for secure connection for hololens use
import https from 'https';
//Library for json server
import jsonServer from 'json-server';
//Library for domain access from hololens
import cors from 'cors';
//Certificate for https
import selfsigned from 'selfsigned';
import {v4 as uuid4} from 'uuid';

// zum beenden zuvorlaufende RestDienste
// ps aux | grep node | grep restTest001 | awk '{print $2}' | xargs kill -9

//Setting up basic variables
const APP_PORT = 3002;
const DB_JSON_PATH = path.join(__dirname, 'db/db.json');
const LOCALHOST_CN = 'localhost';
const RASPBERRYPI_CN = 'raspberrypi.local';

//Create tool for access to the server without permission
const commonCors = cors();
//initialising express server
const app = express();
//use commonCors for server access 
app.use(commonCors);

//Declaring data table type
type Pi = {
    id: string;
    buttonA: boolean;
    buttonB: boolean;
}

//declaring data types data
type PiData = {
    id?: string;
    date?: string | Date,
    uuid: string,
    lux: number;
    temp: number;
}

//Create server
const router = jsonServer.router<{pis: Pi[], piData: PiData[]}>(DB_JSON_PATH);
// JSON-Server Middleware
app.use('/api', jsonServer.defaults(), router);

/*
const piDataDB = router.db.get('piData');
piDataDB.push({ id: uuid4(), uuid: '1asdasdas', date: new Date(), lux: 100, temp: 20 }).write();
*/
app.use('/create/:id/:lux/:temp', (req, res, next) => {
    const piDataDB = router.db.get('piData');
    const id = req.params.id;
    const lux = Number(req.params.lux);
    const temp = Number(req.params.temp);
    piDataDB.push({id: uuid4(), uuid:id, lux:lux, temp:temp}).write();
    res.send(id);
    next();
});

// Extracted helper function
function updateButtonState(id: string, button: 'A' | 'B', state: boolean): Pi | null {
    //Find pi to change button
    const db = router.db;
    const piRecordSet = db.get('pis').find({ id });

    if (!piRecordSet) return null;

    //Set value to button
    const pi = piRecordSet.value();
    if (button === 'A') pi.buttonA = state;
    else pi.buttonB = state;

    //Assign change to databank
    piRecordSet.assign(pi).write();
    return pi;
}

// return an HTML Page that shows All Pis in a Table and where buttonA and buttonB can be toggled on and off
app.get('/', (req: Request, res: Response) => {
    const db = router.db;
    const pis = db.get('pis').value();
    // Create checkboxes for buttonA and buttonB
    const rows = pis.map(pi => {
        return `<tr><td>${pi.id}</td><td>
        <input type="checkbox" ${pi.buttonA ? 'checked' : '' } onchange="switchBtn('${pi.id}', 'A', this.checked)"></td><td>
        <input type="checkbox" ${pi.buttonB ? 'checked' : '' } onchange="switchBtn('${pi.id}', 'B', this.checked)"></td></tr>`;
    });
    // CSS for look
    const style = `
    <style>
        table {
            width: 100%;
            border-collapse: collapse;
        }
        th, td {
            border: 1px solid black;
            padding: 15px;
            text-align: left;
        }
        tr:nth-child(even) {
            background-color: #eee;
        }
        tr:nth-child(odd) {
            background-color: #fff;
        }
        th {
            background-color: black;
            color: white;
        }
    </style>`;
    const script = `
    <script>
        //Changing data through checkbox
        function switchBtn(id, button, isChecked) {
            fetch('/set/' + id + '/' + button + '/' + isChecked,)
            .then(response => response.json())
            .then( 
                data => {
                    console.log('Success:', data);
                    location.reload();  
                }
             )
            
        }
        //Reload site every 2 seconds
        setInterval(() => { location.reload(); }, 2000 );
    </script>`;
    // Creating table with rows
    const table = `<table><tr><th>Id</th><th>Button A</th><th>Button B</th></tr>${rows.join('')}</table>`;
    // Create HTML Document with predefined variables
    const html = `<html><head>${style}</head><body>${script}${table}</body></html>`;
    // Send the HTML page
    res.send(html);
});

//Sets button states on loading change url
// /:id means that id can be accessed as variable through req
app.use('/set/:id/:button/:state', (req, res, next) => {
    //Get pi id from request
    const id = req.params.id;
    //Get button value from request
    const btnVal = req.params.button.trim().toLowerCase();
    //Get button state from request
    const stateVal = req.params.state.trim().toLowerCase();
    //Transfer state string to state boolean
    const state: boolean | undefined = stateVal === 'true' ? true : (stateVal === 'false' ? false : undefined);
    //Transfer button value to button string
    const button: 'A' | 'B' | undefined = btnVal === 'a' ? 'A' : (btnVal === 'b' ? 'B' : undefined);
    //Log changes
    console.log ( req.params, id, state, button );
    //If input was valid
    if (button !== undefined && state !== undefined ) {
        //Change buttons
        const pi = updateButtonState(id, button, state);
        if (pi) {
            // Display values of pi
            res.send(pi);
        } else {
            // error message/response 404 and pi id 
            res.status(404).send(`Record with id ${id} not found`);
        }
    } else {
        next();
    }
});

//Domains which are valid for certificate
const attrs = [
    { name: 'commonName', value: RASPBERRYPI_CN },
    { name: 'commonName', value: LOCALHOST_CN }
];
const pems = selfsigned.generate(attrs, { days: 365 });
//Create the server
https.createServer({
    //Create public and private certificate
    key: pems.private,
    cert: pems.cert
    }, app).listen(APP_PORT, () => {
    //Log link to website
  console.log(`Express-App läuft auf https://localhost:${APP_PORT} oder https://raspberrypi.local:${APP_PORT}`);
  console.log(`API-App läuft auf https://localhost:${APP_PORT}/api oder https://raspberrypi.local:${APP_PORT}/api`);
});
