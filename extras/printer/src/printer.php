<?php
require __DIR__ . "/../vendor/autoload.php";

use ElephantIO\Client;
use Oscar\Printer\SweetTicketPrinter;

$COMPANIES = ["puyu", "mecato", "one-piece", "codideep", "almos", "company"];
$RUCS = ["10164120517", "10164121611", "10164121611", "10164181826", "10009663318", "10004309451"];
function printMessage($color, $message)
{
    echo "\033[{$color}m{$message}\033[0m\n";
}


try {
    //conexión al servidor node
    $server_url = "http://localhost:3001";
    $client = new Client(Client::engine(Client::CLIENT_4X, $server_url));
    if (!$client) throw new Exception("El servidor no acepto la conexión");
    $client->initialize();

    $index = 2; //random_int(1, 6) - 1;
    $namespace = "/$COMPANIES[$index]-$RUCS[$index]";
    $client->emit("connect-printer", ["namespace" => $namespace]);
    $client->wait("connect-printer-success");
    $client->of($namespace);
    printMessage("33", "Conexión establecida con el namespace: $namespace");

    $packet = $client->wait("load-queue");
    printing($packet, $client);

    var_dump("aqui");
    while (true) {
        var_dump("aqui2");
        $packet = $client->wait("onprint");
        var_dump("aqui3");
        $tickets = json_decode($packet->data->data_str);
        var_dump($tickets);

        $n_tickets = count($tickets);
        echo "\n Recibio # $n_tickets";

        if (is_array($tickets)) {
            foreach ($tickets as $ticket) {
                $STPrinter = new SweetTicketPrinter($ticket);
                $STPrinter->printTicket();
            }
        } else {
            $STPrinter = new SweetTicketPrinter($tickets);
            $STPrinter->printTicket();
        }

        $client->emit("printed", ["namespace" => $packet->data->namespace]);
    }

} catch (\Throwable $th) {
    printMessage("31", $th->getMessage());
}

function printing($packet, $client)
{
    foreach ($packet->data as $key => $value) {
        $data = json_decode($value);
        $created_at = $data->created_at;
        $namespace = $data->namespace;
        $tickets = json_decode($data->data_str);


        echo "$key:";
        echo "\n\tcreated_at: $created_at";
        echo "\n\tnamespace: $namespace";

        $n_tickets = count($tickets);
        echo "\n Recibio # $n_tickets";
//        var_dump($response);

        if (is_array($tickets)) {
            foreach ($tickets as $ticket) {
                $STPrinter = new SweetTicketPrinter($ticket);
                $STPrinter->printTicket();
            }
        } else {
            $STPrinter = new SweetTicketPrinter($tickets);
            $STPrinter->printTicket();
        }

        $client->emit("printed", ["namespace" => $data->namespace]);
    }
}