![proj3ct logo](https://x.kenn.pro/ZoWA8/xeNasAPU05.png/raw)

Proj3ct is a starter pack to easily setup a project environment. Through the config.yaml, you can decide whether or not you want a backend server, a mongodb/postgresql database, as well setup some static values to make everything easier.

.env files are automatically created in backend and frontend folders making it easy to access these static values, such as the production frontend domain and https status.

WARNING: You should never use the same project folder for both a dev and production instance! Create a new instance of the directory, one for prod and one for dev.

## How to Use
1. rename config.yaml.example and update to your needs
2. `npm run install-all`
3. `npm run dev` / `npm run prod`