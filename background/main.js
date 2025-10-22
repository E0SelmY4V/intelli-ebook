/// <reference path="../public/dist/common.d.ts" />
/// <reference path="../public/dist/mods.d.ts" />

/**@type {string | null} */
let fid = null;

initCallbackHandler({
	start: ['upload', () => gid('status_check_input', 'input').click()],
	authed: ['upload', ([fidGot]) => fid = fidGot],
	uploadFailed: [noForm, ['上传失败', '请重新上传']],
	registFailed: ['upload', ['无法注册此内容', '请重新上传']],
	success: ['success', ([cid]) => gid('succ_url_a', 'a').href = `/ebook/?cid=${cid}`],
});

const pandoc = new mods.Pandoc(
	fetch('/public/lib/pandoc.wasm'),
	{ err: msg => wrong(Error(msg)) },
);
pandoc.init();

const uploader = new mods.Resumable({
	target: '/api/upload/trans.php',
	// @ts-ignore
	testTarget: '/api/upload/check.php',
	chunkSize: 800 * 1024, // 800 KB
	forceChunkSize: true,
	simultaneousUploads: 10,
	testChunks: true,
});
uploader.on('progress', () => gid('upload_progress', 'progress').value = uploader.progress() * 100);
uploader.on('complete', () => gid('uploaded_callback_input', 'input').click());
uploader.on('filesAdded', () => uploader.upload());

setOnload(() => {
	const docInput = gid('doc_input', 'input');
	const uploadButton = gid('upload_button', 'button');
	uploadButton.onclick = async () => {
		if (docInput.files === null) wrong(Error('你没选文件'));
		if (docInput.files.length > 1) wrong(Error('一次只能上传一个文件'));
		uploader.cancel();
		const { data, medias } = await pandoc.parse(
			`-f docx -t json --mathjax --extract-media=${fid}/`,
			await docInput.files[0].bytes(),
			`${fid}/media`,
		);
		medias.push(new File([data], 'index.json'));
		uploader.addFiles(medias);
	};
});


