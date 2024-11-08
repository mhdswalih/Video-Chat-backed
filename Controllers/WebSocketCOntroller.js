const UserModel = require('../models/userModel');

const Loadhomepage = (req, res) => {
    try {
        res.render('index'); 
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error'); 
    }
};

const loadIndexPage = async (req,res) =>{
    try {
        res.render('vid')
    } catch (error) {
        console.log(error)
    }       
}
const handleConnection = (ws) => {
    console.log('New client connected');
    const waitingUser = UserModel.getWaitingUser();

    if (waitingUser) {
        const partner = waitingUser;
        UserModel.removeWaitingUser();

        ws.partner = partner;
        partner.partner = ws;
        ws.send(JSON.stringify({ type: 'partner-found' }));
        partner.send(JSON.stringify({ type: 'partner-found' }));
    } else {
        UserModel.addWaitingUser(ws);
    }

    ws.on('message', (message) => {
        if (ws.partner) {
            ws.partner.send(message);
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');

        if (ws === UserModel.getWaitingUser()) {
            UserModel.removeWaitingUser();
        } else if (ws.partner) {
            ws.partner.send(JSON.stringify({ type: 'partner-disconnected' }));
            ws.partner.partner = null;
        }
    });
};

//leaodfronPage
const LoaddevChat = async (req,res)=>{
    try {
        res.render('devChat')
    } catch (error) {
        console.log(error);
        
    }
}
 
module.exports = {
    Loadhomepage,
    handleConnection,
    loadIndexPage,
    LoaddevChat,
};
