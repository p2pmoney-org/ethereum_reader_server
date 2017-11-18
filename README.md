# ethereum_reader_server
A node.js service on an ethereum node implementing a REST API to browse Ethereum blockchain.

## Getting Started

These instructions will let you install ethereum_reader_server on a machine already running as a client node to the ethereum network. 

### Prerequisites

You need to have a fully configured ethereum node (e.g. running a client such as geth or parity).
You need to have git and npm installed on that node.

### Installing

Connect through ssh to your node and go to the directory where you want to install your ethereum_reader_server. Then enter the following commands:

```
$ git clone https://github.com/p2pmoney-org/ethereum_reader_server
$ cd ./ethereum_reader_server
$ npm install
$ npm start
```

Your ethereum_reader_server will now be fully functional and it will listen on default port 13000 (connecting via default port 8545 in RPC with your ethereum client) to answer to REST requests.

Assuming your server http://example.com has port 13000 accessible, you can test in your browser:

```
http://example.com:13000/api/node
```
