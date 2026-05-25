const https = require("https");

function gql(query, variables) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ query, variables });
    const req = https.request({
      hostname: "exp.host",
      path: "/--/graphql",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": data.length,
        "User-Agent": "Expo-CLI/1.0"
      }
    }, res => {
      let body = "";
      res.on("data", c => body += c);
      res.on("end", () => {
        try { resolve(JSON.parse(body)); } catch { resolve(body); }
      });
    });
    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

async function main() {
  const ts = Date.now();
  const email = "loanapp" + ts + "@temp.com";
  const password = "LoanHelper2025!";

  const mutations = [
    ["signUp", `mutation($email: String!, $password: String!) { signUp(email: $email, password: $password) { id } }`],
    ["register", `mutation($email: String!, $password: String!) { register(email: $email, password: $password) { id } }`],
    ["createUser", `mutation($email: String!, $password: String!) { createUser(email: $email, password: $password) { id } }`],
    ["signup", `mutation($email: String!, $password: String!) { signup(email: $email, password: $password) { id } }`],
    ["userRegister", `mutation($email: String!, $password: String!) { userRegister(email: $email, password: $password) { id } }`],
  ];

  for (const [name, query] of mutations) {
    try {
      const r = await gql(query, { email, password });
      const hasData = r.data && Object.values(r.data)[0];
      if (hasData) {
        console.log("SUCCESS with", name, JSON.stringify(r.data));
        return;
      }
    } catch(e) { /* ignore */ }
  }

  // Try REST API
  console.log("GraphQL failed, trying REST API...");
  const endpoints = [
    "https://expo.dev/accounts/signUp",
    "https://api.expo.dev/v2/auth/createOrLoginAsync",
    "https://exp.host/register",
  ];

  for (const url of endpoints) {
    try {
      await new Promise((resolve, reject) => {
        const data = JSON.stringify({ email, password });
        const u = new URL(url);
        const req = https.request({
          hostname: u.hostname, path: u.pathname, method: "POST",
          headers: { "Content-Type": "application/json" }
        }, res => {
          let body = "";
          res.on("data", c => body += c);
          res.on("end", () => {
            console.log(url, "->", res.statusCode, body.slice(0, 200));
            resolve();
          });
        });
        req.on("error", reject);
        req.write(data);
        req.end();
      });
    } catch(e) { console.log(url, "error:", e.message); }
  }
}
main();
