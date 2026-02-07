import clsx from 'clsx';

export default function Header({ header, hidden, show }: {
	header: string;
	hidden: boolean;
	show: () => void;
}) {
	return (
		<div
			className={clsx('show_header', hidden || 'show_header_clicked')}
			onClick={show}
		>
			{header}
		</div>
	);
}
