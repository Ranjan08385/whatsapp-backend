import express from 'express';
import mongoose from 'mongoose';
import Messages from './dbMessages.js';
import Pusher from 'pusher';
import Cors from 'cors';

const app = express();
const port = process.env.PORT || 9000;

const pusher = new Pusher({
    appId: '1069336',
    key: '883589bff1734482920f',
    secret: '584d1482ac94fdb63c17',
    cluster: 'ap2',
    encrypted: true
  });

app.use(express.json());
app.use(Cors());

// app.use((req,res,next) => {
//     res.setHeader("Access-Control-Allow-Origin", "*");
//     res.setHeader("Access-Control-Allow-Headers", "*");
//     next();
// });

const connection_url = 'mongodb+srv://ranjan-moger:Ranjan08385@cluster0.bdlnd.mongodb.net/whatsappdb?retryWrites=true&w=majority';
mongoose.connect(connection_url, {
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const db = mongoose.connection;

db.once('open', () => {
    console.log('DB Connected')

    const msgCollection = db.collection('messagecontents');
    const changeStream = msgCollection.watch();

    changeStream.on('change', (change) => {
        console.log(change);

        if(change.operationType === 'insert') {
            const messageDetails = change.fullDocument;
            pusher.trigger('messages', 'inserted', 
                {
                    name: messageDetails.name,
                    message: messageDetails.message,
                    timestamp: messageDetails.timestamp,
                    received: messageDetails.received
                }
            );
        } else {
            console.log('Error triggering pusher')
        }
    })

    
})

app.get('/', (req,res) => res.status(200).send('Hello Ranjan'));

app.get('/messages/sync', (req, res) => {
    Messages.find((err, data) => {
        if(err) {
            res.status(500).send(err)
        } else {
            res.status(200).send(data)
        }
    })
    
})

app.post('/messages/new', (req, res) => {
    const dbMessage = req.body

    Messages.create(dbMessage, (err, data) => {
        if(err) {
            res.status(500).send(err)
        } else {
            res.status(201).send(`new message created: \n ${data}`)
        }
    })
})

app.listen(port, () => console.log(`Listening on localhost: ${port}`));