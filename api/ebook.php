<?php

require_once __DIR__ . '/../scpo-php/db.php';
require_once __DIR__ . '/../scpo-php/errpage.php';
require_once __DIR__ . '/config.php';

use ScpoPHP\Db as Db;

[$ret, $end] = ScpoPHP\Errpage::get_ret('api/signup.php', $_POST['from']);

if (!session_start()) $ret('服务端无法使用 session');

if (!isset($_POST['step'])) $ret('没带请求');

switch ($_POST['step']) {
	case 'find':
		if (!isset($_POST['cid']) || !($cid = $_POST['cid'])) $ret('没有查询编号');

		$n = Db::select(['id' => $cid], 'id, uid, update_time, fid', 'metas');
		if (count($n) !== 1) {
			ob_start();
			var_dump($n);
			$dump = ob_get_clean();
			$ret("记录查询的不对: $dump");
		}

		$end(['finded', $n[0]]);
	default:
		$ret('当前在哪一步？');
}
