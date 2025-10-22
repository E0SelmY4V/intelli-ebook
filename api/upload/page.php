<?php

require_once __DIR__ . '/../../scpo-php/db.php';
require_once __DIR__ . '/../../scpo-php/errpage.php';
require_once __DIR__ . '/../config.php';
require __DIR__ . '/dir.php';

use \ScpoPHP\Db as Db;

[$ret, $end] = ScpoPHP\Errpage::get_ret('api/upload.php', $_POST['from']);

if (!session_start()) $ret('服务端无法使用 session');

switch ($_POST['step']) {
	case 'auth':
		if (!isset($_SESSION['uid'])) $ret('你没登录');
		$fid = uniqid('', true);
		$_SESSION['fid'] = $fid;
		$end(json_encode(['authed', $fid]));
	case 'uploaded':
		if (!isset($_SESSION['fid'])) $ret('不知道上传的是什么');
		$fid = $_SESSION['fid'];
		if (!is_dir(FILE_DIR)) $end('["uploadFailed"]');
		if (!isset($_SESSION['uid'])) {
			$ret('你没登录');
		}
		$uid = $_SESSION['uid'];
		$cid = Db::insert([
			'uid' => $uid,
			'fid' => $fid,
		], 'metas', true);
		if (!$cid) {
			$end('["registFailed"]');
		}
		$end(json_encode(['success', $cid]));
	default:
		$ret('当前进行到上传的第几步了？');
}
