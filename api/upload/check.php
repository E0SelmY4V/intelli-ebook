<?php

require './dir.php';

$input = [
	(int)get($_GET, 'resumableChunkNumber', 0),
	(int)get($_GET, 'resumableChunkSize', 0),
	get($_GET, 'resumableIdentifier', ''),
];
[$no, $size, $id] = $input;

$file = TEMP_ROOT . "/$id/$no.part";

http_response_code(
	all($input)
		&& file_exists($file)
		&& filesize($file) === $size
		? 200
		: 404
);
