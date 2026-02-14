import { Suspense, use, useState } from 'react';
import { Serialized } from '../storage';
import ShowBody from './ShowBody';
import { isMobile, IsMobileContext } from './render';

export function NonWaitingView({ serializedPromise }: {
	serializedPromise: Promise<Serialized>;
}) {
	const serialized = use(serializedPromise);
	return <ShowBody serialized={serialized} hidden={false} />;
}

export default function View({ serializedPromise }: {
	serializedPromise: Promise<Serialized>;
}) {
	const [isMobileNow, setIsMobileNow] = useState(use(IsMobileContext));
	window.addEventListener('resize', () => {
		setIsMobileNow(isMobile());
	});
	return (
		<IsMobileContext value={isMobileNow}>
			<Suspense fallback={<h1>正在加载</h1>}>
				<NonWaitingView serializedPromise={serializedPromise} />
			</Suspense>
		</IsMobileContext>
	);
}
