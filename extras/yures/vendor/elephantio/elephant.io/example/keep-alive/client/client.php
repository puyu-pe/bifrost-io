<?php

/**
 * This file is part of the Elephant.io package
 *
 * For the full copyright and license information, please view the LICENSE file
 * that was distributed with this source code.
 *
 * @copyright Wisembly
 * @license   http://www.opensource.org/licenses/MIT-License MIT License
 */

use ElephantIO\Client;
use Monolog\Level;
use Monolog\Logger;
use Monolog\Handler\StreamHandler;

require __DIR__ . '/../../../vendor/autoload.php';

$version = Client::CLIENT_4X;
$url = 'http://localhost:3000';
$event = 'message';

$logfile = __DIR__ . '/socket.log';
if (is_readable($logfile)) {
    @unlink($logfile);
}

// create a log channel
$logger = new Logger('client');
$logger->pushHandler(new StreamHandler($logfile, Level::Debug));

// create instance
echo sprintf("Connecting to %s\n", $url);
$client = new Client(Client::engine($version, $url), $logger);
$client->initialize();
$client->of('/keep-alive');

$timeout = 60; // in seconds
$start = microtime(true);
$sent = null;
while (true) {
    $now = microtime(true);
    if (null === $sent) {
        $sent = $now;
        $client->emit($event, ['message' => 'A message']);
        if ($retval = $client->wait($event)) {
            echo sprintf("Got a reply for first message: %s\n", json_encode($retval->data));
        }
    }
    if ($now - $start >= $timeout) {
        $client->emit($event, ['message' => 'Last message']);
        if ($retval = $client->wait($event)) {
            echo sprintf("Got a reply for last message: %s\n", json_encode($retval->data));
        }
        break;
    } else {
        $client->drain();
    }
    usleep(100);
}
$client->close();
