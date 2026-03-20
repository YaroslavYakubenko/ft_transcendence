const express = require('express'); // load express library and stores it in variable express

const app = express();				// creates your express application
const PORT = 3000;					// shall it actually be port 3000?

app.use(express.json());			// if client sends json, parse it and put it into req.body

app.get('/health',(req, res) => {	// when request is sent to URL 'health', run the following function
	res.json({status:'ok'});		// sends json response ('ok') back to client 
});

app.get('/', (req, res) => {
	res.send('Server is running');	// res.send sends plain text, res.json specifically sends json
});

app.listen(PORT, () => {			// starts the server / start listening for incoming requests, using port 3000
	console.log(`Server running on http://localhost:${PORT}`);	// prints msg in the terminal 
});

