import express from "express" // load express library and stores it in variable express
import cors from "cors"

const app = express();				// creates your express application
const PORT = process.env.PORT || 3000;			

app.use(cors({
	origin: "http://localhost:5173",
	credentials: true,
}));

app.use(express.json());			// if client sends json, parse it and put it into req.body

const users = [
	{
		id: 1,
		email: "test@example.com",
		password: "123456",
		username: "testuser",
	},
];

app.get('/health',(_req, res) => {	// when request is sent to URL 'health', run the following function
	res.json({status:'ok'});		// sends json response ('ok') back to client 
});

app.post("/auth/login", (req, res) => {
	const {email, password } = req.body;

	if (!email || !password) {
		return res.status(400).json({
			error: "Email and password are required",
		});
	}


const user = users.find(
	(u) => u.email === email && u.password === password
);

if (!user){
	return res.status(401).json({
		error: "Invalid email or password",
	});
}

return res.json({
	token: "fake-jwt-token",
	user: {
		id: user.id,
		email: user.email,
		username: user.username,
		},
	});
});

app.get('/', (req, res) => {
	res.send('Server is running');	// res.send sends plain text, res.json specifically sends json
});

app.listen(PORT, () => {			// starts the server / start listening for incoming requests, using port 3000
	console.log(`Server running on http://localhost:${PORT}`);	// prints msg in the terminal 
});

