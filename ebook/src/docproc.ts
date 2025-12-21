/// <reference path="../../public/common.ts" />

import Block = PandocTypes.Block;
import Header = PandocTypes.Header;

function groupify(blocks: Block[], level: number) {
	const sum: Block[] = [];
	let grouping: Block[] | null = null;
	const groups = new Map<Header, Block[]>();
	for (const block of blocks) {
		if (block.t !== 'Header' || block.c[0] > level) {
			(grouping ?? sum).push(block);
			continue;
		}
		if (block.c[0] < level) panic(getError('解析等级小于内容等级', level, block, blocks));
		grouping = [];
		groups.set(block, grouping);
	}
	return { sum, groups };
}

export type GroupedBook = Grouped | Block[];
export interface Grouped {
	sum: Block[];
	content: Map<Header, GroupedBook>;
}
export function groupifyAll(blocks: Block[], least: number, levelNow = 2): GroupedBook {
	if (levelNow >= least) return blocks;
	const { sum, groups } = groupify(blocks, levelNow);
	return {
		sum,
		content: new Map(
			groups
				.entries()
				.map(([header, blocks]) => [header, groupifyAll(blocks, least, levelNow + 1)]),
		),
	};
}

