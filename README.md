# Reciclame NodeJs WebSite
Web projecte developed and designed to have an administration part for the Reciclame Flutter App (https://github.com/danielb05/reciclame)

## Deployed
The website is deployed using heroku, thus u can find the Procfile.<br/>
<a href="https://reciclame-udl.herokuapp.com" target="_blank">reciclame-udl.herokuapp.com</a>

## Requirements

For development, you will only need Node.js and npm, installed in your environment.<br/>
You may also use Yarn if preferred.

### Node
- #### Node installation on Windows/MacOS

    Just go on  [oficcial Node.js website](https://nodejs.org) and download the installer.
    Also, be sure to have `git`available in your PATH, `npm` might need it (You can find git [here](https://git-scm.com))

    > Note: On MacOS you may also prefer to use `brew` by running `$ brew install node`

- #### Node installation on Ubuntu

    Easy. Just run:

        $ sudo apt install nodejs
        $ sudo apt install npm

- #### Other

    There is more information about the installtion on the [official Node.js website](https://nodejs.org/) and the [oficcial NPM website](https://npmjs.org).


If the installation was successful, you should be abel to run 

    $ node --version
    $ npm --version

Also, if you need to update `npm`, you can make it using `npm`! Cool right? After running the following command, just open again the command line and be happy.

    $ npm install -g npm

## Running the project

For development, as it is used `nodemon`, apply:

    $ npm dev

otherwise:

    $ npm start

### Simple build for production

    $ npm build

## Docker

To make the installation even easier, skipping the previous points,  just run

    $ docker-compose up

in this way you will use the original environment

> Note: remember to install [docker desktop](https://www.docker.com/products/docker-desktop)