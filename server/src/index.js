const { SkyWayAuthToken, uuidV4, nowInSec } = require("@skyway-sdk/token");
const express = require("express");

const appId = "yourAppId"; // replace with your app id from the dashboard
const secret = "yourSecret"; // replace with your own secret from the dashboard

const clientUrl = "http://localhost:1234";

function createToken(appId, secret, roomName, memberName) {
  const token = new SkyWayAuthToken({
    jti: uuidV4(),
    iat: nowInSec(),
    exp: nowInSec() + 30 * 60, // 30分間
    scope: {
      app: {
        id: appId,
        turn: true,
        actions: ["read"],
        channels: [
          {
            name: roomName,
            actions: ["write"],
            members: [
              {
                name: memberName,
                actions: ["write"],
                publication: {
                  actions: ["write"],
                },
                subscription: {
                  actions: ["write"],
                },
              },
            ],
          },
        ],
      },
    },
  }).encode(secret);
  return token;
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((_, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

const sessions = new Map();

app.post("/create", async (req, res) => {
  const expectedAuthToken = "YourAuthToken";
  // リクエストの送信者が認証されているか確認
  const authToken = req.headers.authorization?.split(" ")[1];
  if (!authToken || authToken !== expectedAuthToken) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const roomName = uuidV4();
  const hostToken = createToken(appId, secret, roomName, "host");
  const guestToken = createToken(appId, secret, roomName, "guest");

  const hostSessionId = uuidV4();
  const guestSessionId = uuidV4();

  sessions.set(hostSessionId, {
    token: hostToken,
    roomName: roomName,
    memberName: "host",
  });
  sessions.set(guestSessionId, {
    token: guestToken,
    roomName: roomName,
    memberName: "guest",
  });

  const hostUrl = `${clientUrl}?sessionId=${hostSessionId}`;
  const guestUrl = `${clientUrl}?sessionId=${guestSessionId}`;
  res.json({ hostUrl, guestUrl });
});

app.get("/join/session/:sessionId", (req, res) => {
  const { sessionId } = req.params;
  if (!sessionId) {
    return res.status(400).json({ error: "sessionId is required" });
  }
  if (!sessions.has(sessionId)) {
    return res.status(404).json({ error: "session not found" });
  }
  const session = sessions.get(sessionId);
  sessions.delete(sessionId);
  res.send(session);
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
