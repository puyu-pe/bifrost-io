<?php
require __DIR__ . "/../vendor/autoload.php";

use ElephantIO\Client;

function printMessage($color, $message)
{
  echo "\033[{$color}m{$message}\033[0m\n";
}


$index = 2; //random_int(1, 6) - 1;
$COMPANIES = ["puyu", "mecato", "one-piece", "codideep", "almos", "company"];
$RUCS = ["10164120517", "10164121611", "10164121614", "10164181826", "10009663318", "10004309451"];
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
  $client->emit('yures-printer', [
    "namespace" => $namespace,
    "clientname" => "YURES"
  ]);
  $packet = $client->wait('yures-printer-status');
  printMessage("33", $packet->data['message']);
}

try {
  $client = connect_server("http://localhost:3001");
  if (!$client) throw new Exception("El servidor no acepto la conexión");

  $namespace = "/$COMPANIES[$index]-$RUCS[$index]";

  connect_namespace($namespace, $client);
  $client->of($namespace);
  printMessage("33", "Conexión establecida con el namespace: $namespace");

  $client->emit('yures:save-print', $data);

  if ($packet = $client->wait('yures:save-print-status')) {
    $success =  $packet->data['success'] === "success";
    if ($success)
      printMessage("34", $packet->data['message']);
    else
      printMessage("31", $packet->data['message']);
  }

  $client->close();
} catch (\Throwable $th) {
  printMessage("31", $th->getMessage());
}
