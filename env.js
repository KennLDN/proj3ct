const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

function main() {
    const env = getEnvironment();
    const config = loadConfig('config.yaml');
    const projectName = getProjectName(config);
    const backendEnabled = config.project_options.backend_enabled;
    const httpsSetting = getHttpsSetting(config, env);

    if (backendEnabled) {
        const backendEnvContent = buildBackendEnvContent(projectName, config, httpsSetting, env);
        writeEnvFile(path.join(__dirname, 'backend', '.env'), backendEnvContent);
        console.log('Backend .env file created/updated successfully.');
    }

    const frontendEnvContent = buildFrontendEnvContent(projectName, config, httpsSetting, backendEnabled, env);
    writeEnvFile(path.join(__dirname, 'frontend', '.env'), frontendEnvContent);
    console.log('Frontend .env file created/updated successfully.');
}

function getEnvironment() {
    const env = process.argv[2];
    if (!env) {
        console.error('Usage: node env.js <dev/prod>');
        process.exit(1);
    }
    return env;
}

function loadConfig(filePath) {
    const configFile = path.join(__dirname, filePath);
    return yaml.load(fs.readFileSync(configFile, 'utf8'));
}

function getProjectName(config) {
    if (!config.project_options.project_name) {
        console.error('Project name not found in config.yaml');
        process.exit(1);
    }
    return config.project_options.project_name;
}

function getHttpsSetting(config, env) {
    return config.domain_options[env][`${env}_https`] || false;
}

function buildBackendEnvContent(projectName, config, httpsSetting, env) {
    let backendEnvContent = `PROJECT_NAME=${projectName}\n`;
    backendEnvContent += `PORT=${config.port_options.backend_port}\n`;
    backendEnvContent += `HTTPS=${httpsSetting}\n`;

    const dbDomain = getDatabaseDomain(config, projectName, env);
    if (dbDomain) {
        backendEnvContent += `DB_DOMAIN=${dbDomain}\n`;
    }

    return backendEnvContent;
}

function getDatabaseDomain(config, projectName, env) {
    if (config.database_options.mongodb_container) {
        return `${projectName}_db:27017`;
    } else if (config.database_options.postgresql_container) {
        return `${projectName}_db:5432`;
    }
    return '';
}

function buildFrontendEnvContent(projectName, config, httpsSetting, backendEnabled, env) {
    let frontendEnvContent = `PROJECT_NAME=${projectName}\n`;
    frontendEnvContent += `HTTPS=${httpsSetting}\n`;
    frontendEnvContent += `BACKEND_ENABLED=${backendEnabled}\n`;

    if (env !== 'prod') {
        frontendEnvContent += `PORT=${config.port_options.frontend_port}\n`;
    }

    frontendEnvContent += `DOMAIN=${config.domain_options[env].frontend_domain}\n`;

    if (backendEnabled) {
        const backendDomain = env === 'dev' ? `localhost:${config.port_options.backend_port}/api` : `${projectName}_db:${config.database_options.postgresql_container ? '5432' : '27017'}`;
        frontendEnvContent += `BACKEND_DOMAIN=${backendDomain}\n`;
    }

    return frontendEnvContent;
}

function writeEnvFile(filePath, content) {
    fs.writeFileSync(filePath, content);
}

main();