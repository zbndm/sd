import { Listbox as ListboxPrimitive } from '@headlessui/react';
import { CheckIcon, SunIcon } from '@heroicons/react/24/solid';
import clsx from 'clsx';
import { useEffect, useState } from 'react';

interface ListboxOption {
	option: string;
	description?: string;
	key: string;
}

export default function Listbox(props: { options: ListboxOption[]; className?: string }) {
	const [selected, setSelected] = useState(props.options[0]);

	useEffect(() => {
		if (!selected) {
			setSelected(props.options[0]);
		}
	}, [props.options, selected]);

	return (
		<>
			<ListboxPrimitive value={selected} onChange={setSelected}>
				<div className="relative w-full">
					<ListboxPrimitive.Button
						className={clsx(
							`relative w-full py-2 pl-3 pr-10 text-left bg-white dark:bg-gray-500 
								rounded-lg shadow-md cursor-default focus:outline-none focus-visible:ring-2 
								focus-visible:ring-opacity-75 focus-visible:ring-white focus-visible:ring-offset-orange-300 
								focus-visible:ring-offset-2 focus-visible:border-indigo-500 sm:text-sm`,
							props.className
						)}
					>
						{selected?.option ? (
							<span className="block truncate">{selected?.option}</span>
						) : (
							<span className="block truncate opacity-70">Nothing selected...</span>
						)}

						<span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
							<SunIcon className="w-5 h-5 text-gray-400" aria-hidden="true" />
						</span>
					</ListboxPrimitive.Button>

					<ListboxPrimitive.Options
						className={`
							absolute w-full mt-1 overflow-auto rounded-md sm:text-sm
							text-base bg-white dark:bg-gray-500 shadow-lg max-h-60 
							ring-1 ring-black ring-opacity-5 focus:outline-none
						`}
					>
						{props.options.map((option, index) => (
							<ListboxPrimitive.Option
								key={option.key}
								className={({ active }) =>
									`cursor-default select-none relative rounded m-1 py-2 pl-8 pr-4 dark:text-white focus:outline-none  ${
										active
											? 'text-primary-900 bg-primary-600'
											: 'text-gray-900 dark:hover:bg-gray-600 dark:hover:bg-opacity-20'
									}`
								}
								value={option}
							>
								{({ selected }) => (
									<>
										<span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
											{option.option}
											{option.description && (
												<span
													className={clsx(
														'text-gray-300 leading-5 ml-3 text-xs',
														selected && 'text-white'
													)}
												>
													{option.description}
												</span>
											)}
										</span>

										{selected ? (
											<span className="absolute inset-y-0 left-0 flex items-center pl-2 text-white">
												<CheckIcon className="w-5 h-5" aria-hidden="true" />
											</span>
										) : null}
									</>
								)}
							</ListboxPrimitive.Option>
						))}
					</ListboxPrimitive.Options>
				</div>
			</ListboxPrimitive>
		</>
	);
}
