<?php

const TEMP_ROOT = __DIR__ . '/temp';
const FILE_DIR = __DIR__ . '/files';

function get($n, $k, $d)
{
	if (!isset($n[$k])) return $d;
	$s = trim($n[$k]);
	if (!$s) return $d;
	return $s;
}

function all($a)
{
	foreach ($a as $v) if (!$v) return false;
	return true;
}

