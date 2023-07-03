<?php
require __DIR__ . "/../vendor/autoload.php";

use ElephantIO\Client;

function printMessage($color, $message)
{
  echo "\033[{$color}m{$message}\033[0m\n";
}


$index = 2;//random_int(1, 6) - 1;
$COMPANIES = ["puyu", "mecato", "one-piece", "codideep", "almos", "company"];
$RUCS = ["10164120517", "10164121611", "10164121611", "10164181826", "10009663318", "10004309451"];
$data = [
  'ruc' => $RUCS[$index],
  'company' => $COMPANIES[$index],
  'data' => [
    [
      'price' => 3.90,
      'name' => 'nescafe',
      'others' => 'otros datos',
    ],
    [
      'price' => 3.90,
      'name' => 'nescafe',
      'others' => 'otros datos',
    ],
    [
      'price' => 3.90,
      'name' => 'nescafe',
      'others' => 'otros datos',
    ],
    [
      'price' => 3.90,
      'name' => 'nescafe',
      'others' => 'otros datos',
    ],
    [
      'price' => 3.90,
      'name' => 'nescafe',
      'others' => 'otros datos',
    ],
  ],
  'total' => 20.90,
];

function connect_server($url)
{
  $client = new Client(Client::engine(Client::CLIENT_4X, $url));
  if (!$client) return null;
  $client->initialize();
  return $client;
}

function connect_namespace($namespace, $client)
{
  $client->emit('connect-yures', ["namespace" => $namespace]);
  $client->wait('connect-yures-success');
}

try {
  $client = connect_server("http://localhost:3001");
  if (!$client) throw new Exception("El servidor no acepto la conexión");

  $namespace = "/$COMPANIES[$index]-$RUCS[$index]";

  connect_namespace($namespace, $client);
  $client->of($namespace);
  printMessage("33", "Conexión establecida con el namespace: $namespace");

  $client->emit('to_print', $data);

  if ($packet = $client->wait('onsave')) {
    $success = (bool) $packet->data['success'];
    if ($success)
      printMessage("34", "El servidor almaceno los datos satisfactoriamente");
    else
      printMessage("31", "El servidor no guardo los datos");
  }

  $client->close();

} catch (\Throwable $th) {
  printMessage("31", $th->getMessage());
}
