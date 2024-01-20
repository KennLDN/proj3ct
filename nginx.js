const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const configFile = path.join(__dirname, 'config.yaml');
const config = yaml.load(fs.readFileSync(configFile, 'utf8'));

const frontendPort = config.port_options.frontend_port;

const nginxConfContent = `server {
    listen ${frontendPort};

    location / {
        root   /usr/share/nginx/html;
        index  index.html index.htm;
    }
}`;

const nginxConfFile = path.join(__dirname, 'default.conf');
fs.writeFileSync(nginxConfFile, nginxConfContent, 'utf8');
console.log('Nginx default.conf file created/updated successfully.');
