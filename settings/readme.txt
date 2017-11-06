settings folder is used to store configuration file config.json

if you want to override default values, you can create a config.json file and change the default values show below

config.json
{
"service_name": "ethereum reader service",
"server_listening_port": 13000,
"route_root_path": "/api",
"web3_provider_url": "http://localhost",
"web3_provider_port": 8545,
"max_processed_blocks": 5000,
"max_returned_blocks": 2000,
"max_returned_transactions": 100
}