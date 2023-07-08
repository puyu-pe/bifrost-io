<?php
require __DIR__ . "/../vendor/autoload.php";

use ElephantIO\Client;
use Oscar\Printer\SweetTicketPrinter;

$COMPANIES = ["puyu", "mecato", "one-piece", "codideep", "almos", "company"];
$RUCS = ["10164120517", "10164121611", "10164121614", "10164181826", "10009663318", "10004309451"];
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
    $client->emit("yures-printer", [
        "namespace" => $namespace,
        "clientname" => "PRINTER"
    ]);

    $packet = $client->wait("yures-printer-status");
    if ($packet->data['status'] === "error") {
        throw new Exception($packet->data['message']);
    } else {
        printMessage("33", $packet->data['message']);
    }

    $client->of($namespace);

    $client->emit("printer:start", []);
    $packet = $client->wait("printer:load-queue");
    printMessage("32", $packet->data['message'] . " status: " . $packet->data['status']);

    printing($packet->data['data'], $client);
    while (true) {
        $client->of($namespace);
        $packet = $client->wait("printer:to-print");
        printing($packet->data["data"], $client);
    }
    // $client->close();
} catch (\Throwable $th) {
    printMessage("31", $th->getMessage());
    $client->close();
}

function printing($data, $client)
{
    foreach ($data as $id => $memObject) {
        $register = json_decode($memObject);
        $namespace = $register->namespace;
        $created_at = $register->created_at;
        $tickets = json_decode($register->tickets);


        echo "\nticket id: $id";
        echo "\n\tcreated_at: $created_at";
        echo "\n\tnamespace: $namespace";
        var_dump($tickets);
        //TODO: conocer la verdadera estructura de los tickets
        //$register->tickets es un objeto clave-valor para este ejemplo, depende de la estructura real de los datos
        // $n_tickets = count(#tickets);
        // echo "\n Recibido #$n_tickets";
        // if (is_array($tickets)) {
        //     foreach ($tickets as $ticket) {
        //         $STPrinter = new SweetTicketPrinter($ticket);
        //         $STPrinter->printTicket();
        //     }
        // } else {
        //     $STPrinter = new SweetTicketPrinter($tickets);
        //     $STPrinter->printTicket();
        // }

        $client->emit("printer:printed", ["key" => $id]);
    }
}
