import express from "express";
import fetch from "node-fetch";
import redis from "redis";

const PORT = process.env.PORT || 8000;
const REDIS_PORT = process.env.PORT || 6379;

const client = redis.createClient(REDIS_PORT);
client.connect()

const app = express();

// set response
const setResponse = (username, repos) => {
    return `<h1>${username} has ${repos} Github repos</h1>`
}

// Make request ot Github for data
async function getRepos(req, res, next) {
    try {
        console.log("Fetching Data...");

        const { username } = req.params;

        const response = await fetch(`https://api.github.com/users/${username}`);

        const data = await response.json();

        const repos = data.public_repos;

        // set data to redis
        await client.setEx(username, 3600, repos);
        res.send(setResponse(username, repos));
    } catch (err) {
        console.error(err);
        res.status(500);
    }
}

// cache middleware
async function cache(req, res, next) {
    const { username } = req.params;

    const response = await client.get(username);

    if(response != null) {
        console.log(response);
        res.send(setResponse(username, response));
    } else {
        console.log(`did not find ${username} in redis`);
        next();
    }
}

app.get("/repos/:username", cache, getRepos);

app.listen(8000, () => {
    console.log(`server started on port ${PORT}`);
})
