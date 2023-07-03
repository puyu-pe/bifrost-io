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

namespace ElephantIO\Engine;

use InvalidArgumentException;

/**
 * Represents the data for a Session
 *
 * @author Baptiste Clavié <baptiste@wisembly.com>
 */
class Session
{
    /** @var integer session's id */
    private $id;

    /** @var integer session's last heartbeat */
    private $heartbeat;

    /** @var float[] session's and heartbeat's timeouts */
    private $timeouts;

    /** @var string[] supported upgrades */
    private $upgrades;

    /** @var integer maximum payload length */
    private $maxPayload;

    public function __construct($id, $interval, $timeout, array $upgrades, $maxPayload = null)
    {
        $this->id        = $id;
        $this->upgrades  = $upgrades;
        $this->timeouts  = ['timeout'  => (float)$timeout,
                            'interval' => (float)$interval];
        $this->maxPayload = $maxPayload;

        $this->resetHeartbeat();
    }

    /**
     * The property should not be modified, hence the private accessibility on them
     *
     * @param string $prop
     * @return mixed
     */
    public function __get($prop)
    {
        static $list = ['id', 'upgrades', 'maxPayload'];

        if (!\in_array($prop, $list)) {
            throw new InvalidArgumentException(\sprintf('Unknown property "%s" for the Session object. Only the following are availables : ["%s"]', $prop, \implode('", "', $list)));
        }

        return $this->$prop;
    }

    protected function getTime()
    {
        return \microtime(true);
    }

    /**
     * Get timeout.
     *
     * @return float
     */
    public function getTimeout()
    {
        return $this->timeouts['timeout'];
    }

    /**
     * Get interval.
     *
     * @return float
     */
    public function getInterval()
    {
        return $this->timeouts['interval'];
    }

    /**
     * Checks whether a new heartbeat is necessary, and does a new heartbeat if it is the case
     *
     * @return bool true if there was a heartbeat, false otherwise
     */
    public function needsHeartbeat()
    {
        if (0 < $this->timeouts['interval'] && $this->getTime() > ($this->timeouts['interval'] + $this->heartbeat - 5)) {
            $this->resetHeartbeat();

            return true;
        }

        return false;
    }

    /**
     * Reset heart beat.
     *
     * @return \ElephantIO\Engine\Session
     */
    public function resetHeartbeat()
    {
        $this->heartbeat = $this->getTime();

        return $this;
    }

    public function __toString()
    {
        return json_encode([
            'id' => $this->id,
            'heartbeat' => $this->heartbeat,
            'timeouts' => $this->timeouts,
            'upgrades' => $this->upgrades,
            'maxPayload' => $this->maxPayload,
        ]);
    }
}
