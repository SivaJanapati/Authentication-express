const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const app = express();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
let dbPath = path.join(__dirname, "covid19IndiaPortal.db");
let db = null;
app.use(express.json());

const initialiseDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is Running at localhost");
    });
  } catch (e) {
    console.log(`Error : ${e.message}`);
  }
};
initialiseDBAndServer();

app.post("/login/", async (request, response) => {
  const { username, password } = request.body;
  const query = `select * from user where username = '${username}';`;
  const userResult = await db.get(query);
  if (userResult === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isMatch = await bcrypt.compare(password, userResult.password);
    if (isMatch === false) {
      response.status(400);
      response.send("Invalid password");
    } else {
      const payload = { username: username };
      const jwtToken = jwt.sign(payload, "MY_SECRET_TOKEN");
      response.send({ jwtToken });
    }
  }
});

const authenticateUser = (request, response, next) => {
  let jwtToken;
  const authHead = request.headers["authorization"];
  if (authHead !== undefined) {
    const jwtToken = authHead.split(" ")[1];
  }
  if (jwtToken === undefined) {
    response.status(401);
    response.send("Invalid JWT Token");
  } else {
    jwt.verify(jwtToken, "MY_SECRET_TOKEN", async (error, payload) => {
      if (error) {
        response.status(401);
        response.send("Invalid JWT Token");
      } else {
        request.username = payload.username;
        next();
      }
    });
  }
};

app.post("/login/", authenticateUser, async (request, response) => {
  response.send("successfully Verified");
});

app.get("/states/", authenticateUser, async (request, response) => {
  const query = `select * from state;`;
  const statesList = await db.all(query);
  response.send(statesList);
});

app.get("/states/:stateId/", authenticateUser, async (request, response) => {
  const { stateId } = request.params;
  const query = `select * from state where state_id = '${stateId}';`;
  const stateItem = await db.get(query);
  response.send(stateItem);
});
