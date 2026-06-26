<?php

namespace OCA\Bookmarks\AppInfo;

use OCP\AppFramework\App;

class Application extends App {
    public function __construct() {
        parent::__construct('custom_monitor');
    }
}
