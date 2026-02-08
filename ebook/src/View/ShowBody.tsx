import clsx from 'clsx';
import { Fragment, JSX, useState } from 'react';
import { Serialized } from '../storage';
import Header from './Header';
import ShowBodyText from './ShowBodyText';
import { Resizable } from 're-resizable';

export default function ShowBody({ serialized, hidden }: {
	serialized: Serialized;
	hidden: boolean;
}): JSX.Element {
	const [showing, setShowing] = useState(-1);

	if (serialized.part === 'Page') {
		return <ShowBodyText html={serialized.html} hidden={hidden} />;
	}

	const { sum, content } = serialized;
	return <>
		<ShowBody serialized={sum} hidden={hidden || showing !== -1} />
		{
			content.map(([header, body], idx) => <ShowBody serialized={body} hidden={hidden || showing !== idx} key={header} />)
		}
		<div hidden={hidden || !content.length}>
			<Resizable
				defaultSize={{ width: '20vw', height: '100%' }}
				enable={{
					top: false,
					right: true,
					bottom: false,
					left: false,
					topRight: false,
					bottomRight: false,
					bottomLeft: false,
					topLeft: false,
				}}
				handleClasses={{ right: 'show_body_handle' }}
			>
				<div className={clsx('show_body', 'show_body_header_box')}>
					{content.map(([header], idx) => <Fragment key={header}>
						<Header
							header={header}
							hidden={idx !== showing}
							show={() => setShowing(showing === idx ? -1 : idx)}
						/>
						<hr />
					</Fragment>)}
				</div>
			</Resizable>
		</div>
	</>;
}
