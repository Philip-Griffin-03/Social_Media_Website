import express from 'express';
import bodyParser from 'body-parser';
import { MongoClient,ServerApiVersion, ObjectId } from 'mongodb';
import session from 'express-session';

const uri = 'example';

const client = new MongoClient(uri, {//setting up Mongosb server
    serverApi: {
        version: ServerApiVersion.v1,
        strict: false,
        deprecationErrors: true,
    }
});

const database = client.db("database");
const collection = database.collection("data");
const usercollection = database.collection("users");
const followingcollection = database.collection("following");//creating collections from the Mongodb database to use

const app = express();

app.use(express.static('public'));
app.use(bodyParser.json());

app.use(session({//sets up session management
    secret: 'secretkey', 
    resave: false,
    saveUninitialized: false
}));

app.post('/M00961140/users', async (request, response) => {//handles the user registering

    const {username, password} = request.body;
    
    const result = await usercollection.insertOne(request.body);
    console.log(result);
    response.send({"message": "data received"});
    
});

app.get('/M00961140/login', (request, response) => {//gets back a check if a user is currently logged in or not

    if (request.session.user){
        response.json({loggedIn: true, username: request.session.user});
    }
    else{
        response.json({loggedIn: false});
    }
});

app.post('/M00961140/login', async (request, response) => {//sends data inputted from user and check against database to see if user details are correct
    const {username, password} = request.body;

    const user = await usercollection.findOne({username, password});

    if (user){
        request.session.user = username;//updates the session user so a user is currently logged in
        response.json({ status: 'success', message: 'User logged in successfully' , username: username});
    } else {
        response.json({ status: 'error', message: 'Invalid credentials' });
    }

});

app.delete('/M00961140/login', (request, response) => {//handles the user logging out
    try {
        request.session.destroy((error) => {//this will destroy the current session user meaning no user is currently logged in
          if (error) {
            console.error('Session destroy error:', error);
            return response.json({ message: 'Logout failed' });
          }
          response.json({ message: 'Successfully logged out' });
        });
      } catch (error) {//catch used to catch errors and display message
        console.error('Unexpected error during logout:', error);
        response.json({ message: 'An unexpected error occurred' });
      }
    
});

app.post('/M00961140/contents', async (request, response) => {//handles the user posting content onto the site

    const {title, paragraph} = request.body;
    
    
    if (!request.session.user){//checks if user is logged in, prompted if not
        return response.json({ status: 'error', message: 'You must log in first' });
    }

    const data = {username: request.session.user, title, paragraph};//this adds the current session users username

    const result = await collection.insertOne(data);//adds the content into the database
    console.log(result);
    response.send({"message": "data received"});
    
    
});

app.get('/M00961140/contents/search', async (request, response) => {//handles searching content from users input
    try {//the collection used in this function is collection which stores all the content posted, ensuring the correct data will be searched and displayed
        const searchQuery = request.query.search || '';//gets query from user
        console.log("sss",searchQuery);

        const result = await collection.find({//looks through database and checks if any of the fields contains the inputted data from the user
            $or: [
              { username: { $regex: searchQuery, $options: 'i' } },
              { title: { $regex: searchQuery, $options: 'i' } },
              { paragraph: { $regex: searchQuery, $options: 'i' } }
            ]
          }).toArray();//This will add it to an array to be used to display the data found
        console.log("dddd",result);
        response.json(result);
      } catch (error) {
        console.error('Error:', error);
        response.json({ error: 'Could not fetch data' });
      }
    
});


app.get('/M00961140/users/search', async (request, response) => {//handles searching users from users input
    try {//the collection used in this function is usercollection which holds all users and passwords, this ensures users wont be duplicated for how many posts they have
        const searchQuery = request.query.search || '';//gets query from user

        const result = await usercollection.find({//looks through database and checks if any of the fields contains the inputted data from the user
            $or: [
              { username: { $regex: searchQuery, $options: 'i' } }
            ]
          }).toArray();//This will add it to an array to be used to display the data found
        
        response.json(result);
      } catch (error) {
        console.error('Error:', error);
        response.json({ error: 'Could not fetch data' });
      }

    
});


app.post('/M00961140/follow', async (request, response) => {//handles allowing the user to follow another user

    const follow = request.body.username;//gets the username conencted to the button data
    try {
        const result = await followingcollection.updateOne(//updates the followingcollection is stores a username and the list of users they are following
            {username: request.session.user},
            {
                $addToSet: {following: follow},//adds the follow the user has selected
            },
            {upsert: true}

        );
        response.json({message: "User followed"});

    } catch (error) {
        console.error("Error following user:", error);
        response.json({ message: "Error following user." });
    }
});




app.listen(8080);
console.log("express listening on port 8080");
