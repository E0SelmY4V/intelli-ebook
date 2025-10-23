/// <reference path="../public/common.ts" />

initCallbackHandler({
	start: [noForm],
	finded: ['main'],
}, {
	finded: [Type.Object({ uid: Type.Number(), update_time: Type.String(), fid: Type.String() })],
});

