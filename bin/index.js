#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const [, , projectRoot] = process.argv;
const packageJSON = require('../package.json');
const copyArray = ['src', 'webpack.config.js', 'README.md', '.babelrc'];
const root = path.resolve('');

console.log('Initializing...');

// 初始化
exec(`mkdir ${projectRoot} && cd ${projectRoot} && npm init -y`, error => {
  if (error) {
    return console.log(`Initialize failed, due to: ${error}`);
  }

  console.log('Initialized succeed!');

  const projectPackageJSONPath = `${projectRoot}/package.json`;
  const projectPackageJSON = require(projectPackageJSONPath);

  projectPackageJSON['scripts'] = packageJSON['scripts'];

  fs.writeFile(projectPackageJSONPath, JSON.stringify(projectPackageJSON, null, 2), error => error);

  console.log('Creating files...');

  const copyPromise = Promise.all(copyArray.map(file => {
    let action = `cp -R ${file} ${projectRoot}`;

    if (fs.lstatSync(path.join(root, file)).isDirectory()) {
      action = `mkdir ${projectRoot}/${file} && ` + action;
    }

    return new Promise((resolve, reject) => {
      exec(action, error => {
        if (error) {
          reject(`Create files failed, due to: ${error}`);
        }

        resolve();
      });
    });
  }));

  copyPromise
  .then(() => {
    console.log('Create files succeed!');

    const { dependencies, devDependencies } = packageJSON;

    const dependenciesString = Object.keys(dependencies).join(' ');
    const devDependenciesString = Object.keys(devDependencies).join(' ');

    console.log('Installing packages...');

    const npmInstallProcess = exec(`cd ${projectRoot} && npm i ${dependenciesString} -S && npm i ${devDependenciesString} -D`, (error, stdout) => {
      if (error) {
        return console.log(`Install packages failed, due: ${error}`);
      }


      console.log('Install packages success!');
      console.log(stdout);

      console.log('Now you can:')
      console.log(`cd ${projectRoot}`);
      console.log(`npm start`);
    });

    npmInstallProcess.stdout.pipe(process.stdout);
  })
  .catch(e => console.log(e));
});