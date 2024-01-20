const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

function loadConfig() {
  const configFile = path.join(__dirname, 'config.yaml');
  return yaml.load(fs.readFileSync(configFile, 'utf8'));
}

function createFrontendService(config, environment) {
  const frontendPort = config.port_options.frontend_port;
  return environment === 'dev' ? {
    container_name: `${config.project_options.project_name}_frontend_dev`,
    image: 'node:latest',
    volumes: ['./frontend:/app'],
    working_dir: '/app',
    command: `/bin/sh -c "npx vite dev --port ${frontendPort} --host"`,
    ports: [`${frontendPort}:${frontendPort}`],
    networks: [config.network_options.network_name]
  } : {
    container_name: `${config.project_options.project_name}_frontend_prod`,
    image: 'nginx:latest',
    volumes: ['./frontend/dist:/usr/share/nginx/html', './default.conf:/etc/nginx/conf.d/default.conf'],
    working_dir: '/usr/share/nginx/html',
    networks: [config.network_options.network_name]
  };
}

function createBackendService(config, environment) {
  const backendPort = config.port_options.backend_port;
  let service = {
    container_name: `${config.project_options.project_name}_backend_${environment}`,
    image: 'node:latest',
    volumes: ['./backend:/app'],
    working_dir: '/app',
    command: 'npm start',
    networks: [config.network_options.network_name]
  };
  if (environment === 'dev') {
    service.ports = [`${backendPort}:${backendPort}`];
  }
  return service;
}

function createDatabaseService(config, environment) {
  const { mongodb_container, postgresql_container, postgresql_username, postgresql_password } = config.database_options;
  if (mongodb_container && postgresql_container) {
    throw new Error('Both MongoDB and PostgreSQL cannot be enabled at the same time.');
  }
  if (mongodb_container) {
    return {
      image: 'mongo',
      volumes: [`./db_${environment}:/data/db`],
      container_name: `${config.project_options.project_name}_db_${environment}`,
      networks: [config.network_options.network_name]
    };
  }
  if (postgresql_container) {
    return {
      image: 'postgres',
      volumes: [`./db_${environment}:/var/lib/postgresql/data`],
      container_name: `${config.project_options.project_name}_db_${environment}`,
      environment: {
        POSTGRES_USER: postgresql_username,
        POSTGRES_PASSWORD: postgresql_password
      },
      networks: [config.network_options.network_name]
    };
  }
}

function generateDockerCompose(environment) {
  const config = loadConfig();
  let dockerCompose = {
    version: '3.8',
    services: {
      frontend: createFrontendService(config, environment),
      backend: createBackendService(config, environment)
    },
    networks: {
      [config.network_options.network_name]: {
        external: true
      }
    }
  };
  const dbService = createDatabaseService(config, environment);
  if (dbService) {
    dockerCompose.services.db = dbService;
  }
  return dockerCompose;
}

function writeDockerComposeFile(dockerCompose, environment) {
  const dockerComposeFile = path.join(__dirname, `docker-compose.yml`);
  fs.writeFileSync(dockerComposeFile, yaml.dump(dockerCompose), 'utf8');
}

const environment = process.argv[2]; 
if (!environment || !['dev', 'prod'].includes(environment)) {
  console.error('Usage: node script.js <dev/prod>');
  process.exit(1);
}

try {
  const dockerCompose = generateDockerCompose(environment);
  writeDockerComposeFile(dockerCompose, environment);
  console.log(`docker-compose.yml created/updated successfully.`);
} catch (error) {
  console.error(`Error: ${error.message}`);
  process.exit(1);
}
