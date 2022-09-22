import { MotiView } from 'moti';
import React, { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { LockClosedIcon } from 'react-native-heroicons/outline';
import { ChevronRightIcon, CogIcon, PlusIcon } from 'react-native-heroicons/solid';
import { useSnapshot } from 'valtio';
import { useBridgeMutation } from '~/hooks/rspc';
import tw from '~/lib/tailwind';
import { libraryStore, useCurrentLibrary } from '~/stores/libraryStore';

import { AnimatedHeight } from '../animation/layout';
import Dialog from '../layout/Dialog';
import Divider from '../primitive/Divider';
import { TextInput } from '../primitive/Input';

// TODO: Maybe minimize this when drawer is closed?
const DrawerLibraryManager = () => {
	const [dropdownClosed, setDropdownClosed] = useState(true);

	// Init Libraries
	const { initLibraries, switchLibrary } = useSnapshot(libraryStore);
	const { currentLibrary, libraries, currentLibraryUuid } = useCurrentLibrary();

	useEffect(() => {
		if (libraries && !currentLibraryUuid) initLibraries(libraries);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [libraries, currentLibraryUuid]);

	// Create Library
	const [libName, setLibName] = useState('');

	const [createLibOpen, setCreateLibOpen] = useState(false);

	const { mutate: createLibrary, isLoading: createLibLoading } = useBridgeMutation(
		'library.create',
		{
			onSuccess: () => {
				// Reset form
				setLibName('');
			},
			onSettled: () => {
				// Close create lib dialog
				setCreateLibOpen(false);
			}
		}
	);

	return (
		<View>
			<Pressable onPress={() => setDropdownClosed((v) => !v)}>
				<View
					style={tw.style(
						'flex flex-row justify-between items-center px-3 h-10 w-full bg-gray-500 border border-[#333949] bg-opacity-40 shadow-sm',
						dropdownClosed ? 'rounded' : 'rounded-t border-b-gray-550'
					)}
				>
					<Text style={tw`text-gray-200 text-sm font-semibold`}>{currentLibrary?.config.name}</Text>
					<MotiView
						animate={{
							rotateZ: dropdownClosed ? '0deg' : '90deg'
						}}
						transition={{ type: 'timing' }}
					>
						<ChevronRightIcon size={18} style={tw`text-gray-200 ml-2`} />
					</MotiView>
				</View>
			</Pressable>
			<AnimatedHeight hide={dropdownClosed}>
				<View
					style={tw`py-2 px-2 bg-gray-500 border-l border-b border-r border-[#333949] bg-opacity-40 rounded-b`}
				>
					{/* Libraries */}
					{libraries?.map((library) => (
						<Pressable key={library.uuid} onPress={() => switchLibrary(library.uuid)}>
							<View
								style={tw.style(
									'p-2',
									library.uuid === currentLibraryUuid && 'bg-gray-500 bg-opacity-70 rounded'
								)}
							>
								<Text style={tw`text-sm text-gray-200 font-semibold`}>{library.config.name}</Text>
							</View>
						</Pressable>
					))}
					<Divider style={tw`mt-2 mb-2`} />
					{/* Menu */}
					<Pressable onPress={() => console.log('settings')}>
						<View style={tw`flex flex-row items-center px-1.5 py-[8px]`}>
							<CogIcon size={18} style={tw`text-gray-100 mr-2`} />
							<Text style={tw`text-sm text-gray-200 font-semibold`}>Library Settings</Text>
						</View>
					</Pressable>
					{/* Create Library */}
					<Dialog
						isVisible={createLibOpen}
						setIsVisible={setCreateLibOpen}
						title="Create New Library"
						description="Choose a name for your new library, you can configure this and more settings from the library settings later on."
						ctaLabel="Create"
						ctaAction={() => createLibrary(libName)}
						trigger={
							<View style={tw`flex flex-row items-center px-1.5 py-[8px]`}>
								<PlusIcon size={18} style={tw`text-gray-100 mr-2`} />
								<Text style={tw`text-sm text-gray-200 font-semibold`}>Add Library</Text>
							</View>
						}
					>
						<TextInput
							value={libName}
							onChangeText={(text) => setLibName(text)}
							placeholder="My Cool Library"
						/>
					</Dialog>
					<Pressable onPress={() => console.log('lock')}>
						<View style={tw`flex flex-row items-center px-1.5 py-[8px]`}>
							<LockClosedIcon size={18} style={tw`text-gray-100 mr-2`} />
							<Text style={tw`text-sm text-gray-200 font-semibold`}>Lock</Text>
						</View>
					</Pressable>
				</View>
			</AnimatedHeight>
		</View>
	);
};

export default DrawerLibraryManager;
