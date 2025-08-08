<?php

require 'scpo-php/config.default.php';
require 'self/mysql.php';

foreach (SQL_CONFIG as $key => $value) \ScpoPHP\Config\Db::$params[$key] = $value;
