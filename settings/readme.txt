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
"max_returned_transactions": 100,
"block_map_factor_size":20,
"max_block_map_factor_size":40,
"enable_anonymous_request_limit": 1,
"max_anonymous_request_limit_windows": 600000,
"max_anonymous_request_limit_limit": 10,
"apikeys": {"client1": "apikey1","client2": "apikey2"}
}