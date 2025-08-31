<?php

require_once __DIR__ . '/../scpo-php/getconfig.php';
require_once __DIR__ . '/../self/mysql.php';

use ScpoPHP\Config as Cfg;

new Cfg\Db(SQL_CONFIG + Cfg\Db::$now->params);
