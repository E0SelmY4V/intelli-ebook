<?php

require 'scpo-php/db.php';

?><pre><?php
var_dump(ScpoPHP\Db::select('id>0', '*', 'metas'));
?></pre>

