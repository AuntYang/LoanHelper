const fs = require("fs");
const path = require("path");

const fixes = {
  "expo-modules-core": "./index.js",
  "expo": "./build/Expo.js",
  "expo-file-system": "./build/index.js",
  "expo-asset": "./build/index.js",
  "expo-font": "./build/index.js",
  "expo-constants": "./build/index.js",
  "expo-splash-screen": "./build/index.js"
};

for (const [name, main] of Object.entries(fixes)) {
  const pkgPath = path.join(__dirname, "node_modules", name, "package.json");
  if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
    if (pkg.main && pkg.main.endsWith(".ts")) {
      pkg.main = main;
      fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
      console.log(`Fixed ${name}: main -> ${main}`);
    }
  }
}
