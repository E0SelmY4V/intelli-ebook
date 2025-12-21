/// <reference path="../../public/common.ts" />

import { groupifyAll } from './docproc';

const findedObjType = z.object({
	id: z.string(),
	uid: z.string(),
	update_time: z.string(),
	fid: z.string(),
});

initCallbackHandler({
	start: [noForm, () => {
		const cid = query.get('cid') ?? panic(Error('不知道用户要看什么章节'));
		gid('find_cid_input', 'input').value = cid;
		gid('find_submit_input', 'input').click();
	}],
	finded: ['main', render],
}, {
	finded: [findedObjType],
});

async function getContent(fid: string) {
	const res = await forceReq(`/api/upload/files/${fid}/index.json`);
	const json = await res.json().catch(panicable('文章 json 解析失败'));
	return panicable(
		() => PandocTypes.pandocJsonSchema.parse(json),
		'文章 json 不符合 schema',
		json,
	);
}
async function render({ fid }: z.infer<typeof findedObjType>) {
	const content = await getContent(fid);
	console.log(groupifyAll(content.blocks, 4));
}

