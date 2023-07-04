<?php


namespace Oscar\Printer;

use Mike42\Escpos\Printer;
use Mike42\Escpos\EscposImage;
use Mike42\Escpos\PrintConnectors\NetworkPrintConnector;
use Mike42\Escpos\PrintConnectors\WindowsPrintConnector;
use Mike42\Escpos\PrintConnectors\CupsPrintConnector;

use chillerlan\QRCode\QRCode;
use chillerlan\QRCode\QROptions;
use Mike42\Escpos\PrintConnectors\FilePrintConnector;

class SweetTicketPrinter
{
    /**
     * @var Int
     */
    private $width = 42;
    /**
     * @var Object
     */
    private $printer;
    /**
     * @var string
     */
    private $type;
    /**
     * @var Printer
     */
    private $ticket;
    /**
     * @var int
     */
    private $times;
    /**
     * @var Object
     */
    private $data;

    public function __construct($data)
    {
        $this->printer = $data->printer;
        $this->type = $data->type;
        $this->data = $data->data;
        $this->times = $data->times;
    }

    public function init($printer)
    {
        $this->ticket = $this->connect($printer);
    }

    public function connect($printer, $only_check = FALSE)
    {
        $connector = null;
        try {
            switch ($printer->type) {
                case 'windows-usb':
                case 'smb':
                    $connector = new WindowsPrintConnector($printer->name_system);
                    break;

                case 'ethernet':
                    $connector = new NetworkPrintConnector($printer->name_system, $printer->port, 3);
                    break;

                case 'linux-usb':
                    $connector = new FilePrintConnector($printer->name_system);
                    break;

                case 'cups':
                    $connector = new CupsPrintConnector($printer->name_system);
                    break;

                default:
                    throw new \Exception("Tipo de ticketera no soportado");
                    break;
            }

            $ticket = new Printer($connector);

            if ($only_check)
                $ticket->close();
            else
                return $ticket;
        } catch (\Throwable $th) {
            throw new \Exception("No se pudo conectar con la tiketera");
        }
    }


    public function printTicket()
    {
        $this->init($this->printer);
        $times = $this->times;

        for ($i = 0; $i < $times; $i++) {
            $this->printLayout();
        }

        $this->ticket->close();
    }


    private function printLayout()
    {
        $this->header();
        switch ($this->type) {
            case 'invoice':
                $this->businessAdditional();
                $this->documentLegal();
                $this->ticket->feed(1);
                $this->customer();
                $this->ticket->feed(1);
                $this->additional();
                $this->ticket->feed(1);
                $this->items();
                $this->amounts();
                $this->additionalFooter();
                $this->finalMessage();
                $this->stringQR();

                $this->ticket->pulse();
                break;

            case 'note':
                $this->documentLegal();
                $this->ticket->feed(1);

                $this->customer();
                $this->additional();
                $this->ticket->feed(1);

                $this->detail();
                $this->total();
                break;

            case 'command':
                $this->ticket->feed(1);
                $this->productionArea();
                $this->ticket->feed(1);
                $this->textBackgroundInverted();
                $this->documentLegal();
                $this->additional();
                $this->ticket->feed(1);
                $this->items();
                break;

            case 'precount':
                $this->documentLegal();
                $this->ticket->feed(1);
                $this->additional();
                $this->ticket->feed(1);
                $this->items();
                $this->amounts();
                break;

            case 'extra':
                $this->ticket->feed(1);
                $this->titleExtra();
                $this->ticket->feed(1);
                $this->additional();
                $this->ticket->feed(1);
                $this->items();
                $this->amounts();
                break;

            default:
                throw new \Exception("No se pudo conectar con la tiketera");
                break;
        }

        $this->ticket->feed(4);
        $this->ticket->cut(Printer::CUT_PARTIAL);
        //$this->ticket->close();

    }

    /*----------  privates  ----------*/

    private function header()
    {
        if (isset($this->data->business->comercialDescription)) {
            if ($this->data->business->comercialDescription->type == 'text') {
                $this->ticket->setEmphasis(true);
                $this->ticket->setTextSize(2, 2);
                $this->ticket->text(str_pad(
                    strtoupper($this->data->business->comercialDescription->value),
                    $this->width / 2,
                    ' ',
                    STR_PAD_BOTH
                ));
                $this->ticket->setEmphasis(false);
                $this->ticket->setTextSize(1, 1);
            }
            if ($this->data->business->comercialDescription->type == 'img') {
                $logo = 'img/logo.png';

                if (!file_exists('img/logo.png'))
                    throw new \Exception("No se encontro el logo");

                $this->ticket->setJustification(Printer::JUSTIFY_CENTER);
                $qr = EscposImage::load($logo, false);
                $this->ticket->graphics($qr, Printer::IMG_DEFAULT);
                $this->ticket->setJustification(Printer::JUSTIFY_LEFT);
            }

            $this->ticket->feed(1);
        }

        if (isset($this->data->business->description)) {
            $this->ticket->text(str_pad(' ' . $this->data->business->description . ' ', $this->width, '*', STR_PAD_BOTH));
        }

        $this->ticket->feed(1);
    }

    private function titleExtra()
    {
        $this->ticket->setTextSize(2, 2);
        $this->ticket->text(str_pad($this->data->titleExtra->title, $this->width / 2, ' ', STR_PAD_BOTH));

        $this->ticket->setTextSize(1, 1);
        $this->ticket->feed(1);
        $this->ticket->text(str_pad($this->data->titleExtra->subtitle, $this->width, ' ', STR_PAD_BOTH));
        $this->ticket->feed(1);
    }
    private function businessAdditional()
    {
        if (!isset($this->data->business->additional))
            return;

        foreach ($this->data->business->additional as $additional) {
            $this->ticket->text(str_pad($additional, $this->width, ' ', STR_PAD_BOTH));
            $this->ticket->feed(1);
        }
    }

    private function productionArea()
    {
        $this->ticket->text(str_pad(" {$this->data->productionArea} ", $this->width, '#', STR_PAD_BOTH));
        $this->ticket->feed(1);
    }

    private function documentLegal()
    {
        $this->ticket->setEmphasis(true);

        switch ($this->type) {
            case 'invoice':
            case 'note':
            case 'command':
                if (is_object($this->data->document))
                    $this->ticket->text(str_pad($this->data->document->description . ' : ' . $this->data->document->identifier, $this->width, ' ', STR_PAD_BOTH));
                else
                    $this->ticket->text(str_pad($this->data->document . ' : ' . $this->data->documentId, $this->width, ' ', STR_PAD_BOTH));
                break;

            case 'precount':
                $this->ticket->setTextSize(2, 2);
                $this->ticket->text(str_pad(
                    strtoupper($this->data->document->description),
                    $this->width / 2,
                    ' ',
                    STR_PAD_BOTH
                ));
                $this->ticket->setTextSize(1, 1);
                break;
        }

        $this->ticket->feed(1);
        $this->ticket->setEmphasis(false);
    }

    private function textBackgroundInverted()
    {
        if (!isset($this->data->textBackgroundInverted))
            return;

        $this->ticket->setReverseColors(TRUE);
        $this->ticket->text(str_pad(" {$this->data->textBackgroundInverted} ", $this->width, ' ', STR_PAD_BOTH));
        $this->ticket->feed(1);
        $this->ticket->setReverseColors(FALSE);
    }

    private function customer()
    {
        if (!isset($this->data->customer))
            return;

        if ($this->data->customer) {
            $customer_rows = $this->data->customer;
            $this->ticket->setEmphasis(true);

            foreach ($customer_rows as $row) {
                $this->ticket->text(str_pad($row, $this->width, ' ', STR_PAD_RIGHT));
                $this->ticket->setEmphasis(false);
                $this->ticket->feed(1);
            }
        } else {
            $this->ticket->text(str_pad('--', $this->width, ' ', STR_PAD_RIGHT));
            $this->ticket->feed(1);
        }
    }

    private function additional()
    {
        if (!isset($this->data->additional))
            return;

        foreach ($this->data->additional as $additional) {
            $this->ticket->text(str_pad($additional, $this->width, ' ', STR_PAD_RIGHT));
            $this->ticket->feed(1);
        }
    }

    private function items()
    {
        if (!isset($this->data->items))
            return;

        $items = $this->data->items;
        $this->ticket->setEmphasis(true);

        if (isset($items[0]->quantity)) {
            $this->ticket->text(str_pad('CAN', 4, ' ', STR_PAD_LEFT));
            $this->ticket->text(str_pad(' DESCRIPCIÓN', 31, ' ', STR_PAD_RIGHT));
            $this->ticket->text(str_pad('TOTAL', 7, ' ', STR_PAD_RIGHT));
        } else {
            $this->ticket->text(str_pad('DESCRIPCIÓN', 36, ' ', STR_PAD_RIGHT));
            $this->ticket->text(str_pad('TOTAL', 7, ' ', STR_PAD_RIGHT));
        }

        $this->ticket->feed(1);
        $this->ticket->text(str_repeat('-', $this->width));
        $this->ticket->setEmphasis(false);
        $this->ticket->feed(1);

        foreach ($this->data->items as $item) {
            if (is_array($item->description)) {
                for ($i = 0; $i < count($item->description); $i++) {
                    $descriptionLength = 35;
                    $this->ticket->text(str_pad($item->description[$i], $descriptionLength, ' ', STR_PAD_RIGHT));

                    if ($i == 0) {
                        $this->ticket->text(str_pad($item->totalPrice, 7, ' ', STR_PAD_LEFT));
                        $descriptionLength = $this->width;
                    }
                    $this->ticket->feed(1);
                }
            } else {
                $descriptionLength = 31;
                $quantityLength = 4;

                $this->ticket->text(str_pad($item->quantity, $quantityLength, ' ', STR_PAD_LEFT));
                $this->ticket->text(str_pad(" " . $item->description, $descriptionLength, ' ', STR_PAD_RIGHT));

                if (isset($item->totalPrice))
                    $this->ticket->text(str_pad($item->totalPrice, 7, ' ', STR_PAD_LEFT));

                if (isset($item->commentary)) {
                    $this->ticket->feed(1);
                    $this->ticket->text(str_repeat(' ', 7));
                    $this->ticket->text(str_pad("=> " . $item->commentary, 35, ' ', STR_PAD_RIGHT));
                }
                $this->ticket->feed(1);
            }
        }

        $this->ticket->text(str_repeat('-', $this->width) . "\n");
    }

    private function amounts()
    {
        if (!isset($this->data->amounts))
            return;

        foreach ($this->data->amounts as $field => $value) {
            $this->ticket->text($this->total_align_text($field));
            $this->ticket->text($this->total_align_value($value));
            $this->ticket->feed(1);
        }

        $this->ticket->text(str_repeat('-', $this->width));
        $this->ticket->feed(1);
    }

    private function additionalFooter()
    {
        if (!isset($this->data->additionalFooter))
            return;

        foreach ($this->data->additionalFooter as $additionalFooter) {
            $this->ticket->text(str_pad($additionalFooter, $this->width, ' ', STR_PAD_RIGHT));
            $this->ticket->feed(1);
        }

        $this->ticket->text(str_repeat('-', $this->width));
        $this->ticket->feed(1);
    }

    private function total_align_text($param)
    {
        return str_pad($param, 35, " ", STR_PAD_LEFT);
    }

    private function total_align_value($param)
    {
        return str_pad($param, 7, ' ', STR_PAD_LEFT);
    }

    private function finalMessage()
    {
        if (!isset($this->data->finalMessage))
            return;

        $finalMessage = $this->data->finalMessage;
        if (!$finalMessage)
            return;

        if (is_array($finalMessage)) {
            foreach ($finalMessage as $message) {
                $this->ticket->text(str_pad($message, $this->width, ' ', STR_PAD_BOTH));
                $this->ticket->feed(1);
            }
        } else {
            $this->ticket->text(str_pad($this->data->finalMessage, $this->width, ' ', STR_PAD_BOTH));
            $this->ticket->feed(1);
        }
    }

    private function stringQR()
    {
        if (!isset($this->data->stringQR))
            return;

        $this->ticket->setJustification(Printer::JUSTIFY_CENTER);

        $options = new QROptions([
            'version'   => 10,
            'eccLevel'  => QRCode::ECC_Q,
            'scale'     => 4
        ]);

        //TO DO: Añadir codigo de qr nativo, revisando tipo de impresora

        if ($this->printer->name_system == '127.0.0.1' && $this->printer->type == 'ethernet') {
            $this->ticket->text($this->data->stringQR);
            $this->ticket->feed(1);
        } else {
            $qrGenerator = new QRCode($options);
            $qrGenerator->render($this->data->stringQR, 'img/qr.png');
            $qr = EscposImage::load('img/qr.png', false);
            $this->ticket->graphics($qr, Printer::IMG_DEFAULT);
        }
    }
}