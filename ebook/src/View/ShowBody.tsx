import clsx from 'clsx';
import { Resizable } from 're-resizable';
import { Fragment, JSX, use, useState } from 'react';
import { Group, Serialized } from '../storage';
import Header from './Header';
import { IsMobileContext } from './render';
import ShowBodyText from './ShowBodyText';

export function HeaderBox({ showing, show, content, hidden, mobile }: {
	showing: number;
	show(idx: number): void;
	content: Group['content'];
	hidden: boolean;
	mobile: boolean;
}) {
	const isMobile = use(IsMobileContext);
	const headers = content.map(
		([header], idx) => <Fragment key={header}>
			<Header
				header={header}
				hidden={idx !== showing}
				show={() => show(idx)}
			/>
			<hr />
		</Fragment>,
	);
	return <div hidden={hidden || isMobile !== mobile}>
		<Resizable
			defaultSize={mobile
				? { width: '100%', height: '15vh' }
				: { width: '20vw', height: '100%' }
			}
			enable={{
				top: false,
				right: !mobile,
				bottom: mobile,
				left: false,
				topRight: false,
				bottomRight: false,
				bottomLeft: false,
				topLeft: false,
			}}
			handleClasses={{
				[mobile ? 'bottom' : 'right']: 'show_body_handle',
			}}
		>
			<div className={clsx('show_body', 'show_body_header_box')}>
				{headers}
			</div>
		</Resizable>
	</div>;
}

export default function ShowBody({ serialized, hidden }: {
	serialized: Serialized;
	hidden: boolean;
}): JSX.Element {
	const [showing, setShowing] = useState(-1);

	if (serialized.part === 'Page') {
		return <ShowBodyText html={serialized.html} hidden={hidden} />;
	}

	const { sum, content } = serialized;
	function show(idx: number) {
		setShowing(showing === idx ? -1 : idx);
	}
	return <>
		<ShowBody serialized={sum} hidden={hidden || showing !== -1} />
		{content.map(([header, body], idx) => {
			return <ShowBody serialized={body} hidden={hidden || showing !== idx} key={header} />;
		})}
		{[false, true].map((mobile, idx) => {
			const key = idx;
			return <HeaderBox hidden={!content.length || hidden} {...{ key, showing, show, content, mobile }} />;
		})}
	</>;
}
