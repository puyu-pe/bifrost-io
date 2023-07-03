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

namespace ElephantIO\Payload;

use PHPUnit\Framework\TestCase;

class PayloadTest extends TestCase
{
    protected function encodeDecode($sz, $filename)
    {
      $payload = file_get_contents($filename);
      $encoder = new Encoder($payload, Decoder::OPCODE_TEXT, false);
      $encoded = (string) $encoder;
      $decoder = new Decoder($encoded);
      $decoded = (string) $decoder;
      $this->assertEquals($payload, $decoded, 'Properly encode and decode payload '.$sz.' content');
    }

    public function testPayload7D()
    {
      $this->encodeDecode('125-bytes', __DIR__.'/data/payload-7d.txt');
    }

    public function testPayloadFFFF()
    {
      $this->encodeDecode('64-kilobytes', __DIR__.'/data/payload-ffff.txt');
    }

    public function testPayloadAboveFFFF()
    {
      $this->encodeDecode('100-kilobytes', __DIR__.'/data/payload-100k.txt');
    }
}