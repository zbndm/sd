import { ExplorerLayoutMode, getExplorerStore, useExplorerStore } from '@sd/client';
import { ExplorerContext, ExplorerItem, FilePath } from '@sd/core';
import { useVirtualizer } from '@tanstack/react-virtual';
import { memo, useCallback, useLayoutEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useKey, useOnWindowResize, useWindowSize } from 'rooks';
import { useSnapshot } from 'valtio';

import FileItem from './FileItem';
import FileRow from './FileRow';
import { isPath } from './utils';

const TOP_BAR_HEIGHT = 50;
const GRID_TEXT_AREA_HEIGHT = 25;

interface Props {
	context: ExplorerContext;
	data: ExplorerItem[];
}

export const VirtualizedList: React.FC<Props> = ({ data, context }) => {
	const scrollRef = useRef<HTMLDivElement>(null);
	const innerRef = useRef<HTMLDivElement>(null);

	const [goingUp, setGoingUp] = useState(false);
	const [width, setWidth] = useState(0);

	const store = useExplorerStore();

	function handleWindowResize() {
		// so the virtualizer can render the correct number of columns
		setWidth(innerRef.current?.offsetWidth || 0);
	}
	useOnWindowResize(handleWindowResize);
	useLayoutEffect(() => handleWindowResize(), []);

	// sizing calculations
	const amountOfColumns = Math.floor(width / store.gridItemSize) || 8,
		amountOfRows =
			store.layoutMode === 'grid' ? Math.ceil(data.length / amountOfColumns) : data.length,
		itemSize =
			store.layoutMode === 'grid' ? store.gridItemSize + GRID_TEXT_AREA_HEIGHT : store.listItemSize;

	const rowVirtualizer = useVirtualizer({
		count: amountOfRows,
		getScrollElement: () => scrollRef.current,
		overscan: 500,
		estimateSize: () => itemSize,
		measureElement: (index) => itemSize
	});

	// TODO: Make scroll adjustment work with both list and grid layout, currently top bar offset disrupts positioning of list, and grid just doesn't work
	// useEffect(() => {
	// 	if (selectedRowIndex === 0 && goingUp) rowVirtualizer.scrollToIndex(0, { smoothScroll: false });

	// 	if (selectedRowIndex !== -1)
	// 		rowVirtualizer.scrollToIndex(goingUp ? selectedRowIndex - 1 : selectedRowIndex, {
	// 			smoothScroll: false
	// 		});
	// }, [goingUp, selectedRowIndex, rowVirtualizer]);

	useKey('ArrowUp', (e) => {
		e.preventDefault();
		setGoingUp(true);
		if (store.selectedRowIndex !== -1 && store.selectedRowIndex !== 0)
			getExplorerStore().selectedRowIndex = store.selectedRowIndex - 1;
	});

	useKey('ArrowDown', (e) => {
		e.preventDefault();
		setGoingUp(false);
		if (store.selectedRowIndex !== -1 && store.selectedRowIndex !== (data.length ?? 1) - 1)
			getExplorerStore().selectedRowIndex = store.selectedRowIndex + 1;
	});

	// const Header = () => (
	// 	<div>
	// 		{props.context.name && (
	// 			<h1 className="pt-20 pl-4 text-xl font-bold ">{props.context.name}</h1>
	// 		)}
	// 		<div className="table-head">
	// 			<div className="flex flex-row p-2 table-head-row">
	// 				{columns.map((col) => (
	// 					<div
	// 						key={col.key}
	// 						className="relative flex flex-row items-center pl-2 table-head-cell group"
	// 						style={{ width: col.width }}
	// 					>
	// 						<EllipsisHorizontalIcon className="absolute hidden w-5 h-5 -ml-5 cursor-move group-hover:block drag-handle opacity-10" />
	// 						<span className="text-sm font-medium text-gray-500">{col.column}</span>
	// 					</div>
	// 				))}
	// 			</div>
	// 		</div>
	// 	</div>
	// );

	return (
		<div style={{ marginTop: -TOP_BAR_HEIGHT }} className="w-full pl-2 cursor-default">
			<div ref={scrollRef} className="h-screen custom-scroll explorer-scroll">
				<div
					ref={innerRef}
					style={{
						height: `${rowVirtualizer.getTotalSize()}px`,
						marginTop: `${TOP_BAR_HEIGHT}px`
					}}
					className="relative w-full"
				>
					{rowVirtualizer.getVirtualItems().map((virtualRow) => (
						<div
							style={{
								height: `${virtualRow.size}px`,
								transform: `translateY(${virtualRow.start}px)`
							}}
							className="absolute top-0 left-0 flex w-full"
							key={virtualRow.key}
						>
							{store.layoutMode === 'list' ? (
								<WrappedItem
									kind="list"
									isSelected={store.selectedRowIndex === virtualRow.index}
									index={virtualRow.index}
									item={data[virtualRow.index]}
								/>
							) : (
								[...Array(amountOfColumns)].map((_, i) => {
									const index = virtualRow.index * amountOfColumns + i;
									const item = data[index];
									return (
										<div key={index} className="w-32 h-32">
											<div className="flex">
												{item && (
													<WrappedItem
														kind="grid"
														isSelected={store.selectedRowIndex === index}
														index={index}
														item={item}
													/>
												)}
											</div>
										</div>
									);
								})
							)}
						</div>
					))}
				</div>
			</div>
		</div>
	);
};

interface WrappedItemProps {
	item: ExplorerItem;
	index: number;
	isSelected: boolean;
	kind: ExplorerLayoutMode;
}

// Wrap either list item or grid item with click logic as it is the same for both
const WrappedItem: React.FC<WrappedItemProps> = memo(({ item, index, isSelected, kind }) => {
	const [_, setSearchParams] = useSearchParams();

	const onDoubleClick = useCallback(() => {
		if (isPath(item) && item.is_dir) setSearchParams({ path: item.materialized_path });
	}, [item, setSearchParams]);

	const onClick = useCallback(() => {
		getExplorerStore().selectedRowIndex = isSelected ? -1 : index;
	}, [isSelected, index]);

	if (kind === 'list') {
		return (
			<FileRow
				data={item}
				index={index}
				onClick={onClick}
				onDoubleClick={onDoubleClick}
				selected={isSelected}
			/>
		);
	}

	return (
		<FileItem
			data={item}
			index={index}
			onClick={onClick}
			onDoubleClick={onDoubleClick}
			selected={isSelected}
		/>
	);
});
